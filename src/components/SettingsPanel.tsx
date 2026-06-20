'use client';

import React from 'react';
import { MODELS, Model } from '../utils/routerEngine';

interface SettingsPanelProps {
  thresholds: { nano: number; flash: number; pro: number };
  setThresholds: React.Dispatch<React.SetStateAction<{ nano: number; flash: number; pro: number }>>;
  modelSpecs: Record<string, Model>;
  updateModelSpec: (id: string, field: keyof Model, value: any) => void;
  resetSettings: () => void;
}

export default function SettingsPanel({
  thresholds,
  setThresholds,
  modelSpecs,
  updateModelSpec,
  resetSettings,
}: SettingsPanelProps) {
  const handleThresholdChange = (key: 'nano' | 'flash' | 'pro', value: number) => {
    // Ensure logical order: nano <= flash <= pro
    const newVal = Math.round(value * 10) / 10;
    setThresholds((prev) => {
      const next = { ...prev, [key]: newVal };
      if (key === 'nano' && next.nano > next.flash) next.flash = next.nano;
      if (key === 'flash') {
        if (next.flash < next.nano) next.nano = next.flash;
        if (next.flash > next.pro) next.pro = next.flash;
      }
      if (key === 'pro' && next.pro < next.flash) next.flash = next.pro;
      return next;
    });
  };

  return (
    <aside className="glass-panel animated-pulse-glow" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '4px', background: 'linear-gradient(to right, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Router Settings
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Configure complexity thresholds and costs.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '0.95rem', color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
          Complexity Thresholds
        </h3>
        
        {/* Nano threshold */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--color-nano)', fontWeight: 500 }}>Nano Limit</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>{thresholds.nano.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="10.0"
            step="0.1"
            value={thresholds.nano}
            onChange={(e) => handleThresholdChange('nano', parseFloat(e.target.value))}
            style={{ accentColor: 'var(--color-nano)' }}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>
            Queries scoring below this route to Gemini Nano.
          </span>
        </div>

        {/* Flash threshold */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--color-flash)', fontWeight: 500 }}>Flash Limit</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>{thresholds.flash.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="10.0"
            step="0.1"
            value={thresholds.flash}
            onChange={(e) => handleThresholdChange('flash', parseFloat(e.target.value))}
            style={{ accentColor: 'var(--color-flash)' }}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>
            Queries scoring below this route to Gemini Flash.
          </span>
        </div>

        {/* Pro threshold */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--color-pro)', fontWeight: 500 }}>Pro Limit</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>{thresholds.pro.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="10.0"
            step="0.1"
            value={thresholds.pro}
            onChange={(e) => handleThresholdChange('pro', parseFloat(e.target.value))}
            style={{ accentColor: 'var(--color-pro)' }}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>
            Queries scoring below this route to Gemini Pro. Rest route to Ultra.
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '0.95rem', color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
          Model Pricing Specs
        </h3>
        
        {Object.values(modelSpecs).map((model) => (
          <div key={model.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: model.color }}></span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{model.name}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', marginLeft: 'auto' }}>({model.parameters})</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Input Cost/1M</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'relative' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={model.inputCostPer1M}
                    onChange={(e) => updateModelSpec(model.id, 'inputCostPer1M', parseFloat(e.target.value) || 0)}
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', fontSize: '0.75rem', width: '100%', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Output Cost/1M</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={model.outputCostPer1M}
                    onChange={(e) => updateModelSpec(model.id, 'outputCostPer1M', parseFloat(e.target.value) || 0)}
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', fontSize: '0.75rem', width: '100%', outline: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={resetSettings}
        className="btn-secondary"
        style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.85rem', marginTop: '8px' }}
      >
        Reset to Defaults
      </button>
    </aside>
  );
}
