import { useState, useEffect } from 'react';
import { getTrainingRuns } from '../../api/greennode';

export default function StatsBar() {
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    getTrainingRuns().then(res => setRuns(res.data)).catch(() => {});
  }, []);

  const totalRuns = runs.length;
  const totalCO2 = runs.reduce((sum, r) => sum + r.emissions_kg, 0);
  const totalEnergy = runs.reduce((sum, r) => sum + r.energy_kwh, 0);

  const stats = [
    { label: 'total runs', value: totalRuns, unit: '' },
    { label: 'total co₂ measured', value: (totalCO2 * 1e6).toFixed(4), unit: 'μgCO₂' },
    { label: 'total energy', value: (totalEnergy * 1e6).toFixed(4), unit: 'μWh' },
  ];

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      padding: '10px 32px',
      display: 'flex',
      alignItems: 'center',
      gap: '32px',
    }}>
      {stats.map(({ label, value, unit }, i) => (
        <div key={label} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
        }}>
          {i > 0 && (
            <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {label}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--accent-green)',
              fontWeight: '500',
            }}>
              {value}
              {unit && (
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                  {unit}
                </span>
              )}
            </span>
          </div>
        </div>
      ))}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{
          width: '6px', height: '6px',
          borderRadius: '50%',
          background: 'var(--accent-green)',
          boxShadow: '0 0 6px var(--accent-green)',
          animation: 'pulse 2s infinite',
        }} />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
        }}>
          live
        </span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}