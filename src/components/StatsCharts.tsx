'use client';

import React from 'react';
import { RoutingDecision } from '../utils/routerEngine';

interface StatsChartsProps {
  history: RoutingDecision[];
}

export default function StatsCharts({ history }: StatsChartsProps) {
  // 1. Calculate Donut Chart stats
  const total = history.length;
  const counts = {
    nano: history.filter(h => h.model.id === 'nano').length,
    flash: history.filter(h => h.model.id === 'flash').length,
    pro: history.filter(h => h.model.id === 'pro').length,
    ultra: history.filter(h => h.model.id === 'ultra').length,
  };

  const percentages = {
    nano: total > 0 ? (counts.nano / total) * 100 : 0,
    flash: total > 0 ? (counts.flash / total) * 100 : 0,
    pro: total > 0 ? (counts.pro / total) * 100 : 0,
    ultra: total > 0 ? (counts.ultra / total) * 100 : 0,
  };

  // Donut SVG parameters
  const radius = 50;
  const circ = 2 * Math.PI * radius; // ~314.16
  
  // Calculate offsets for stacked circle strokes
  let currentOffset = 0;
  const nanoStroke = (percentages.nano / 100) * circ;
  const flashStroke = (percentages.flash / 100) * circ;
  const proStroke = (percentages.pro / 100) * circ;
  const ultraStroke = (percentages.ultra / 100) * circ;

  // 2. Line Chart: Cumulative Cost Savings
  // We want to draw up to the last 20 points in history
  const pointsToShow = history.slice(-20);
  let cumRouted = 0;
  let cumUltra = 0;
  let cumFlash = 0;

  const costData = pointsToShow.map((item, idx) => {
    cumRouted += item.cost;
    cumUltra += (item.inputTokens / 1000000 * 5.0) + (item.outputTokens / 1000000 * 15.0);
    cumFlash += (item.inputTokens / 1000000 * 0.075) + (item.outputTokens / 1000000 * 0.30);
    return {
      index: idx,
      routed: cumRouted,
      ultra: cumUltra,
      flash: cumFlash
    };
  });

  // Scale line chart to 300x120 SVG viewport
  const maxCost = Math.max(...costData.map(d => Math.max(d.ultra, d.routed, d.flash, 0.0001)));
  const getX = (idx: number) => {
    if (costData.length <= 1) return 20;
    return 20 + (idx / (costData.length - 1)) * 260;
  };
  const getY = (val: number) => {
    return 100 - (val / maxCost) * 80; // keep padding top & bottom
  };

  const routedPath = costData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.routed)}`).join(' ');
  const ultraPath = costData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.ultra)}`).join(' ');
  const flashPath = costData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.flash)}`).join(' ');

  // 3. Bar Chart: Average Latency Comparison
  const avgRoutedLatency = total > 0 
    ? Math.round(history.reduce((sum, h) => sum + h.latency, 0) / total) 
    : 0;
  const avgUltraLatency = 1650; // Reference spec
  const avgFlashLatency = 320;  // Reference spec

  const maxLatency = 1800;
  const barWidth = (val: number) => {
    return `${Math.max(10, Math.min(100, (val / maxLatency) * 100))}%`;
  };

  return (
    <div className="grid-cols-2" style={{ width: '100%' }}>
      
      {/* Chart 1: Donut for Model Utilization */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Model Utilization</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Routing distribution based on query types.</p>
        </div>

        {total === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '160px', color: 'var(--text-dark)', fontSize: '0.8rem' }}>
            No simulation data. Route a prompt to begin.
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', minHeight: '160px' }}>
            
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
              <svg width="100%" height="100%" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                
                {/* Ultra stroke */}
                {ultraStroke > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="var(--color-ultra)"
                    strokeWidth="12"
                    strokeDasharray={`${ultraStroke} ${circ}`}
                    strokeDashoffset={-currentOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                )}
                {(() => { currentOffset += ultraStroke; return null; })()}

                {/* Pro stroke */}
                {proStroke > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="var(--color-pro)"
                    strokeWidth="12"
                    strokeDasharray={`${proStroke} ${circ}`}
                    strokeDashoffset={-currentOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                )}
                {(() => { currentOffset += proStroke; return null; })()}

                {/* Flash stroke */}
                {flashStroke > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="var(--color-flash)"
                    strokeWidth="12"
                    strokeDasharray={`${flashStroke} ${circ}`}
                    strokeDashoffset={-currentOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                )}
                {(() => { currentOffset += flashStroke; return null; })()}

                {/* Nano stroke */}
                {nanoStroke > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="var(--color-nano)"
                    strokeWidth="12"
                    strokeDasharray={`${nanoStroke} ${circ}`}
                    strokeDashoffset={-currentOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                )}
              </svg>
              
              {/* Donut Center Metrics */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{total}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-dark)', textTransform: 'uppercase' }}>Queries</span>
              </div>
            </div>

            {/* Labels */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '20%', background: 'var(--color-nano)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Nano:</span>
                <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{counts.nano} ({percentages.nano.toFixed(0)}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '20%', background: 'var(--color-flash)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Flash:</span>
                <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{counts.flash} ({percentages.flash.toFixed(0)}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '20%', background: 'var(--color-pro)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Pro:</span>
                <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{counts.pro} ({percentages.pro.toFixed(0)}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '20%', background: 'var(--color-ultra)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Ultra:</span>
                <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{counts.ultra} ({percentages.ultra.toFixed(0)}%)</span>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Chart 2: Cumulative Cost Line Chart */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Cumulative Costs ($)</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Comparison over the last 20 queries (Lower is better).</p>
        </div>

        {total === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '160px', color: 'var(--text-dark)', fontSize: '0.8rem' }}>
            No cost history. Run a simulation.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            
            {/* SVG line graph */}
            <div style={{ width: '100%', height: '120px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 300 120" style={{ overflow: 'visible' }}>
                {/* Horizontal gridlines */}
                <line x1="20" y1="20" x2="280" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="20" y1="60" x2="280" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="20" y1="100" x2="280" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                
                {/* Y-axis label */}
                <text x="18" y="24" fill="var(--text-dark)" fontSize="7" textAnchor="end">${maxCost.toFixed(4)}</text>
                <text x="18" y="103" fill="var(--text-dark)" fontSize="7" textAnchor="end">$0.00</text>

                {/* Path Lines */}
                {ultraPath && (
                  <path
                    d={ultraPath}
                    fill="none"
                    stroke="var(--color-ultra)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    style={{ transition: 'd 0.5s ease' }}
                  />
                )}
                {flashPath && (
                  <path
                    d={flashPath}
                    fill="none"
                    stroke="var(--color-flash)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    style={{ transition: 'd 0.5s ease' }}
                  />
                )}
                {routedPath && (
                  <path
                    d={routedPath}
                    fill="none"
                    stroke="#10b981" // Emerald Green for the smart route
                    strokeWidth="2.5"
                    style={{ transition: 'd 0.5s ease' }}
                  />
                )}

                {/* Highlight last dot */}
                {costData.length > 0 && (
                  <>
                    <circle cx={getX(costData.length - 1)} cy={getY(costData[costData.length - 1].routed)} r="4" fill="#10b981" />
                    <circle cx={getX(costData.length - 1)} cy={getY(costData[costData.length - 1].ultra)} r="3" fill="var(--color-ultra)" />
                  </>
                )}
              </svg>
            </div>

            {/* Legends */}
            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.7rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '2px', background: '#10b981', display: 'inline-block' }} />
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Routed (Dynamic)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '2px', background: 'var(--color-ultra)', borderStyle: 'dashed', opacity: 0.7, display: 'inline-block' }} />
                <span style={{ color: 'var(--text-muted)' }}>Always Ultra</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '2px', background: 'var(--color-flash)', borderStyle: 'dotted', opacity: 0.7, display: 'inline-block' }} />
                <span style={{ color: 'var(--text-muted)' }}>Always Flash</span>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Chart 3: Latency Comparisons */}
      <div className="glass-panel" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Average Latency (Response Speed)</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Comparative execution times in milliseconds (Shorter is faster).</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          
          {/* Row 1: Always Ultra */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', width: '100%' }}>
            <div style={{ width: '140px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Always Ultra (137B+)</div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '4px', height: '14px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: barWidth(avgUltraLatency), height: '100%', background: 'linear-gradient(to right, rgba(236,72,153,0.3), var(--color-ultra))', borderRadius: '4px', boxShadow: '0 0 8px rgba(236,72,153,0.2)' }} />
            </div>
            <div style={{ width: '60px', fontSize: '0.8rem', textAlign: 'right', fontFamily: 'monospace' }}>{avgUltraLatency} ms</div>
          </div>

          {/* Row 2: Routed (Dynamic) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', width: '100%' }}>
            <div style={{ width: '140px', fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>Routed (Dynamic)</div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '4px', height: '14px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: barWidth(avgRoutedLatency || 10), height: '100%', background: 'linear-gradient(to right, rgba(168,85,247,0.3), var(--color-pro))', borderRadius: '4px', boxShadow: '0 0 8px rgba(168,85,247,0.2)' }} />
            </div>
            <div style={{ width: '60px', fontSize: '0.8rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{avgRoutedLatency} ms</div>
          </div>

          {/* Row 3: Always Flash */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', width: '100%' }}>
            <div style={{ width: '140px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Always Flash (8B)</div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '4px', height: '14px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: barWidth(avgFlashLatency), height: '100%', background: 'linear-gradient(to right, rgba(6,182,212,0.3), var(--color-flash))', borderRadius: '4px', boxShadow: '0 0 8px rgba(6,182,212,0.2)' }} />
            </div>
            <div style={{ width: '60px', fontSize: '0.8rem', textAlign: 'right', fontFamily: 'monospace' }}>{avgFlashLatency} ms</div>
          </div>

        </div>
      </div>

    </div>
  );
}
