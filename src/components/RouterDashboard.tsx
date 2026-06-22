'use client';

import React, { useState, useEffect } from 'react';
import { MODELS, ModelExecutionResult, getIntersectionModelId, runModelQuery } from '../utils/routerEngine';
import SettingsPanel from './SettingsPanel';
import QueryTester from './QueryTester';
import StatsCharts from './StatsCharts';
import HistoryLineCharts from './HistoryLineCharts';
import ModelComparisonDashboard from './ModelComparisonDashboard';

export interface RouterOverhead {
  provider: string;
  modelName: string;
  latency: number;
  cost: number;
  tokens: number;
  isLive: boolean;
  tier: 'nano' | 'flash' | 'pro' | 'ultra';
}

export default function RouterDashboard() {
  const modelSpecs = MODELS;
  const [enabledModelIds, setEnabledModelIds] = useState<string[]>(Object.keys(MODELS));
  const [activeView, setActiveView] = useState<'playground' | 'comparison'>('playground');

  const [latestRun, setLatestRun] = useState<ModelExecutionResult[]>([]);
  const [queryComplexity, setQueryComplexity] = useState<'nano' | 'flash' | 'pro' | 'ultra' | null>(null);
  const [classifierModelId, setClassifierModelId] = useState<string>('auto');
  const [routerOverhead, setRouterOverhead] = useState<RouterOverhead | null>(null);
  const [latencyWeight, setLatencyWeight] = useState<number>(50);
  const [priceWeight, setPriceWeight] = useState<number>(50);
  const [isEnlarged, setIsEnlarged] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [runHistory, setRunHistory] = useState<Array<{
    timestamp: string;
    query: string;
    isHybrid: boolean;
    results: Record<string, { cost: number; latency: number; name: string }>;
  }>>([]);

  // Load configuration and API keys from localStorage safely
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEnabled = localStorage.getItem('playground_enabled_models');
      const savedClassifier = localStorage.getItem('router_classifier_model');
      const savedLatencyWeight = localStorage.getItem('router_latency_weight');
      const savedPriceWeight = localStorage.getItem('router_price_weight');

      setTimeout(() => {
        if (savedEnabled) {
          try {
            setEnabledModelIds(JSON.parse(savedEnabled));
          } catch (e) {
            console.error('Error loading enabled models:', e);
          }
        }
        if (savedClassifier) {
          setClassifierModelId(savedClassifier);
        }
        if (savedLatencyWeight) {
          setLatencyWeight(parseInt(savedLatencyWeight));
        }
        if (savedPriceWeight) {
          setPriceWeight(parseInt(savedPriceWeight));
        }
      }, 0);
    }
  }, []);

  const handleSaveEnabledModels = (newEnabled: string[]) => {
    setEnabledModelIds(newEnabled);
    localStorage.setItem('playground_enabled_models', JSON.stringify(newEnabled));
  };

  const handleSaveLatencyWeight = (val: number) => {
    setLatencyWeight(val);
    localStorage.setItem('router_latency_weight', val.toString());
  };

  const handleSavePriceWeight = (val: number) => {
    setPriceWeight(val);
    localStorage.setItem('router_price_weight', val.toString());
  };

  // Function to save comparison execution results
  const handleNewResults = (
    results: ModelExecutionResult[], 
    complexity: 'nano' | 'flash' | 'pro' | 'ultra',
    overhead?: RouterOverhead
  ) => {
    setLatestRun(results);
    setQueryComplexity(complexity);
    setRouterOverhead(overhead || null);

    const isHybrid = overhead?.provider === 'hybrid';
    const queryText = results[0]?.query || '';

    setRunHistory(prev => {
      const runData: Record<string, { cost: number; latency: number; name: string }> = {};
      
      Object.keys(MODELS).forEach(mId => {
        const m = MODELS[mId];
        if (isHybrid) {
          const matchedParts = results.filter(r => r.modelId === mId);
          if (matchedParts.length > 0) {
            runData[mId] = {
              cost: matchedParts.reduce((acc, r) => acc + r.totalCost, 0),
              latency: Math.max(...matchedParts.map(r => r.latency)),
              name: m.name
            };
          } else {
            const simulated = runModelQuery(queryText, mId, m);
            runData[mId] = {
              cost: simulated.totalCost,
              latency: simulated.latency,
              name: m.name
            };
          }
        } else {
          const matched = results.find(r => r.modelId === mId);
          if (matched) {
            runData[mId] = {
              cost: matched.totalCost,
              latency: matched.latency,
              name: m.name
            };
          } else {
            const simulated = runModelQuery(queryText, mId, m);
            runData[mId] = {
              cost: simulated.totalCost,
              latency: simulated.latency,
              name: m.name
            };
          }
        }
      });

      const next = [...prev, {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        query: queryText,
        isHybrid,
        results: runData
      }];

      if (next.length > 7) {
        return next.slice(next.length - 7);
      }
      return next;
    });
  };

  // Metrics calculations for the highlights row
  const totalModelsChecked = enabledModelIds.length;

  let cheapestModelName = 'N/A';
  let cheapestModelCost = 0;
  let fastestModelName = 'N/A';
  let fastestModelLatency = 0;
  let intersectionModelName = 'N/A';
  let intersectionModelIds: string[] = [];

  if (latestRun.length > 0) {
    const sortedByCost = [...latestRun].sort((a, b) => a.totalCost - b.totalCost);
    cheapestModelName = sortedByCost[0].modelName;
    cheapestModelCost = sortedByCost[0].totalCost;

    const sortedBySpeed = [...latestRun].sort((a, b) => a.latency - b.latency);
    fastestModelName = sortedBySpeed[0].modelName;
    fastestModelLatency = sortedBySpeed[0].latency;

    if (routerOverhead && routerOverhead.provider === 'hybrid') {
      intersectionModelName = routerOverhead.modelName;
      intersectionModelIds = Array.from(new Set(latestRun.map(r => r.modelId)));
    } else {
      const intersectionId = getIntersectionModelId(latestRun, queryComplexity, latencyWeight / 100, priceWeight / 100);
      const matched = latestRun.find(r => r.modelId === intersectionId);
      if (matched) {
        intersectionModelName = matched.modelName;
        intersectionModelIds = [matched.modelId];
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
      
      {/* Upcoming API Keys Feature Tag Banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
        borderBottom: '1px solid var(--border-color)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        fontSize: '0.8rem',
        color: 'var(--text-main)',
        flexWrap: 'wrap',
        textAlign: 'center'
      }}>
        <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>
          Soon you can <strong style={{ color: 'var(--text-main)' }}>test with your own live API keys</strong> to run real-time queries directly in your browser.
        </span>
      </div>

      {/* Header */}
      <header style={{ 
        padding: '32px 24px 20px 24px', 
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
              Semantic Router
            </h1>
            <span style={{ height: '14px', width: '1px', background: 'var(--border-color)' }}></span>
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              AI Model Playground
            </span>
          </div>
          <p style={{ color: 'var(--text-dark)', fontSize: '0.78rem' }}>
            Analyze pricing efficiency, response latency, and semantic load-balancing.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeView === 'playground' ? 'active' : ''}`}
            onClick={() => setActiveView('playground')}
          >
            Model Playground
          </button>
          <button 
            className={`tab-btn ${activeView === 'comparison' ? 'active' : ''}`}
            onClick={() => setActiveView('comparison')}
          >
            Model Comparison
          </button>
        </div>
      </header>

      {activeView === 'playground' ? (
        /* Main Grid */
        <div className={`dashboard-grid ${isSidebarOpen ? '' : 'collapsed'}`}>
          
          {/* Left Column (Settings Panel & Sidebar Line Charts) */}
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '24px',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}
          >
            <SettingsPanel 
              enabledModelIds={enabledModelIds}
              setEnabledModelIds={handleSaveEnabledModels}
              modelSpecs={modelSpecs}
              latencyWeight={latencyWeight}
              setLatencyWeight={handleSaveLatencyWeight}
              priceWeight={priceWeight}
              setPriceWeight={handleSavePriceWeight}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            
            {!isEnlarged && isSidebarOpen && (
              <HistoryLineCharts 
                runHistory={runHistory}
                enabledModelIds={enabledModelIds}
                modelSpecs={modelSpecs}
                intersectionModelIds={intersectionModelIds}
                isEnlarged={false}
                onToggleEnlarge={() => setIsEnlarged(true)}
              />
            )}
          </div>

          {/* Dashboards Contents */}
          <main className="main-content">
            
            {/* Metrics Summary Row */}
            <div className="metrics-row">
              
              {/* Card 1: Cheapest Model */}
              <div className="metric-card">
                <span className="metric-label">Cheapest Model</span>
                <span className="metric-value" style={{ fontSize: '1.2rem' }}>
                  {cheapestModelName}
                </span>
                <span className="metric-sub">
                  {latestRun.length > 0 ? `Cost: $${cheapestModelCost.toFixed(6)}` : 'Awaiting prompt run'}
                </span>
              </div>

              {/* Card 2: Fastest Model */}
              <div className="metric-card">
                <span className="metric-label">Fastest Model</span>
                <span className="metric-value" style={{ fontSize: '1.2rem' }}>
                  {fastestModelName}
                </span>
                <span className="metric-sub">
                  {latestRun.length > 0 ? `Latency: ${fastestModelLatency} ms` : 'Awaiting prompt run'}
                </span>
              </div>

              {/* Card 3: Balanced Choice */}
              <div className="metric-card" style={{ border: latestRun.length > 0 ? '1px solid var(--border-focus)' : '1px solid var(--border-color)' }}>
                <span className="metric-label" style={{ color: latestRun.length > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>Balanced Choice</span>
                <span className="metric-value" style={{ fontSize: '1.2rem' }}>
                  {intersectionModelName}
                </span>
                <span className="metric-sub">
                  {latestRun.length > 0 ? 'Optimal cost & speed compromise' : 'Awaiting prompt run'}
                </span>
              </div>

              {/* Card 4: Checked Models */}
              <div className="metric-card">
                <span className="metric-label">Selected Models</span>
                <span className="metric-value">
                  {totalModelsChecked}
                </span>
                <span className="metric-sub">
                  Out of {Object.keys(modelSpecs).length} total available
                </span>
              </div>

            </div>

            {/* Dynamic Pane Layout: Split screen side-by-side or full width stack */}
            <div className={`results-comparison-pane ${isEnlarged ? 'side-by-side' : ''}`}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Interactive Playground Section */}
                <QueryTester 
                  enabledModelIds={enabledModelIds}
                  onRouteResult={handleNewResults}
                  modelSpecs={modelSpecs}
                  classifierModelId={classifierModelId}
                  queryComplexity={queryComplexity}
                  routerOverhead={routerOverhead}
                  latencyWeight={latencyWeight}
                  priceWeight={priceWeight}
                />

                {/* Comparative Analytics Charts */}
                <StatsCharts 
                  latestRun={latestRun} 
                  modelSpecs={modelSpecs}
                  isHybrid={routerOverhead?.provider === 'hybrid'}
                />
              </div>

              {isEnlarged && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-scale-in">
                  <HistoryLineCharts 
                    runHistory={runHistory}
                    enabledModelIds={enabledModelIds}
                    modelSpecs={modelSpecs}
                    intersectionModelIds={intersectionModelIds}
                    isEnlarged={true}
                    onToggleEnlarge={() => setIsEnlarged(false)}
                  />
                </div>
              )}

            </div>

          </main>
        </div>
      ) : (
        <div style={{ maxWidth: '1560px', width: '100%', margin: '0 auto', padding: '0 24px 48px 24px' }}>
          <ModelComparisonDashboard />
        </div>
      )}

    </div>
  );
}
