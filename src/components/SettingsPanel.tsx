'use client';

import React from 'react';
import { Model } from '../utils/routerEngine';

interface SettingsPanelProps {
  enabledModelIds: string[];
  setEnabledModelIds: (ids: string[]) => void;
  modelSpecs: Record<string, Model>;
  latencyWeight: number;
  setLatencyWeight: (val: number) => void;
  priceWeight: number;
  setPriceWeight: (val: number) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function SettingsPanel({
  enabledModelIds,
  setEnabledModelIds,
  modelSpecs,
  latencyWeight,
  setLatencyWeight,
  priceWeight,
  setPriceWeight,
  isSidebarOpen,
  onToggleSidebar,
}: SettingsPanelProps) {

  const handleToggleModel = (id: string) => {
    if (enabledModelIds.includes(id)) {
      if (enabledModelIds.length > 1) {
        setEnabledModelIds(enabledModelIds.filter((mId) => mId !== id));
      }
    } else {
      setEnabledModelIds([...enabledModelIds, id]);
    }
  };

  const handleLatencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lat = parseInt(e.target.value);
    setLatencyWeight(lat);
    setPriceWeight(100 - lat);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = parseInt(e.target.value);
    setPriceWeight(price);
    setLatencyWeight(100 - price);
  };

  return (
    <aside 
      className="glass-panel" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isSidebarOpen ? '24px' : '0px', 
        padding: isSidebarOpen ? '24px' : '16px 8px',
        alignItems: isSidebarOpen ? 'stretch' : 'center',
        transition: 'all 0.3s ease',
        minHeight: isSidebarOpen ? 'auto' : '400px',
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: isSidebarOpen ? 'row' : 'column', 
          justifyContent: isSidebarOpen ? 'space-between' : 'center', 
          alignItems: 'center',
          width: '100%',
          gap: isSidebarOpen ? '0px' : '12px',
        }}
      >
        {isSidebarOpen && (
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '4px', color: 'var(--text-main)', margin: 0 }}>
              Playground Settings
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Select active models to analyze and provide optional API keys.
            </p>
          </div>
        )}
        <button
          onClick={onToggleSidebar}
          style={{
            padding: isSidebarOpen ? '4px 10px' : '8px',
            fontSize: '0.68rem',
            borderRadius: isSidebarOpen ? '20px' : '50%',
            width: isSidebarOpen ? 'auto' : '36px',
            height: isSidebarOpen ? 'auto' : '36px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card-hover)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
          title={isSidebarOpen ? 'Collapse Settings' : 'Expand Settings'}
        >
          {isSidebarOpen ? '← Collapse' : '→'}
        </button>
      </div>

      {isSidebarOpen && (
        <>

      {/* Models Toggle Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
          Select Models for Analysis
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.values(modelSpecs).map((model) => {
            const isEnabled = enabledModelIds.includes(model.id);
            return (
              <div 
                key={model.id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--bg-main)',
                  border: isEnabled ? '1px solid var(--border-focus)' : '1px solid var(--border-color)',
                  transition: 'border-color var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: model.color }}></span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: isEnabled ? 600 : 400, color: 'var(--text-main)' }}>
                      {model.name}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {model.provider.toUpperCase()} &bull; {model.parameters}
                    </span>
                  </div>
                </div>

                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
                  <input 
                    type="checkbox" 
                    checked={isEnabled}
                    onChange={() => handleToggleModel(model.id)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: isEnabled ? 'var(--btn-primary-bg)' : 'var(--border-color)',
                    transition: '.2s',
                    borderRadius: '34px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '14px',
                      width: '14px',
                      left: isEnabled ? '18px' : '2px',
                      bottom: '2px',
                      backgroundColor: isEnabled ? 'var(--btn-primary-text)' : 'var(--text-muted)',
                      transition: '.2s',
                      borderRadius: '50%'
                    }}></span>
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Routing Preferences Weightage */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
          Routing Optimization Focus
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-main)' }}>
              <span>Latency Priority</span>
              <strong style={{ fontFamily: 'monospace' }}>{latencyWeight}%</strong>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={latencyWeight} 
              onChange={handleLatencyChange}
              style={{
                width: '100%',
                cursor: 'pointer',
                accentColor: 'var(--btn-primary-bg)'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-main)' }}>
              <span>Price Priority</span>
              <strong style={{ fontFamily: 'monospace' }}>{priceWeight}%</strong>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={priceWeight} 
              onChange={handlePriceChange}
              style={{
                width: '100%',
                cursor: 'pointer',
                accentColor: 'var(--btn-primary-bg)'
              }}
            />
          </div>
          
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
            {latencyWeight > priceWeight ? 'Prioritizing speed over cost' : latencyWeight < priceWeight ? 'Prioritizing budget over speed' : 'Balanced speed and cost routing'}
          </div>
        </div>
      </div>


        </>
      )}
    </aside>
  );
}
