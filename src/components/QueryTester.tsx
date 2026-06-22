'use client';

import React, { useState } from 'react';
import { MODELS, Model, ModelExecutionResult, runModelQuery, getIntersectionModelId, segmentQuery, SegmentedPart } from '../utils/routerEngine';

interface QueryTesterProps {
  enabledModelIds: string[];
  onRouteResult: (results: ModelExecutionResult[], complexity: 'nano' | 'flash' | 'pro' | 'ultra', overhead?: any) => void;
  modelSpecs: Record<string, Model>;
  classifierModelId: string;
  queryComplexity: 'nano' | 'flash' | 'pro' | 'ultra' | null;
  routerOverhead: any;
  latencyWeight: number;
  priceWeight: number;
}

export default function QueryTester({ 
  enabledModelIds, 
  onRouteResult, 
  modelSpecs,
  classifierModelId,
  queryComplexity,
  routerOverhead,
  latencyWeight,
  priceWeight,
}: QueryTesterProps) {
  const [query, setQuery] = useState('');
  const [routingState, setRoutingState] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [activeResults, setActiveResults] = useState<ModelExecutionResult[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [routerMode, setRouterMode] = useState<'standard' | 'hybrid'>('standard');
  const [hybridResults, setHybridResults] = useState<SegmentedPart[]>([]);

  const suggestions = [
    { label: "Greeting", text: "Hey! How are you doing today?", tier: 'nano' },
    { label: "Summarize", text: "Summarize the water cycle in three sentences.", tier: 'flash' },
    { label: "Coding", text: "Write a JavaScript function to check if a string is a palindrome, ignoring spaces and punctuation.", tier: 'pro' },
    { label: "System Design", text: "Design a high-level, fault-tolerant system architecture for a real-time collaborative document editor like Google Docs. Show components and database choices.", tier: 'ultra' },
  ];

  const hybridSuggestions = [
    { label: "Palindromes & France (Hybrid)", text: "Hello! Write a JavaScript function to check if a string is a palindrome, ignoring spaces and punctuation, and also Is Paris the capital of France?" },
    { label: "SQL/NoSQL & Google Docs (Hybrid)", text: "Hey, can you help me write a quick email subject line? Compare and contrast SQL and NoSQL databases, then design a fault-tolerant Google Docs system architecture." },
    { label: "Node.js, Math, & Blogs (Hybrid)", text: "hello! how's it going? Explain the concept of 'Event Loop' in Node.js and how it handles asynchronous operations, and what is 15 + 28, and suggest 5 blog post titles about remote work productivity." },
  ];

  const suggestionsToUse = routerMode === 'standard' ? suggestions : hybridSuggestions;

  const handleRoute = async (textToRoute: string) => {
    if (!textToRoute.trim()) return;
    if (enabledModelIds.length === 0) return;

    setRoutingState('analyzing');
    setActiveResults([]);
    setHybridResults([]);

    if (routerMode === 'hybrid') {
      try {
        const { segmentQuery, classifyQueryByPresetSimilarity, getIntersectionModelId, runModelQuery } = await import('../utils/routerEngine');
        const parts = segmentQuery(textToRoute);
        const partResults: SegmentedPart[] = [];

        for (const part of parts) {
          const partComplexity = classifyQueryByPresetSimilarity(part);
          const mockResultsForPart = enabledModelIds.map(mId => {
            const mSpec = modelSpecs[mId] || MODELS[mId];
            return runModelQuery(part, mId, mSpec);
          });
          const routedModelId = getIntersectionModelId(mockResultsForPart, partComplexity, latencyWeight / 100, priceWeight / 100) || enabledModelIds[0];
          const routedModel = modelSpecs[routedModelId] || MODELS[routedModelId];

          await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200));
          const runResult = runModelQuery(part, routedModel.id, routedModel);

          partResults.push({
            text: part,
            complexity: partComplexity,
            routedModelId: routedModel.id,
            routedModelName: routedModel.name,
            cost: runResult.totalCost,
            latency: runResult.latency,
            tokens: runResult.inputTokens + runResult.outputTokens,
            response: runResult.response,
          });
        }
        
        const uniqueModels = Array.from(new Set(partResults.map(r => r.routedModelName)));
        const hybridLatency = Math.max(...partResults.map(r => r.latency), 0) + 120;
        const hybridCost = partResults.reduce((acc, r) => acc + r.cost, 0);
        const highestComplexity = partResults.reduce((max, r) => {
          const ranks = { nano: 1, flash: 2, pro: 3, ultra: 4 };
          return ranks[r.complexity] > ranks[max] ? r.complexity : max;
        }, 'nano' as 'nano' | 'flash' | 'pro' | 'ultra');

        const mockResultsForDashboard = partResults.map(pr => ({
          modelId: pr.routedModelId,
          modelName: pr.routedModelName,
          provider: pr.routedModelId,
          query: pr.text,
          response: pr.response,
          inputTokens: 0,
          outputTokens: 0,
          inputCostPer1M: 0,
          outputCostPer1M: 0,
          totalCost: pr.cost,
          latency: pr.latency,
          timestamp: new Date().toLocaleTimeString(),
          isLive: false,
        } as any));

        setHybridResults(partResults);
        setRoutingState('done');
        
        onRouteResult(mockResultsForDashboard, highestComplexity, {
          provider: 'hybrid',
          modelName: uniqueModels.join(' + '),
          latency: hybridLatency,
          cost: hybridCost,
          tokens: partResults.reduce((acc, r) => acc + r.tokens, 0),
          isLive: false,
          tier: highestComplexity,
        });
      } catch (err) {
        console.error("Hybrid execution failed:", err);
        setRoutingState('idle');
      }
      return;
    }

    // 1. Identify which classifier to use
    let selectedModelId = classifierModelId;
    if (selectedModelId === 'auto') {
      selectedModelId = 'gemini-flash'; // default fallback
    }

    const classifierModel = modelSpecs[selectedModelId] || MODELS[selectedModelId] || MODELS['gemini-flash'];

    const classifyStartTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));
    
    const { classifyQueryByPresetSimilarity } = await import('../utils/routerEngine');
    const detectedComplexity = classifyQueryByPresetSimilarity(textToRoute);
    
    const overheadLatency = Date.now() - classifyStartTime;
    const inTokens = Math.max(5, Math.ceil(textToRoute.length / 4));
    const outTokens = 5;
    const overheadTokens = inTokens + outTokens;
    const overheadCost = (inTokens / 1000000 * classifierModel.inputCostPer1M) + (outTokens / 1000000 * classifierModel.outputCostPer1M);
    const isClassifierLive = false;

    const classificationOverhead = {
      provider: classifierModel.provider,
      modelName: classifierModel.name,
      latency: overheadLatency,
      cost: overheadCost,
      tokens: overheadTokens,
      isLive: isClassifierLive,
      tier: detectedComplexity,
    };

    const promises = enabledModelIds.map(async (modelId) => {
      const model = modelSpecs[modelId] || MODELS[modelId];
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
      return runModelQuery(textToRoute, model.id, model);
    });

    try {
      const results = await Promise.all(promises);
      setActiveResults(results);
      setRoutingState('done');
      onRouteResult(results, detectedComplexity, classificationOverhead);
      
      if (results.length > 0) {
        setActiveTab(results[0].modelId);
      }
    } catch (e) {
      console.error("Execution failed:", e);
      setRoutingState('idle');
    }
  };

  const handleSuggestClick = (text: string) => {
    setQuery(text);
    handleRoute(text);
  };

  return (
    <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '4px', color: 'var(--text-main)' }}>
            Playground Comparison
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Enter a prompt to analyze cost, tokens, and response speed across selected models simultaneously.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '30px', padding: '4px' }}>
          <button 
            onClick={() => { setRouterMode('standard'); setRoutingState('idle'); }}
            style={{
              background: routerMode === 'standard' ? 'var(--btn-primary-bg)' : 'transparent',
              color: routerMode === 'standard' ? 'var(--btn-primary-text)' : 'var(--text-muted)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Single Model Comparison
          </button>
          <button 
            onClick={() => { setRouterMode('hybrid'); setRoutingState('idle'); }}
            style={{
              background: routerMode === 'hybrid' ? 'var(--btn-primary-bg)' : 'transparent',
              color: routerMode === 'hybrid' ? 'var(--btn-primary-text)' : 'var(--text-muted)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Hybrid Router
          </button>
        </div>
      </div>

      {/* Query Suggestions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {suggestionsToUse.map((s, idx) => {
          const sampleSpec = MODELS[enabledModelIds[idx % enabledModelIds.length]] || MODELS['gemini-flash'];
          return (
            <button
              key={idx}
              onClick={() => handleSuggestClick(s.text)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = sampleSpec.color;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: sampleSpec.color }}></span>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Query Input */}
      <div style={{ position: 'relative', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask something to compare all selected models..."
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color var(--transition-fast)',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRoute(query);
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
        <button
          onClick={() => handleRoute(query)}
          className="btn-primary"
          disabled={routingState === 'analyzing' || !query.trim() || enabledModelIds.length === 0}
          style={{
            opacity: !query.trim() || routingState === 'analyzing' || enabledModelIds.length === 0 ? 0.6 : 1,
            cursor: !query.trim() || routingState === 'analyzing' || enabledModelIds.length === 0 ? 'not-allowed' : 'pointer',
            minWidth: '130px',
            justifyContent: 'center',
          }}
        >
          {routingState === 'analyzing' ? 'Comparing...' : 'Run Comparison'}
        </button>
      </div>

      {/* Comparison Grid Results */}
      {routingState !== 'idle' && routerMode === 'standard' && activeResults.length > 0 && (() => {
        const intersectionModelId = getIntersectionModelId(activeResults, queryComplexity, latencyWeight / 100, priceWeight / 100);
        const routedModel = activeResults.find(r => r.modelId === intersectionModelId);
        return (
          <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
            
            {/* AI Router Decision Panel */}
            {queryComplexity && routerOverhead && (
              <div 
                className="animate-fade-in"
                style={{
                  background: 'rgba(59, 130, 246, 0.04)',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  borderRadius: '12px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
                      color: '#ffffff', 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
                    }}>
                      AI ROUTER ACTIVE
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      Classified Query Complexity: <span style={{ textTransform: 'uppercase', color: '#3b82f6', fontWeight: 800 }}>{queryComplexity}</span>
                    </span>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
                  gap: '12px', 
                  fontSize: '0.8rem',
                  background: 'var(--bg-main)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '2px' }}>Classifier Latency</span>
                    <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{routerOverhead.latency} ms</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '2px' }}>Classifier Cost</span>
                    <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>${routerOverhead.cost.toFixed(6)}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '2px' }}>Tokens Evaluated</span>
                    <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{routerOverhead.tokens}</strong>
                  </div>
                </div>
                
                <div style={{ 
                  fontSize: '0.82rem', 
                  color: 'var(--text-main)', 
                  borderTop: '1px solid var(--border-color)', 
                  paddingTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap'
                }}>
                  <span>Routing Pathway:</span> 
                  <span style={{ color: 'var(--text-muted)' }}>Query complexity matches routing threshold. Redirecting to </span>
                  <span style={{ 
                    color: '#10b981', 
                    fontWeight: 800,
                    textDecoration: 'underline',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {routedModel ? routedModel.modelName : intersectionModelId}
                  </span>
                </div>
              </div>
            )}

            {/* Detailed Metric Table */}
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Model</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Latency</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Input Tokens</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Output Tokens</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Token Rates (Per 1M)</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', textAlign: 'right' }}>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {activeResults.map((result) => {
                    const modelColor = modelSpecs[result.modelId]?.color || '#94a3b8';
                    const isIntersection = result.modelId === intersectionModelId;
                    return (
                      <tr 
                        key={result.modelId} 
                        style={{ 
                          borderBottom: '1px solid var(--border-color)', 
                          background: activeTab === result.modelId 
                            ? 'var(--bg-card-hover)' 
                            : isIntersection 
                              ? 'rgba(16, 185, 129, 0.05)' 
                              : 'transparent',
                          borderLeft: isIntersection ? '4px solid #10b981' : 'none'
                        }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: modelColor }}></span>
                            <button 
                              onClick={() => setActiveTab(result.modelId)} 
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: 'var(--text-main)', 
                                fontWeight: 600, 
                                cursor: 'pointer',
                                textAlign: 'left',
                                padding: 0,
                                textDecoration: 'underline'
                              }}
                            >
                              {result.modelName}
                            </button>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginLeft: '4px' }}>
                              ({result.provider})
                            </span>
                            {isIntersection && (
                              <span style={{ 
                                fontSize: '0.65rem', 
                                background: '#10b981', 
                                color: '#fff', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                fontWeight: 'bold',
                                marginLeft: '6px'
                              }}>
                                BALANCED CHOICE
                              </span>
                            )}
                            {result.isLive && (
                              <span style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 'bold', marginLeft: '6px' }}>LIVE</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{result.latency} ms</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{result.inputTokens}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{result.outputTokens}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          In: ${result.inputCostPer1M.toFixed(2)} | Out: ${result.outputCostPer1M.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--text-main)' }}>
                          ${result.totalCost.toFixed(6)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Response Viewer */}
            {activeTab && activeResults.find(r => r.modelId === activeTab) && (() => {
              const current = activeResults.find(r => r.modelId === activeTab)!;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        Output Response: {current.modelName} ({current.provider.toUpperCase()})
                      </span>
                      {current.modelId === intersectionModelId && (
                        <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
                          Optimal compromise between speed and cost (Balanced Choice)
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Calculated Cost: ${current.totalCost.toFixed(6)}
                    </span>
                  </div>
                  <div 
                    style={{ 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '6px', 
                      padding: '12px', 
                      fontSize: '0.82rem', 
                      lineHeight: '1.5',
                      fontFamily: 'Consolas, Monaco, monospace', 
                      color: 'var(--text-main)', 
                      whiteSpace: 'pre-wrap',
                      maxHeight: '220px',
                      overflowY: 'auto'
                    }}
                  >
                    {current.response}
                  </div>
                </div>
              );
            })()}

          </div>
        );
      })()}

      {/* Hybrid Semantic Router Results */}
      {routingState !== 'idle' && routerMode === 'hybrid' && hybridResults.length > 0 && (() => {
        const parts = segmentQuery(query);
        
        // Cost & Latency Math
        const hybridCost = hybridResults.reduce((acc, r) => acc + r.cost, 0);
        const hybridLatency = Math.max(...hybridResults.map(r => r.latency), 0) + 120; // 120ms router overhead
        
        const highestComplexity = hybridResults.reduce((max, r) => {
          const ranks = { nano: 1, flash: 2, pro: 3, ultra: 4 };
          return ranks[r.complexity] > ranks[max] ? r.complexity : max;
        }, 'nano' as 'nano' | 'flash' | 'pro' | 'ultra');

        let naiveModelId = 'gemini-flash';
        if (highestComplexity === 'ultra') naiveModelId = 'gpt-4o';
        else if (highestComplexity === 'pro') naiveModelId = 'gemini-pro';
        else if (highestComplexity === 'flash') naiveModelId = 'gemini-flash';
        else naiveModelId = 'gemini-nano';

        const naiveModel = modelSpecs[naiveModelId] || MODELS[naiveModelId] || MODELS['gpt-4o'];

        const naiveInTokens = Math.max(10, Math.ceil(query.length / 4));
        const naiveOutTokens = Math.max(10, hybridResults.reduce((acc, r) => acc + r.tokens, 0) - (parts.length * 8));
        const naiveCost = (naiveInTokens / 1000000 * naiveModel.inputCostPer1M) + (naiveOutTokens / 1000000 * naiveModel.outputCostPer1M);
        const naiveLatency = Math.round(naiveModel.avgLatency * 1.25);

        const costSavingsUSD = Math.max(0, naiveCost - hybridCost);
        const costSavingsPct = naiveCost > 0 ? (costSavingsUSD / naiveCost) * 100 : 0;

        const latencySavingsMS = Math.max(0, naiveLatency - hybridLatency);
        const latencySavingsPct = naiveLatency > 0 ? (latencySavingsMS / naiveLatency) * 100 : 0;

        return (
          <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '10px' }}>
            
            {/* Visual Query Segmentation Flowchart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Query Segmentation &amp; Routing Pathway
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {hybridResults.map((part, idx) => {
                  const modelColor = modelSpecs[part.routedModelId]?.color || '#94a3b8';
                  return (
                    <div 
                      key={idx} 
                      className="animate-fade-in"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px', 
                        background: 'var(--bg-main)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '8px', 
                        padding: '12px 16px',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                          Segment #{idx + 1} &bull; <span style={{ color: modelColor }}>{part.complexity.toUpperCase()} complexity</span>
                        </span>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0, fontStyle: 'italic', lineHeight: '1.4' }}>
                          "{part.text}"
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>→</span>
                        <div style={{ 
                          width: '200px', 
                          background: 'var(--bg-card)', 
                          borderLeft: `4px solid ${modelColor}`, 
                          borderRadius: '4px',
                          padding: '8px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>{part.routedModelName}</span>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                            Cost: ${part.cost.toFixed(6)} | Latency: {part.latency}ms
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mathematical Efficiency Dashboard */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Router Math &amp; Efficiency Breakdown
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Comparing naive sequential routing (entire prompt sent to single model) against parallelized segment routing.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {/* Cost savings */}
                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Financial Optimization</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Naive Cost ({naiveModel.name}):</span>
                      <span style={{ fontFamily: 'monospace' }}>${naiveCost.toFixed(6)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 600 }}>
                      <span>Semantic Router Cost (Combined):</span>
                      <span style={{ fontFamily: 'monospace' }}>${hybridCost.toFixed(6)}</span>
                    </div>
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '2px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#10b981', fontSize: '0.85rem' }}>
                      <span>Total Savings:</span>
                      <span>${costSavingsUSD.toFixed(6)} ({costSavingsPct.toFixed(1)}% saved)</span>
                    </div>
                  </div>
                </div>

                {/* Latency savings */}
                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Speed Optimization</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Naive Latency ({naiveModel.name}):</span>
                      <span style={{ fontFamily: 'monospace' }}>{naiveLatency} ms</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6', fontWeight: 600 }}>
                      <span>Parallel Router Latency (+120ms):</span>
                      <span style={{ fontFamily: 'monospace' }}>{hybridLatency} ms</span>
                    </div>
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '2px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#3b82f6', fontSize: '0.85rem' }}>
                      <span>Time Savings:</span>
                      <span>{latencySavingsMS} ms ({latencySavingsPct.toFixed(1)}% faster)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulation */}
              <div style={{ 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                padding: '12px 14px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                lineHeight: '1.4'
              }}>
                <strong>Mathematical Formulation of Hybrid Routing:</strong>
                <div style={{ margin: '6px 0', fontFamily: 'monospace', color: 'var(--text-main)', fontSize: '0.8rem' }}>
                  Cost_Router = ∑(Tokens_Segment_i * Model_Segment_i_Rate) <br />
                  Latency_Router = max(Latency_Segment_i) + Routing_Overhead
                </div>
                Using semantic parsing, simple sentences are routed to cheap, sub-100ms models. More complex reasoning is routed to heavier models. Since sub-queries run in parallel, routing overhead is bounded by the slowest segment, yielding substantial concurrent speedup and cost efficiency.
              </div>

              {/* Recommended combination indicator */}
              <div style={{ 
                fontSize: '0.82rem', 
                color: 'var(--text-main)', 
                borderTop: '1px solid var(--border-color)', 
                paddingTop: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap'
              }}>
                <span>Routing Pathway:</span> 
                <span style={{ color: 'var(--text-muted)' }}>Optimal parallel combination recommended as Balanced Choice: </span>
                <span style={{ 
                  color: '#10b981', 
                  fontWeight: 800,
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexWrap: 'wrap'
                }}>
                  {Array.from(new Set(hybridResults.map(r => r.routedModelName))).join(' + ')}
                </span>
              </div>
            </div>

            {/* Aggregated Output Viewer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Aggregated Router Response
              </span>
              <div 
                style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px', 
                  padding: '14px', 
                  fontSize: '0.82rem', 
                  lineHeight: '1.6',
                  color: 'var(--text-main)',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}
              >
                {hybridResults.map((part, idx) => (
                  <div key={idx} style={{ marginBottom: idx < hybridResults.length - 1 ? '14px' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: modelSpecs[part.routedModelId]?.color || 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 'bold' }}>
                      <span>Part {idx + 1} &bull; Routed to {part.routedModelName}</span>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>
                      {part.response}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        );
      })()}
    </section>
  );
}
