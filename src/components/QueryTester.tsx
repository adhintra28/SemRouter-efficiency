'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MODELS, Model, ModelExecutionResult, runModelQuery, getIntersectionModelId, segmentQuery, SegmentedPart } from '../utils/routerEngine';
import { RouterOverhead } from './RouterDashboard';

interface QueryTesterProps {
  enabledModelIds: string[];
  onRouteResult: (results: ModelExecutionResult[], complexity: 'nano' | 'flash' | 'pro' | 'ultra', overhead?: RouterOverhead) => void;
  modelSpecs: Record<string, Model>;
  classifierModelId: string;
  queryComplexity: 'nano' | 'flash' | 'pro' | 'ultra' | null;
  routerOverhead: RouterOverhead | null;
  latencyWeight: number;
  priceWeight: number;
}

function StreamingOutput({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!isStreaming) return;

    let idx = 0;
    const words = text.split(' ');
    
    // Smooth, natural word-by-word typing effect
    const interval = setInterval(() => {
      if (idx < words.length) {
        setDisplayedText((prev) => prev + (idx > 0 ? ' ' : '') + words[idx]);
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 15 + Math.random() * 15);

    return () => clearInterval(interval);
  }, [text, isStreaming]);

  const outputText = isStreaming ? displayedText : text;

  return (
    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', position: 'relative' }}>
      {outputText}
      {isStreaming && displayedText.length < text.length && <span className="streaming-cursor" />}
    </div>
  );
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
  const [routerMode, setRouterMode] = useState<'standard' | 'hybrid'>('standard');
  const [hybridResults, setHybridResults] = useState<SegmentedPart[]>([]);

  const suggestions = [
    { label: "Greeting", text: "Hey! How are you doing today?", tier: 'nano' },
    { label: "Summarize", text: "Summarize the water cycle in three sentences.", tier: 'flash' },
    { label: "Coding", text: "Write a JavaScript function to check if a string is a palindrome, ignoring spaces and punctuation.", tier: 'pro' },
    { label: "System Design", text: "Design a high-level, fault-tolerant system architecture for a real-time collaborative document editor like Google Docs.", tier: 'ultra' },
  ];

  const hybridSuggestions = [
    { label: "Palindromes & France (Hybrid)", text: "Hello! Write a JavaScript function to check if a string is a palindrome, ignoring spaces and punctuation, and also Is Paris the capital of France?" },
    { label: "SQL/NoSQL & Google Docs (Hybrid)", text: "Hey, can you help me write a quick email subject line? Compare and contrast SQL and NoSQL databases, then design a fault-tolerant Google Docs system architecture." },
    { label: "Node.js, Math, & Blogs (Hybrid)", text: "hello! how's it going? Explain the concept of 'Event Loop' in Node.js, and what is 15 + 28, and suggest 5 blog post titles about remote work productivity." },
  ];

  const suggestionsToUse = routerMode === 'standard' ? suggestions : hybridSuggestions;

  const handleRoute = useCallback(async (textToRoute: string) => {
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
        } as ModelExecutionResult));

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
      selectedModelId = 'gemini-flash';
    }

    const classifierModel = modelSpecs[selectedModelId] || MODELS[selectedModelId] || MODELS['gemini-flash'];

    const classifyStartTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
    
    const { classifyQueryByPresetSimilarity } = await import('../utils/routerEngine');
    const detectedComplexity = classifyQueryByPresetSimilarity(textToRoute);
    
    const overheadLatency = Date.now() - classifyStartTime;
    const inTokens = Math.max(5, Math.ceil(textToRoute.length / 4));
    const outTokens = 5;
    const overheadTokens = inTokens + outTokens;
    const overheadCost = (inTokens / 1000000 * classifierModel.inputCostPer1M) + (outTokens / 1000000 * classifierModel.outputCostPer1M);

    const classificationOverhead = {
      provider: classifierModel.provider,
      modelName: classifierModel.name,
      latency: overheadLatency,
      cost: overheadCost,
      tokens: overheadTokens,
      isLive: false,
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
    } catch (e) {
      console.error("Execution failed:", e);
      setRoutingState('idle');
    }
  }, [enabledModelIds, onRouteResult, modelSpecs, classifierModelId, routerMode, latencyWeight, priceWeight]);

  const handleSuggestClick = useCallback((text: string) => {
    setQuery(text);
    handleRoute(text);
  }, [handleRoute]);

  const intersectionModelId = getIntersectionModelId(activeResults, queryComplexity, latencyWeight / 100, priceWeight / 100);
  const routedModel = activeResults.find(r => r.modelId === intersectionModelId);

  return (
    <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Mode Switches */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
            Playground Comparison
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Enter a prompt to compare response speed, costs, and token consumption simultaneously.
          </p>
        </div>

        {/* Tab mode toggle */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '3px' }}>
          <button 
            onClick={() => { setRouterMode('standard'); setRoutingState('idle'); }}
            style={{
              background: routerMode === 'standard' ? 'var(--btn-primary-bg)' : 'transparent',
              color: routerMode === 'standard' ? 'var(--btn-primary-text)' : 'var(--text-muted)',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Multi-Model Playground
          </button>
          <button 
            onClick={() => { setRouterMode('hybrid'); setRoutingState('idle'); }}
            style={{
              background: routerMode === 'hybrid' ? 'var(--btn-primary-bg)' : 'transparent',
              color: routerMode === 'hybrid' ? 'var(--btn-primary-text)' : 'var(--text-muted)',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Hybrid Router Math
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
                padding: '5px 10px',
                borderRadius: '4px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = sampleSpec.color;
                e.currentTarget.style.color = 'var(--text-main)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: sampleSpec.color }}></span>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Textarea Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <textarea
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a custom query here to analyze response variations across selected LLMs..."
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            fontSize: '0.85rem',
            lineHeight: '1.5',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            transition: 'border-color var(--transition-fast)',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => handleRoute(query)}
            className="btn-primary"
            disabled={routingState === 'analyzing' || !query.trim() || enabledModelIds.length === 0}
            style={{ minWidth: '140px' }}
          >
            {routingState === 'analyzing' ? 'Routing Queries...' : 'Run Playground'}
          </button>
        </div>
      </div>

      {/* Side-by-Side playground column grid */}
      {routingState !== 'idle' && routerMode === 'standard' && (
        <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
          
          {/* AI Router Decision Panel */}
          {queryComplexity && routerOverhead && (
            <div 
              className="animate-fade-in"
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    background: 'var(--btn-primary-bg)', 
                    color: 'var(--btn-primary-text)', 
                    padding: '3px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.68rem', 
                    fontWeight: 700,
                    letterSpacing: '0.05em'
                  }}>
                    AI ROUTER DECISION
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Complexity: <span style={{ textTransform: 'uppercase', color: 'var(--text-main)', fontWeight: 800 }}>{queryComplexity}</span>
                  </span>
                </div>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                gap: '10px', 
                fontSize: '0.78rem',
                background: 'var(--bg-card)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <span style={{ color: 'var(--text-dark)', display: 'block', fontSize: '0.62rem', textTransform: 'uppercase', marginBottom: '2px' }}>Router Latency</span>
                  <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{routerOverhead.latency} ms</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dark)', display: 'block', fontSize: '0.62rem', textTransform: 'uppercase', marginBottom: '2px' }}>Router Evaluation Cost</span>
                  <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>${routerOverhead.cost.toFixed(6)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dark)', display: 'block', fontSize: '0.62rem', textTransform: 'uppercase', marginBottom: '2px' }}>Tokens Evaluated</span>
                  <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{routerOverhead.tokens}</strong>
                </div>
              </div>
              
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'var(--text-muted)', 
                borderTop: '1px solid var(--border-color)', 
                paddingTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexWrap: 'wrap'
              }}>
                <span>Pathway Routing:</span> 
                <span>Query properties match thresholds. Optimal routing points to </span>
                <span style={{ 
                  color: 'var(--text-main)', 
                  fontWeight: 700,
                  textDecoration: 'underline'
                }}>
                  {routedModel ? routedModel.modelName : intersectionModelId}
                </span>
              </div>
            </div>
          )}

          {/* Side-by-Side Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            width: '100%',
            marginTop: '8px'
          }}>
            {enabledModelIds.map((mId) => {
              const spec = modelSpecs[mId];
              if (!spec) return null;

              const result = activeResults.find(r => r.modelId === mId);
              const isIntersection = mId === intersectionModelId;
              const isCardLoading = routingState === 'analyzing' && !result;

              return (
                <div 
                  key={mId}
                  className="glass-panel"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    border: isIntersection ? '1px solid var(--border-focus)' : '1px solid var(--border-color)',
                    background: isIntersection ? 'rgba(255, 255, 255, 0.01)' : 'var(--bg-card)',
                    position: 'relative',
                    minHeight: '280px',
                    padding: '16px 20px',
                    transition: 'all 0.22s ease'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: spec.color }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{spec.name}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)', textTransform: 'uppercase', fontWeight: 500 }}>
                          {spec.provider.toUpperCase()} &bull; {spec.parameters}
                        </span>
                      </div>
                    </div>
                    {isIntersection && (
                      <span style={{
                        background: 'var(--btn-primary-bg)',
                        color: 'var(--btn-primary-text)',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        BALANCED CHOICE
                      </span>
                    )}
                  </div>

                  {/* Body: Streams output or loading skeletal states */}
                  <div style={{ 
                    flex: 1, 
                    fontSize: '0.8rem', 
                    color: 'var(--text-main)', 
                    lineHeight: '1.6', 
                    fontFamily: 'var(--font-mono)', 
                    minHeight: '130px',
                    padding: '4px 0'
                  }}>
                    {isCardLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.5 }}>
                        <div style={{ height: '14px', width: '92%', background: 'var(--border-color)', borderRadius: '3px', animation: 'fadeIn 1s infinite alternate' }} />
                        <div style={{ height: '14px', width: '78%', background: 'var(--border-color)', borderRadius: '3px', animation: 'fadeIn 1.2s infinite alternate' }} />
                        <div style={{ height: '14px', width: '85%', background: 'var(--border-color)', borderRadius: '3px', animation: 'fadeIn 0.9s infinite alternate' }} />
                      </div>
                    ) : result ? (
                      <StreamingOutput key={result.response} text={result.response} isStreaming={routingState === 'done'} />
                    ) : (
                      <span style={{ color: 'var(--text-dark)', fontStyle: 'italic' }}>Waiting...</span>
                    )}
                  </div>

                  {/* Footer Stats Analytics Panel */}
                  {result && (
                    <div style={{ 
                      borderTop: '1px solid var(--border-color)', 
                      paddingTop: '10px', 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '8px', 
                      fontSize: '0.72rem',
                      color: 'var(--text-dark)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-dark)' }}>Latency</span>
                        <strong style={{ color: 'var(--text-main)' }}>{result.latency} ms</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-dark)' }}>Tokens</span>
                        <strong style={{ color: 'var(--text-main)' }}>{result.inputTokens} in / {result.outputTokens} out</strong>
                      </div>
                      <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-dark)' }}>Pricing: In ${result.inputCostPer1M.toFixed(2)} | Out ${result.outputCostPer1M.toFixed(2)}</span>
                        <strong style={{ color: 'var(--text-main)' }}>${result.totalCost.toFixed(6)}</strong>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Hybrid Semantic Router Results */}
      {routingState !== 'idle' && routerMode === 'hybrid' && hybridResults.length > 0 && (() => {
        const parts = segmentQuery(query);
        
        const hybridCost = hybridResults.reduce((acc, r) => acc + r.cost, 0);
        const hybridLatency = Math.max(...hybridResults.map(r => r.latency), 0) + 120;
        
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
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
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
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-sm)', 
                        padding: '12px 16px',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)', fontWeight: 700, textTransform: 'uppercase' }}>
                          Segment #{idx + 1} &bull; <span style={{ color: modelColor }}>{part.complexity.toUpperCase()} complexity</span>
                        </span>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0, fontStyle: 'italic', lineHeight: '1.4' }}>
                          &quot;{part.text}&quot;
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1rem', color: 'var(--text-dark)' }}>→</span>
                        <div style={{ 
                          width: '200px', 
                          background: 'var(--bg-main)', 
                          borderLeft: `4px solid ${modelColor}`, 
                          borderRadius: '4px',
                          padding: '8px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>{part.routedModelName}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)', fontFamily: 'var(--font-mono)' }}>
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
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Router Math &amp; Efficiency Breakdown
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dark)', margin: '2px 0 0 0' }}>
                  Comparing naive sequential routing (entire prompt sent to single model) against parallelized segment routing.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {/* Cost savings */}
                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dark)', textTransform: 'uppercase' }}>Financial Optimization</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Naive Cost ({naiveModel.name}):</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>${naiveCost.toFixed(6)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)', fontWeight: 600 }}>
                      <span>Semantic Router Cost (Combined):</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>${hybridCost.toFixed(6)}</span>
                    </div>
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '2px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      <span>Total Savings:</span>
                      <span>${costSavingsUSD.toFixed(6)} ({costSavingsPct.toFixed(1)}% saved)</span>
                    </div>
                  </div>
                </div>

                {/* Latency savings */}
                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dark)', textTransform: 'uppercase' }}>Speed Optimization</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Naive Latency ({naiveModel.name}):</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{naiveLatency} ms</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)', fontWeight: 600 }}>
                      <span>Parallel Router Latency (+120ms):</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{hybridLatency} ms</span>
                    </div>
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '2px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      <span>Time Savings:</span>
                      <span>{latencySavingsMS} ms ({latencySavingsPct.toFixed(1)}% faster)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulation */}
              <div style={{ 
                background: 'var(--bg-main)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '12px 14px',
                fontSize: '0.75rem',
                color: 'var(--text-dark)',
                lineHeight: '1.4'
              }}>
                <strong>Mathematical Formulation of Hybrid Routing:</strong>
                <div style={{ margin: '6px 0', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', fontSize: '0.8rem' }}>
                  Cost_Router = ∑(Tokens_Segment_i * Model_Segment_i_Rate) <br />
                  Latency_Router = max(Latency_Segment_i) + Routing_Overhead
                </div>
                Using semantic parsing, simple sentences are routed to cheap, sub-100ms models. More complex reasoning is routed to heavier models. Since sub-queries run in parallel, routing overhead is bounded by the slowest segment, yielding substantial concurrent speedup and cost efficiency.
              </div>

              {/* Recommended combination indicator */}
              <div style={{ 
                fontSize: '0.8rem', 
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
                  color: 'var(--text-main)', 
                  fontWeight: 700,
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Aggregated Router Response
              </span>
              <div 
                style={{ 
                  background: 'var(--bg-main)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-sm)', 
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: modelSpecs[part.routedModelId]?.color || 'var(--text-dark)', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 'bold' }}>
                      <span>Part {idx + 1} &bull; Routed to {part.routedModelName}</span>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
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
