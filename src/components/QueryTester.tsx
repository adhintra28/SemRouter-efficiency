'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RoutingDecision, routeQuery, PRESET_QUERIES } from '../utils/routerEngine';

interface QueryTesterProps {
  thresholds: { nano: number; flash: number; pro: number };
  onRouteResult: (result: RoutingDecision) => void;
}

export default function QueryTester({ thresholds, onRouteResult }: QueryTesterProps) {
  const [query, setQuery] = useState('');
  const [routingState, setRoutingState] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [activeResult, setActiveResult] = useState<RoutingDecision | null>(null);
  const [typedResponse, setTypedResponse] = useState('');
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const suggestions = [
    { label: "Greeting (Nano)", text: "Hey! How are you doing today?", color: "var(--color-nano)" },
    { label: "Summarize (Flash)", text: "Summarize the water cycle in three sentences.", color: "var(--color-flash)" },
    { label: "Coding (Pro)", text: "Write a JavaScript function to check if a string is a palindrome, ignoring spaces and punctuation.", color: "var(--color-pro)" },
    { label: "System Design (Ultra)", text: "Design a high-level, fault-tolerant system architecture for a real-time collaborative document editor like Google Docs. Show components and database choices.", color: "var(--color-ultra)" },
  ];

  const handleRoute = (textToRoute: string) => {
    if (!textToRoute.trim()) return;
    
    // Clear typing effect
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }
    setTypedResponse('');
    
    setRoutingState('analyzing');
    setActiveResult(null);

    // Simulate short network delay for analyzer visual satisfaction
    setTimeout(() => {
      const decision = routeQuery(textToRoute, thresholds);
      setActiveResult(decision);
      setRoutingState('done');
      onRouteResult(decision);

      // Trigger typing effect for simulated response
      let index = 0;
      const fullResponse = decision.simulatedResponse;
      const speed = Math.max(5, Math.ceil(150 / (fullResponse.length / 5))); // Speed up for long responses
      
      typingTimerRef.current = setInterval(() => {
        setTypedResponse((prev) => prev + fullResponse.charAt(index));
        index++;
        if (index >= fullResponse.length) {
          if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        }
      }, speed);

    }, 850);
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  const handleSuggestClick = (text: string) => {
    setQuery(text);
    handleRoute(text);
  };

  // Compare cost to if we routed to Ultra (137B+) always
  const alwaysUltraCost = activeResult 
    ? (activeResult.inputTokens / 1000000 * 5.0) + (activeResult.outputTokens / 1000000 * 15.0) 
    : 0;

  const costSavedPercent = activeResult && alwaysUltraCost > 0
    ? ((alwaysUltraCost - activeResult.cost) / alwaysUltraCost) * 100
    : 0;

  return (
    <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '4px', background: 'linear-gradient(to right, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Playground Router
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Enter a prompt to see which model is chosen by the semantic classifier.
        </p>
      </div>

      {/* Query Suggestions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSuggestClick(s.text)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${s.color}33`,
              color: 'var(--text-main)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${s.color}15`;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Query Input */}
      <div style={{ position: 'relative', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask something... (e.g. write a function, translate this, solve x+5=10)"
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color var(--transition-fast)',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRoute(query);
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--color-flash)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
        <button
          onClick={() => handleRoute(query)}
          className="btn-primary"
          disabled={routingState === 'analyzing' || !query.trim()}
          style={{
            opacity: !query.trim() || routingState === 'analyzing' ? 0.6 : 1,
            cursor: !query.trim() || routingState === 'analyzing' ? 'not-allowed' : 'pointer',
            minWidth: '120px',
            justifyContent: 'center',
          }}
        >
          {routingState === 'analyzing' ? 'Routing...' : 'Route Prompt'}
        </button>
      </div>

      {/* Visualization Panel */}
      {routingState !== 'idle' && (
        <div className="animate-scale-in" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '16px', marginTop: '10px' }}>
          {/* Active Flow Graph SVG */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '10px 0 20px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '80px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                ✍️
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Query</span>
            </div>

            <div style={{ flex: 1, height: '2px', position: 'relative' }}>
              <svg width="100%" height="20" style={{ position: 'absolute', top: '-9px' }}>
                <line x1="0" y1="10" x2="100%" y2="10" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                <line x1="0" y1="10" x2="100%" y2="10" stroke="var(--color-flash)" strokeWidth="2" className="neural-line-animated" />
              </svg>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '90px' }}>
              <div 
                style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '50%', 
                  background: 'rgba(6, 182, 212, 0.05)', 
                  border: '1px solid var(--color-flash)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '0.95rem',
                  boxShadow: routingState === 'analyzing' ? '0 0 15px var(--color-flash)' : 'none',
                  animation: routingState === 'analyzing' ? 'flashPulse 1s infinite' : 'none'
                }}
              >
                🧠
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-flash)', fontWeight: 600 }}>Router</span>
            </div>

            <div style={{ flex: 1, height: '2px', position: 'relative' }}>
              <svg width="100%" height="20" style={{ position: 'absolute', top: '-9px' }}>
                <line x1="0" y1="10" x2="100%" y2="10" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                {activeResult && (
                  <line 
                    x1="0" 
                    y1="10" 
                    x2="100%" 
                    y2="10" 
                    stroke={activeResult.model.color} 
                    strokeWidth="2" 
                    className="neural-line-animated" 
                  />
                )}
              </svg>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '80px' }}>
              <div 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: activeResult ? `${activeResult.model.color}15` : 'rgba(255,255,255,0.03)', 
                  border: activeResult ? `1.5px solid ${activeResult.model.color}` : '1px solid rgba(255,255,255,0.06)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '0.9rem',
                  boxShadow: activeResult ? `0 0 15px ${activeResult.model.color}44` : 'none'
                }}
              >
                ⚡
              </div>
              <span style={{ fontSize: '0.65rem', color: activeResult ? activeResult.model.color : 'var(--text-muted)', fontWeight: 600 }}>
                {activeResult ? activeResult.model.parameters : 'Target'}
              </span>
            </div>
          </div>

          {/* Router Decision & Stats */}
          {activeResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className={`badge badge-${activeResult.model.id}`}>
                    {activeResult.model.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Selected</span>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', marginLeft: 'auto', fontWeight: 600 }}>
                    -{costSavedPercent.toFixed(1)}% cost
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                  {activeResult.reason}
                </p>
              </div>

              {/* Score breakdown metrics bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 4px' }}>
                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Semantic Complexity Score Profiles:
                </h4>
                
                {(['nano', 'flash', 'pro', 'ultra'] as const).map((key) => {
                  const m = activeResult.model;
                  const score = activeResult.scores[key];
                  const mDef = suggestions.find(s => s.label.toLowerCase().includes(key));
                  const modelColor = key === 'nano' ? 'var(--color-nano)' : key === 'flash' ? 'var(--color-flash)' : key === 'pro' ? 'var(--color-pro)' : 'var(--color-ultra)';
                  
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '60px', textTransform: 'capitalize' }}>
                        {key}
                      </span>
                      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${score * 10}%`, 
                            backgroundColor: modelColor, 
                            boxShadow: `0 0 8px ${modelColor}`,
                            transition: 'width 0.5s ease-out'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-muted)', width: '25px', textAlign: 'right' }}>
                        {score.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Model Info Specs Ticker */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dark)', textTransform: 'uppercase' }}>Latency</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                    {activeResult.latency} ms
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dark)', textTransform: 'uppercase' }}>Cost</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px', fontFamily: 'monospace' }}>
                    ${activeResult.cost.toFixed(6)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dark)', textTransform: 'uppercase' }}>Tokens</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                    {activeResult.inputTokens}in / {activeResult.outputTokens}out
                  </div>
                </div>
              </div>

              {/* Simulated response text */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Response Output:</span>
                <div 
                  style={{ 
                    background: 'rgba(0,0,0,0.2)', 
                    border: '1px solid rgba(255,255,255,0.02)', 
                    borderRadius: '6px', 
                    padding: '12px', 
                    fontSize: '0.82rem', 
                    lineHeight: '1.5',
                    fontFamily: 'Consolas, Monaco, monospace', 
                    color: 'var(--text-main)', 
                    whiteSpace: 'pre-wrap',
                    maxHeight: '180px',
                    overflowY: 'auto'
                  }}
                >
                  {typedResponse}
                  {typedResponse.length < activeResult.simulatedResponse.length && (
                    <span style={{ animation: 'flashPulse 0.8s infinite', color: activeResult.model.color }}>|</span>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </section>
  );
}
