'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RoutingDecision, PRESET_QUERIES, routeQuery } from '../utils/routerEngine';

interface BatchSimulatorProps {
  thresholds: { nano: number; flash: number; pro: number };
  onNewResult: (result: RoutingDecision) => void;
  onClearHistory: () => void;
  currentHistoryCount: number;
}

export default function BatchSimulator({
  thresholds,
  onNewResult,
  onClearHistory,
  currentHistoryCount,
}: BatchSimulatorProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [simSpeed, setSimSpeed] = useState(600); // ms delay
  const [logs, setLogs] = useState<{ id: string; query: string; modelName: string; modelColor: string; cost: number; latency: number; category: string }[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  const totalQueries = PRESET_QUERIES.length;

  const startSimulation = () => {
    if (currentIndex >= totalQueries) {
      // Reset if completed
      setCurrentIndex(0);
      setLogs([]);
      onClearHistory();
    }
    setIsRunning(true);
  };

  const pauseSimulation = () => {
    setIsRunning(false);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setCurrentIndex(0);
    setLogs([]);
    onClearHistory();
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (currentIndex < totalQueries) {
          const queryItem = PRESET_QUERIES[currentIndex];
          const decision = routeQuery(queryItem.text, thresholds);
          
          onNewResult(decision);

          // Add to local terminal log
          setLogs((prev) => [
            {
              id: `${currentIndex}-${Date.now()}`,
              query: decision.query,
              modelName: decision.model.name,
              modelColor: decision.model.color,
              cost: decision.cost,
              latency: decision.latency,
              category: decision.reason.split(' ')[0], // extracts quick intent category
            },
            ...prev,
          ]);

          setCurrentIndex((prev) => prev + 1);
        } else {
          setIsRunning(false);
        }
      }, simSpeed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, currentIndex, thresholds, simSpeed]);

  // Autoscroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0; // keeps latest on top (or scroll to bottom if list is reversed, we prepend here so top is latest)
    }
  }, [logs]);

  const progressPercent = (currentIndex / totalQueries) * 100;

  return (
    <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '4px', background: 'linear-gradient(to right, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Batch Simulator
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Run a workload sequence of {totalQueries} preset queries to analyze long-term cost benefits.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
        {!isRunning ? (
          <button
            onClick={startSimulation}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            ▶️ {currentIndex > 0 ? 'Resume' : 'Start Simulation'}
          </button>
        ) : (
          <button
            onClick={pauseSimulation}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', borderColor: 'var(--color-pro)' }}
          >
            ⏸️ Pause
          </button>
        )}

        <button
          onClick={resetSimulation}
          className="btn-secondary"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          disabled={currentHistoryCount === 0 && currentIndex === 0}
        >
          🔄 Reset
        </button>

        {/* Speed Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Speed:</span>
          <input
            type="range"
            min="100"
            max="1500"
            step="100"
            value={1600 - simSpeed} // invert slider direction: left is slow, right is fast
            onChange={(e) => setSimSpeed(1600 - parseInt(e.target.value))}
            style={{ width: '80px', height: '4px' }}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '35px', textAlign: 'right' }}>
            {((1600 - simSpeed) / 1000).toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Progress: {currentIndex} / {totalQueries} queries</span>
          <span style={{ fontWeight: 600 }}>{progressPercent.toFixed(0)}%</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
          <div 
            style={{ 
              background: 'linear-gradient(to right, var(--color-flash), var(--color-pro))', 
              width: `${progressPercent}%`, 
              height: '100%', 
              transition: 'width 0.2s ease' 
            }} 
          />
        </div>
      </div>

      {/* Simulator Terminal Logs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Routing Stream Log:
          </span>
          {logs.length > 0 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>
              Showing last {logs.length} entries
            </span>
          )}
        </div>

        <div 
          ref={logContainerRef}
          style={{ 
            background: 'rgba(3, 2, 10, 0.8)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '8px', 
            height: '180px', 
            overflowY: 'auto', 
            padding: '10px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: '0.75rem',
            position: 'relative'
          }}
        >
          {logs.length === 0 ? (
            <div style={{ margin: 'auto', color: 'var(--text-dark)', fontSize: '0.8rem', textAlign: 'center' }}>
              Terminal idle.<br />Click &quot;Start Simulation&quot; to begin stream.
            </div>
          ) : (
            logs.map((log) => (
              <div 
                key={log.id} 
                className="animate-scale-in"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px', 
                  borderBottom: '1px solid rgba(255,255,255,0.03)', 
                  paddingBottom: '8px' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: log.modelColor, fontWeight: 700 }}>
                    [{log.modelName}]
                  </span>
                  <span style={{ color: 'var(--text-dark)' }}>➔</span>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                    &quot;{log.query}&quot;
                  </span>
                  <span style={{ marginLeft: 'auto', color: '#10b981', fontWeight: 600 }}>
                    ${log.cost.toFixed(6)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.65rem', color: 'var(--text-dark)' }}>
                  <span>Latency: {log.latency}ms</span>
                  <span>•</span>
                  <span>Category: {log.category}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
