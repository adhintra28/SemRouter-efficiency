'use client';

import React, { useState } from 'react';
import { MODELS } from '../utils/routerEngine';

// Generate mock historical latency data for sparklines
const generateMockHistory = (baseLatency: number, seed: number) => {
  const points = [];
  const count = 12;
  const current = baseLatency;
  for (let i = 0; i < count; i++) {
    // Generate pseudo-random variations for rendering sparkline curves
    const changePct = (Math.sin(seed + i) * 0.15) + (Math.cos(seed * 2 + i * 1.5) * 0.05);
    points.push(Math.round(current * (1 + changePct)));
  }
  return points;
};

export default function ModelComparisonDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  const modelsList = Object.values(MODELS);

  // Filter models
  const filteredModels = modelsList.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          model.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = selectedProvider === 'all' || model.provider === selectedProvider;
    return matchesSearch && matchesProvider;
  });

  // Highlight calculations
  const avgLatency = Math.round(modelsList.reduce((acc, m) => acc + m.avgLatency, 0) / modelsList.length);
  const cheapestModel = [...modelsList].sort((a, b) => a.inputCostPer1M - b.inputCostPer1M)[0];
  const fastestModel = [...modelsList].sort((a, b) => a.avgLatency - b.avgLatency)[0];

  // Render SVG Sparkline
  const renderSparkline = (latencies: number[], modelColor: string) => {
    const width = 120;
    const height = 30;
    const padding = 2;
    
    const minVal = Math.min(...latencies);
    const maxVal = Math.max(...latencies);
    const range = maxVal - minVal || 1;
    
    const points = latencies.map((val, idx) => {
      const x = (idx / (latencies.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((val - minVal) / range) * (height - padding * 2) - padding;
      return { x, y };
    });

    let pathD = '';
    points.forEach((p, idx) => {
      if (idx === 0) {
        pathD += `M ${p.x} ${p.y}`;
      } else {
        // Create subtle Bezier control points for smooth curves
        const prev = points[idx - 1];
        const cpX1 = prev.x + (p.x - prev.x) / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (p.x - prev.x) / 2;
        const cpY2 = p.y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
      }
    });

    const areaPathD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return (
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`gradient-${modelColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={modelColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={modelColor} stopOpacity="0.00" />
          </linearGradient>
        </defs>
        <path d={areaPathD} fill={`url(#gradient-${modelColor.replace('#', '')})`} />
        <path d={pathD} fill="none" stroke={modelColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.5" fill={modelColor} />
      </svg>
    );
  };

  return (
    <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      {/* Top Overview Cards */}
      <div className="metrics-row">
        <div className="metric-card">
          <span className="metric-label">Platform Average Latency</span>
          <span className="metric-value">{avgLatency} ms</span>
          <span className="metric-sub">Mean response delay across models</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Highest Speed Tier</span>
          <span className="metric-value" style={{ fontSize: '1.2rem' }}>{fastestModel.name}</span>
          <span className="metric-sub" style={{ color: fastestModel.color }}>
            Avg: {fastestModel.avgLatency}ms ({fastestModel.provider.toUpperCase()})
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Most Cost-Effective</span>
          <span className="metric-value" style={{ fontSize: '1.2rem' }}>{cheapestModel.name}</span>
          <span className="metric-sub" style={{ color: cheapestModel.color }}>
            Input: ${cheapestModel.inputCostPer1M.toFixed(3)}/1M tokens
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Total cataloged models</span>
          <span className="metric-value">{modelsList.length}</span>
          <span className="metric-sub">Across 4 major LLM providers</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div 
        className="glass-panel" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '16px',
          padding: '16px 24px'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search models by name or use case..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              outline: 'none',
              transition: 'border-color var(--transition-fast)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--border-focus)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
        </div>

        {/* Providers Filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['all', 'google', 'openai', 'anthropic', 'groq'].map((provider) => (
            <button
              key={provider}
              onClick={() => setSelectedProvider(provider)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: selectedProvider === provider ? 'var(--btn-primary-bg)' : 'transparent',
                color: selectedProvider === provider ? 'var(--btn-primary-text)' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                textTransform: 'capitalize'
              }}
              onMouseEnter={(e) => {
                if (selectedProvider !== provider) {
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedProvider !== provider) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              {provider === 'all' ? 'All Providers' : provider}
            </button>
          ))}
        </div>
      </div>

      {/* High-Level Comparison Table */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Model Specifications</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Parameters</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Avg Latency</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600, width: '150px' }}>Efficiency Trend</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Input Price / 1M</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Output Price / 1M</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Primary Application</th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.length > 0 ? (
                filteredModels.map((model, idx) => {
                  const history = generateMockHistory(model.avgLatency, idx * 5);
                  return (
                    <tr 
                      key={model.id}
                      style={{ 
                        borderBottom: idx < filteredModels.length - 1 ? '1px solid var(--border-color)' : 'none',
                        transition: 'background-color var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Name & Provider */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: model.color }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{model.name}</span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-dark)', textTransform: 'uppercase', fontWeight: 500 }}>
                              {model.provider}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Parameters size */}
                      <td style={{ padding: '16px 20px', color: 'var(--text-main)', fontWeight: 500 }}>
                        {model.parameters}
                      </td>

                      {/* Latency */}
                      <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-main)' }}>
                        {model.avgLatency} ms
                      </td>

                      {/* Sparkline trend */}
                      <td style={{ padding: '12px 20px', verticalAlign: 'middle' }}>
                        {renderSparkline(history, model.color)}
                      </td>

                      {/* Input Cost */}
                      <td style={{ padding: '16px 20px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        ${model.inputCostPer1M.toFixed(3)}
                      </td>

                      {/* Output Cost */}
                      <td style={{ padding: '16px 20px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        ${model.outputCostPer1M.toFixed(3)}
                      </td>

                      {/* Description */}
                      <td style={{ padding: '16px 20px', color: 'var(--text-muted)', maxWidth: '280px', lineHeight: '1.4' }}>
                        {model.description}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No models found matching search queries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
