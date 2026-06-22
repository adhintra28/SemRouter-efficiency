'use client';

import React, { useState } from 'react';
import { Model } from '../utils/routerEngine';

interface HistoryLineChartsProps {
  runHistory: Array<{
    timestamp: string;
    query: string;
    isHybrid: boolean;
    results: Record<string, { cost: number; latency: number; name: string }>;
  }>;
  enabledModelIds: string[];
  modelSpecs: Record<string, Model>;
  intersectionModelIds: string[];
  isEnlarged?: boolean;
  onToggleEnlarge?: () => void;
}

export default function HistoryLineCharts({
  runHistory,
  enabledModelIds,
  modelSpecs,
  intersectionModelIds,
  isEnlarged = false,
  onToggleEnlarge,
}: HistoryLineChartsProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    modelId: string;
    modelName: string;
    val: number;
    x: number;
    y: number;
    query: string;
    type: 'cost' | 'latency';
  } | null>(null);

  if (runHistory.length === 0 || enabledModelIds.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        No historical data yet. Run queries to see real-time performance trends.
      </div>
    );
  }

  // Adjust SVG size based on enlargement
  const svgWidth = isEnlarged ? 480 : 280;
  const svgHeight = isEnlarged ? 140 : 120;
  
  const paddingLeft = isEnlarged ? 60 : 50;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 22;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;
  const pointsCount = runHistory.length;

  // Helper to format cost decimals
  const formatCost = (num: number) => {
    if (num === 0) return '$0.00';
    if (num < 0.0001) return `$${num.toFixed(6)}`;
    if (num < 0.001) return `$${num.toFixed(5)}`;
    return `$${num.toFixed(4)}`;
  };

  // ------------------
  // COST GRAPH MATH
  // ------------------
  let maxCost = 0.0001;
  const minCost = 0;

  runHistory.forEach(run => {
    enabledModelIds.forEach(mId => {
      const data = run.results[mId];
      if (data) {
        if (data.cost > maxCost) maxCost = data.cost;
      }
    });
  });
  maxCost = maxCost * 1.15;

  // ------------------
  // LATENCY GRAPH MATH
  // ------------------
  let maxLatency = 100;
  let minLatency = Infinity;

  runHistory.forEach(run => {
    enabledModelIds.forEach(mId => {
      const data = run.results[mId];
      if (data) {
        if (data.latency > maxLatency) maxLatency = data.latency;
        if (data.latency < minLatency) minLatency = data.latency;
      }
    });
  });
  if (minLatency === Infinity) minLatency = 0;
  maxLatency = Math.ceil(maxLatency * 1.15);
  minLatency = Math.max(0, Math.floor(minLatency * 0.85));
  if (maxLatency === minLatency) maxLatency += 100;

  const getCoordinates = (index: number, val: number, type: 'cost' | 'latency') => {
    const x = paddingLeft + (index / Math.max(1, pointsCount - 1)) * chartW;
    let y = 0;
    if (type === 'cost') {
      y = svgHeight - paddingBottom - ((val - minCost) / Math.max(0.000001, maxCost - minCost)) * chartH;
    } else {
      y = svgHeight - paddingBottom - ((val - minLatency) / Math.max(1, maxLatency - minLatency)) * chartH;
    }
    return { x, y };
  };

  const renderGridLines = (type: 'cost' | 'latency') => {
    const lines = [];
    const steps = 3;
    const minVal = type === 'cost' ? minCost : minLatency;
    const maxVal = type === 'cost' ? maxCost : maxLatency;

    for (let i = 0; i <= steps; i++) {
      const val = minVal + (i / steps) * (maxVal - minVal);
      const y = svgHeight - paddingBottom - (i / steps) * chartH;
      
      lines.push(
        <g key={i}>
          <line
            x1={paddingLeft}
            y1={y}
            x2={svgWidth - paddingRight}
            y2={y}
            stroke="var(--border-color)"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
          <text
            x={paddingLeft - 6}
            y={y + 3}
            textAnchor="end"
            fontSize={isEnlarged ? '11' : '9'}
            fill="var(--text-main)"
            fontFamily="monospace"
          >
            {type === 'cost' ? formatCost(val) : `${Math.round(val)}ms`}
          </text>
        </g>
      );
    }

    runHistory.forEach((run, idx) => {
      const x = paddingLeft + (idx / Math.max(1, pointsCount - 1)) * chartW;
      lines.push(
        <g key={`v-${idx}`}>
          <line
            x1={x}
            y1={paddingTop}
            x2={x}
            y2={svgHeight - paddingBottom}
            stroke="var(--border-color)"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
          <text
            x={x}
            y={svgHeight - 6}
            textAnchor="middle"
            fontSize={isEnlarged ? '11' : '9'}
            fill="var(--text-main)"
          >
            R{idx + 1}
          </text>
        </g>
      );
    });

    return lines;
  };

  const renderLinesAndNodes = (type: 'cost' | 'latency') => {
    const elements: React.JSX.Element[] = [];

    enabledModelIds.forEach(mId => {
      const mSpec = modelSpecs[mId];
      if (!mSpec) return;

      const points: Array<{ x: number; y: number; val: number; query: string }> = [];
      runHistory.forEach((run, idx) => {
        const data = run.results[mId];
        if (data) {
          const val = type === 'cost' ? data.cost : data.latency;
          const { x, y } = getCoordinates(idx, val, type);
          points.push({ x, y, val, query: run.query });
        }
      });

      if (points.length === 0) return;

      let pathD = '';
      points.forEach((p, idx) => {
        if (idx === 0) {
          pathD += `M ${p.x} ${p.y}`;
        } else {
          pathD += ` L ${p.x} ${p.y}`;
        }
      });

      const isIntersection = intersectionModelIds.includes(mId);
      const strokeColor = mSpec.color;

      elements.push(
        <g key={mId}>
          {isIntersection && (
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="4"
              opacity="0.18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth={isIntersection ? '2.2' : '1.2'}
            opacity={isIntersection ? '1.0' : '0.45'}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: 'all 0.3s ease' }}
          />
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={isIntersection ? '3.5' : '2.5'}
              fill={strokeColor}
              stroke="var(--bg-card)"
              strokeWidth="1"
              opacity={isIntersection ? '1.0' : '0.75'}
              style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
              onMouseEnter={() => {
                setHoveredPoint({
                  modelId: mId,
                  modelName: mSpec.name,
                  val: p.val,
                  x: p.x,
                  y: p.y,
                  query: p.query,
                  type
                });
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </g>
      );
    });

    return elements;
  };

  const renderTooltip = (type: 'cost' | 'latency') => {
    if (!hoveredPoint || hoveredPoint.type !== type) return null;
    return (
      <div
        className="animate-scale-in"
        style={{
          position: 'absolute',
          left: `calc(${(hoveredPoint.x / svgWidth) * 100}% - 75px)`,
          top: `calc(${(hoveredPoint.y / svgHeight) * 100}% - 14px)`,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          padding: '8px 12px',
          zIndex: 99,
          pointerEvents: 'none',
          fontSize: '0.72rem',
          color: 'var(--text-main)',
          width: '150px',
          transform: 'translateY(-100%)',
          transition: 'left 0.1s ease, top 0.1s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, marginBottom: '3px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: modelSpecs[hoveredPoint.modelId]?.color }} />
          {hoveredPoint.modelName}
        </div>
        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: '#10b981' }}>
          {hoveredPoint.type === 'cost' ? formatCost(hoveredPoint.val) : `${Math.round(hoveredPoint.val)} ms`}
        </div>
        {hoveredPoint.query && (
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', marginTop: '4px', paddingTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Q: &quot;{hoveredPoint.query}&quot;
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
      
      {/* Sidebar Header with Enlarge Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isEnlarged ? 'Split View Trends' : 'Performance Trends'}
        </h3>
        {onToggleEnlarge && (
          <button
            onClick={onToggleEnlarge}
            style={{
              padding: '4px 10px',
              fontSize: '0.68rem',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card-hover)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-focus)';
              e.currentTarget.style.color = 'var(--text-main)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {isEnlarged ? '✕ Close Split View' : 'Compare in Split View'}
          </button>
        )}
      </div>
      
      {/* 1. Cost Graph Card */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-main)' }}>
            Real-Time Cost Variation
          </h4>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Last {pointsCount} runs</span>
        </div>
        <div style={{ position: 'relative', width: '100%', height: `${svgHeight}px` }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
            {renderGridLines('cost')}
            {renderLinesAndNodes('cost')}
          </svg>
        </div>
        {renderTooltip('cost')}
      </div>

      {/* 2. Latency Graph Card */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-main)' }}>
            Latency Variation (ms)
          </h4>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Last {pointsCount} runs</span>
        </div>
        <div style={{ position: 'relative', width: '100%', height: `${svgHeight}px` }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
            {renderGridLines('latency')}
            {renderLinesAndNodes('latency')}
          </svg>
        </div>
        {renderTooltip('latency')}
      </div>

      {/* Run History Key */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '12px 14px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          background: 'var(--bg-card)'
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
          Run History Key
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.72rem' }}>
          {runHistory.map((run, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center', minWidth: 0 }}>
              <strong style={{ color: 'var(--text-main)', minWidth: '24px' }}>R{idx + 1}:</strong>
              <span style={{ 
                color: 'var(--text-muted)', 
                fontStyle: 'italic', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                flex: 1
              }}>
                &quot;{run.query || 'Baseline Estimation Query'}&quot;
              </span>
              <span style={{ color: 'var(--text-dark)', fontSize: '0.62rem', flexShrink: 0, fontFamily: 'monospace' }}>
                ({run.timestamp})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Small Mini Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', padding: '0 4px' }}>
        {enabledModelIds.map(mId => {
          const spec = modelSpecs[mId];
          if (!spec) return null;
          const isIntersection = intersectionModelIds.includes(mId);
          return (
            <span 
              key={mId} 
              style={{ 
                fontSize: '0.65rem', 
                color: isIntersection ? 'var(--text-main)' : 'var(--text-muted)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px',
                background: 'var(--bg-card)',
                padding: '2px 6px',
                borderRadius: '10px',
                border: isIntersection ? '1px solid #10b981' : '1px solid var(--border-color)',
                opacity: isIntersection ? 1 : 0.75,
                fontWeight: isIntersection ? 700 : 400
              }}
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: spec.color }} />
              {spec.name.replace(' (Groq)', '')}
            </span>
          );
        })}
      </div>

    </div>
  );
}
