'use client';

import React, { useState } from 'react';
import { MODELS, Model, RoutingDecision } from '../utils/routerEngine';
import SettingsPanel from './SettingsPanel';
import QueryTester from './QueryTester';
import BatchSimulator from './BatchSimulator';
import StatsCharts from './StatsCharts';

export default function RouterDashboard() {
  const [thresholds, setThresholds] = useState({ nano: 2.8, flash: 5.2, pro: 7.8 });
  const [modelSpecs, setModelSpecs] = useState<Record<string, Model>>(MODELS);
  const [history, setHistory] = useState<RoutingDecision[]>([]);

  // Function to add a routing result
  const handleNewResult = (result: RoutingDecision) => {
    // Inject the dynamically updated model characteristics from state into the result cost calculations
    const spec = modelSpecs[result.model.id];
    const cost = (result.inputTokens / 1000000 * spec.inputCostPer1M) + (result.outputTokens / 1000000 * spec.outputCostPer1M);
    const updatedResult = { ...result, cost };
    setHistory((prev) => [...prev, updatedResult]);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const updateModelSpec = (id: string, field: keyof Model, value: any) => {
    setModelSpecs((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const resetSettings = () => {
    setThresholds({ nano: 2.8, flash: 5.2, pro: 7.8 });
    setModelSpecs(JSON.parse(JSON.stringify(MODELS)));
  };

  // -------------------------------------------------------------
  // Calculations
  // -------------------------------------------------------------
  const totalQueries = history.length;

  // Calculate actual cost of our routed queries
  const totalRoutedCost = history.reduce((sum, item) => {
    const spec = modelSpecs[item.model.id];
    const cost = (item.inputTokens / 1000000 * spec.inputCostPer1M) + (item.outputTokens / 1000000 * spec.outputCostPer1M);
    return sum + cost;
  }, 0);

  // Counterfactual: What if we ALWAYS used Ultra?
  const alwaysUltraCost = history.reduce((sum, item) => {
    const spec = modelSpecs.ultra;
    return sum + (item.inputTokens / 1000000 * spec.inputCostPer1M) + (item.outputTokens / 1000000 * spec.outputCostPer1M);
  }, 0);

  // Counterfactual: What if we ALWAYS used Flash?
  const alwaysFlashCost = history.reduce((sum, item) => {
    const spec = modelSpecs.flash;
    return sum + (item.inputTokens / 1000000 * spec.inputCostPer1M) + (item.outputTokens / 1000000 * spec.outputCostPer1M);
  }, 0);

  const totalSavedUSD = Math.max(0, alwaysUltraCost - totalRoutedCost);
  const costSavingsPercent = alwaysUltraCost > 0 
    ? (totalSavedUSD / alwaysUltraCost) * 100 
    : 0;

  // Average Latencies
  const avgRoutedLatency = totalQueries > 0 
    ? history.reduce((sum, h) => sum + h.latency, 0) / totalQueries 
    : 0;
  const ultraLatency = modelSpecs.ultra.avgLatency;
  const speedupPercent = ultraLatency > 0 && avgRoutedLatency > 0
    ? ((ultraLatency - avgRoutedLatency) / ultraLatency) * 100
    : 0;

  // Routing Efficiency: % of queries routed to non-ultra models
  const nonUltraCount = history.filter(h => h.model.id !== 'ultra').length;
  const routingEfficiencyPercent = totalQueries > 0 
    ? (nonUltraCount / totalQueries) * 100 
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
      
      {/* Header and Hero */}
      <header style={{ 
        padding: '40px 20px 20px 20px', 
        textAlign: 'center', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '12px' 
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, var(--color-flash), var(--color-pro))', 
          padding: '1px', 
          borderRadius: '20px',
          marginBottom: '8px'
        }}>
          <div style={{ 
            background: 'var(--bg-main)', 
            padding: '4px 14px', 
            borderRadius: '20px', 
            fontSize: '0.75rem', 
            fontWeight: 600, 
            letterSpacing: '0.05em', 
            textTransform: 'uppercase',
            color: 'var(--color-flash)'
          }}>
            🤖 LLM Semantic Routing Demo
          </div>
        </div>

        <h1 style={{ 
          fontSize: '2.5rem', 
          lineHeight: '1.1', 
          fontWeight: 800,
          background: 'linear-gradient(to right, #ffffff, #94a3b8)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          maxWidth: '800px'
        }}>
          Optimize LLM Performance, Costs, &amp; Parameters
        </h1>
        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: '0.95rem', 
          maxWidth: '600px', 
          lineHeight: '1.6' 
        }}>
          Analyze how semantic routing saves massive budgets by directing simple prompts to lightweight parameters (like Gemini Nano) and reserving complex queries for larger parameters (like Gemini Ultra).
        </p>
      </header>

      {/* Main Grid */}
      <div className="dashboard-grid">
        
        {/* Settings Sidebar Column */}
        <SettingsPanel 
          thresholds={thresholds}
          setThresholds={setThresholds}
          modelSpecs={modelSpecs}
          updateModelSpec={updateModelSpec}
          resetSettings={resetSettings}
        />

        {/* Dashboards Contents */}
        <main className="main-content">
          
          {/* Metrics Summary Row */}
          <div className="metrics-row">
            
            {/* Card 1: Money Saved */}
            <div className="metric-card saved">
              <span className="metric-label">Cumulative Savings</span>
              <span className="metric-value" style={{ color: '#10b981' }}>
                ${totalSavedUSD.toFixed(5)}
              </span>
              <span className="metric-sub">
                {totalQueries > 0 ? `-${costSavingsPercent.toFixed(1)}% vs Ultra` : 'No queries processed'}
              </span>
            </div>

            {/* Card 2: Speedup Latency */}
            <div className="metric-card speedup">
              <span className="metric-label">Latency Reduction</span>
              <span className="metric-value" style={{ color: 'var(--color-nano)' }}>
                {speedupPercent > 0 ? `${speedupPercent.toFixed(0)}%` : '0%'}
              </span>
              <span className="metric-sub" style={{ color: 'var(--text-muted)' }}>
                {totalQueries > 0 ? `Avg: ${Math.round(avgRoutedLatency)}ms` : 'Idle'}
              </span>
            </div>

            {/* Card 3: Routing Efficiency */}
            <div className="metric-card efficiency">
              <span className="metric-label">Routing Efficiency</span>
              <span className="metric-value" style={{ color: 'var(--color-pro)' }}>
                {routingEfficiencyPercent > 0 ? `${routingEfficiencyPercent.toFixed(0)}%` : '0%'}
              </span>
              <span className="metric-sub" style={{ color: 'var(--text-muted)' }}>
                {totalQueries > 0 ? `${nonUltraCount} / ${totalQueries} offloaded` : '0 offloaded'}
              </span>
            </div>

            {/* Card 4: Query Volume */}
            <div className="metric-card volume">
              <span className="metric-label">Total Workload</span>
              <span className="metric-value" style={{ color: 'var(--color-ultra)' }}>
                {totalQueries}
              </span>
              <span className="metric-sub" style={{ color: 'var(--text-muted)' }}>
                {totalQueries > 0 ? `Cost: $${totalRoutedCost.toFixed(5)}` : '$0.00 total spend'}
              </span>
            </div>

          </div>

          {/* Interactive Playground Section */}
          <QueryTester 
            thresholds={thresholds}
            onRouteResult={handleNewResult}
          />

          {/* Batch Simulation Section */}
          <BatchSimulator 
            thresholds={thresholds}
            onNewResult={handleNewResult}
            onClearHistory={handleClearHistory}
            currentHistoryCount={history.length}
          />

          {/* Visual SVG Analytics Charts */}
          <StatsCharts history={history} />

        </main>
      </div>

    </div>
  );
}
