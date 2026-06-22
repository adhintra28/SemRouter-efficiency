'use client';

import React from 'react';
import { Model, ModelExecutionResult, getIntersectionModelId } from '../utils/routerEngine';

interface StatsChartsProps {
  latestRun: ModelExecutionResult[];
  modelSpecs: Record<string, Model>;
  isHybrid?: boolean;
}

export default function StatsCharts({
  latestRun,
  modelSpecs,
  isHybrid = false,
}: StatsChartsProps) {
  const isRunEmpty = latestRun.length === 0;

  const sampleInputTokens = 200;
  const sampleOutputTokens = 400;

  const getChartData = () => {
    if (!isRunEmpty) {
      if (isHybrid) {
        // Group by modelId to avoid duplicate bars and sum costs / take max latency
        const aggregated: Record<string, {
          id: string;
          name: string;
          color: string;
          provider: string;
          cost: number;
          latency: number;
        }> = {};

        latestRun.forEach(r => {
          if (!aggregated[r.modelId]) {
            aggregated[r.modelId] = {
              id: r.modelId,
              name: r.modelName,
              color: modelSpecs[r.modelId]?.color || '#94a3b8',
              provider: r.provider,
              cost: 0,
              latency: 0,
            };
          }
          aggregated[r.modelId].cost += r.totalCost;
          aggregated[r.modelId].latency = Math.max(aggregated[r.modelId].latency, r.latency);
        });

        return Object.values(aggregated);
      }

      return latestRun.map(r => ({
        id: r.modelId,
        name: r.modelName,
        color: modelSpecs[r.modelId]?.color || '#94a3b8',
        provider: r.provider,
        cost: r.totalCost,
        latency: r.latency,
      }));
    } else {
      return Object.values(modelSpecs).map(m => {
        const cost = (sampleInputTokens / 1000000 * m.inputCostPer1M) + (sampleOutputTokens / 1000000 * m.outputCostPer1M);
        return {
          id: m.id,
          name: m.name,
          color: m.color,
          provider: m.provider,
          cost: cost,
          latency: m.avgLatency,
        };
      });
    }
  };

  const chartData = getChartData();

  const getIntersectionIds = (): string[] => {
    if (isHybrid && !isRunEmpty) {
      return Array.from(new Set(latestRun.map(r => r.modelId)));
    }
    if (!isRunEmpty) {
      const singleId = getIntersectionModelId(latestRun);
      return singleId ? [singleId] : [];
    }
    const mockRun = chartData.map(d => ({
      modelId: d.id,
      modelName: d.name,
      provider: d.provider,
      query: '',
      response: '',
      inputTokens: sampleInputTokens,
      outputTokens: sampleOutputTokens,
      inputCostPer1M: 0,
      outputCostPer1M: 0,
      totalCost: d.cost,
      latency: d.latency,
      timestamp: '',
      isLive: false,
    }));
    const singleId = getIntersectionModelId(mockRun);
    return singleId ? [singleId] : [];
  };

  const intersectionModelIds = getIntersectionIds();

  if (isRunEmpty) {
    return (
      <div 
        className="glass-panel" 
        style={{ 
          padding: '40px 20px', 
          textAlign: 'center', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px dashed var(--border-color)',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
          <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" />
          <line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" />
          <line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" />
        </svg>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
          No Analytics Data Available
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '400px', margin: 0, lineHeight: '1.5' }}>
          Run a comparison query in the playground above to visualize side-by-side cost and speed metrics.
        </p>
      </div>
    );
  }

  const costSortedData = [...chartData].sort((a, b) => b.cost - a.cost);
  const maxCost = Math.max(...costSortedData.map(d => d.cost), 0.00001);

  const latencySortedData = [...chartData].sort((a, b) => b.latency - a.latency);
  const maxLatency = Math.max(...latencySortedData.map(d => d.latency), 1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', width: '100%' }}>
      
      {/* Cost Variation Bar Chart Section */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Query Cost Comparison</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isRunEmpty 
              ? 'Showing baseline query cost comparison (200 input, 400 output tokens). Lower is better.'
              : 'Showing actual query cost comparison from the latest run. Lower is better.'}
          </p>
        </div>

        {/* Horizontal Bars Chart Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          {costSortedData.map((d) => {
            const widthPct = (d.cost / maxCost) * 100;
            const isIntersection = intersectionModelIds.includes(d.id);
            return (
              <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d.color }} />
                    <span style={{ fontWeight: isIntersection ? 700 : 500, color: isIntersection ? '#10b981' : 'var(--text-main)' }}>
                      {d.name} {isIntersection && '(Balanced Choice)'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)', textTransform: 'uppercase' }}>({d.provider})</span>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-main)' }}>
                    ${d.cost.toFixed(6)}
                  </span>
                </div>
                <div style={{ width: '100%', height: '12px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', border: isIntersection ? '1px solid #10b981' : 'none' }}>
                  <div 
                    style={{ 
                      width: `${Math.max(1, widthPct)}%`, 
                      height: '100%', 
                      backgroundColor: d.color,
                      opacity: isIntersection ? 1.0 : 0.6,
                      borderRadius: '4px',
                      transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Latency Comparison Card */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Execution Latency Comparison</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isRunEmpty 
              ? 'Showing typical average model latency in milliseconds. Shorter is faster.'
              : 'Showing actual prompt execution latency in milliseconds. Shorter is faster.'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          {latencySortedData.map((d) => {
            const widthPct = (d.latency / maxLatency) * 100;
            const isIntersection = intersectionModelIds.includes(d.id);
            return (
              <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d.color }} />
                    <span style={{ fontWeight: isIntersection ? 700 : 500, color: isIntersection ? '#10b981' : 'var(--text-main)' }}>
                      {d.name} {isIntersection && '(Balanced Choice)'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)', textTransform: 'uppercase' }}>({d.provider})</span>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-main)' }}>
                    {d.latency} ms
                  </span>
                </div>
                <div style={{ width: '100%', height: '12px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', border: isIntersection ? '1px solid #10b981' : 'none' }}>
                  <div 
                    style={{ 
                      width: `${Math.max(1, widthPct)}%`, 
                      height: '100%', 
                      backgroundColor: d.color,
                      opacity: isIntersection ? 1.0 : 0.6,
                      borderRadius: '4px',
                      transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
