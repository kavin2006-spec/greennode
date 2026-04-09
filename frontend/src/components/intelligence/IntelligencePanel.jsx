import { useState, useEffect } from 'react';
import { getTrainingRuns } from '../../api/greennode';
import InfoButton from '../shared/InfoButton';

const api = {
  getBudget: () => fetch('http://localhost:8000/intelligence/budget').then(r => r.json()),
  getWhatIf: (run_id) => fetch('http://localhost:8000/intelligence/whatif', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ run_id })
  }).then(r => r.json())
};

function ProgressBar({ percent, onTrack }) {
  const capped = Math.min(percent, 100);
  const color = onTrack
    ? percent > 80 ? 'var(--accent-yellow)' : 'var(--accent-green)'
    : 'var(--accent-red)';

  return (
    <div style={{
      background: 'var(--border)',
      borderRadius: '4px',
      height: '6px',
      overflow: 'hidden',
      marginTop: '8px'
    }}>
      <div style={{
        width: `${capped}%`,
        height: '100%',
        background: color,
        borderRadius: '4px',
        transition: 'width 0.6s ease',
        boxShadow: `0 0 8px ${color}`,
      }} />
    </div>
  );
}

function BaselineProgress({ runs_recorded, runs_required }) {
  const pct = (runs_recorded / runs_required) * 100;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '28px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            collecting baseline
          </p>
          <p style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
            Run {runs_required - runs_recorded} more training job{runs_required - runs_recorded !== 1 ? 's' : ''} to unlock your carbon budget
          </p>
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '22px',
          color: 'var(--accent-green)',
          fontWeight: '500'
        }}>
          {runs_recorded}<span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>/{runs_required}</span>
        </span>
      </div>
      <ProgressBar percent={pct} onTrack={true} />
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '10px' }}>
        GreenNode needs {runs_required} runs to calculate a statistically reliable baseline before suggesting a budget.
      </p>
    </div>
  );
}

function BudgetCard({ budget }) {
  const isOver = !budget.on_track;
  const statusColor = isOver ? 'var(--accent-red)' : budget.percent_used > 80 ? 'var(--accent-yellow)' : 'var(--accent-green)';

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${statusColor}`,
      borderRadius: '8px',
      padding: '28px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            monthly carbon budget
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {new Date(budget.period_start).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            {' · '}
            <span style={{ color: 'var(--accent-green)' }}>
              {budget.reduction_target_pct}% below baseline
            </span>
          </p>
        </div>
        <div style={{
          background: isOver ? 'rgba(255,77,109,0.1)' : 'var(--accent-green-dim)',
          border: `1px solid ${statusColor}`,
          borderRadius: '6px',
          padding: '6px 12px',
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: statusColor }}>
            {isOver ? '⚠ over budget' : '✓ on track'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: 'Baseline', value: (budget.baseline_kg * 1e9).toFixed(2), unit: 'ngCO₂/run' },
          { label: 'Budget', value: (budget.budget_kg * 1e9).toFixed(2), unit: 'ngCO₂/run' },
          { label: 'Actual', value: (budget.actual_kg * 1e9).toFixed(2), unit: 'ngCO₂ this month', highlight: true },
        ].map(({ label, value, unit, highlight }) => (
          <div key={label}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              {label}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: highlight ? statusColor : 'var(--text-primary)', fontWeight: '500' }}>
              {value}
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '4px' }}>{unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
            budget used
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: statusColor }}>
            {Math.min(budget.percent_used, 999).toFixed(1)}%
          </span>
        </div>
        <ProgressBar percent={budget.percent_used} onTrack={budget.on_track} />
      </div>

      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '16px' }}>
        {budget.message}
      </p>
    </div>
  );
}

function WhatIfAnalysis({ runs }) {
  const [selectedId, setSelectedId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyse() {
    if (!selectedId) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await api.getWhatIf(selectedId);
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          what-if analysis
        </p>
      </div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Select a past training run to see how much CO₂ you would have saved by training at the optimal grid window instead.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: selectedId ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              padding: '10px 12px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">select a run...</option>
            {runs.map((run, i) => (
              <option key={run.id} value={run.id}>
                #{runs.length - i} — {run.model_name} — {new Date(run.created_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} — {(run.emissions_kg * 1e9).toFixed(2)} ngCO₂
              </option>
            ))}
          </select>
          <button
            onClick={handleAnalyse}
            disabled={!selectedId || loading}
            style={{
              background: !selectedId || loading ? 'var(--bg-base)' : 'var(--accent-green)',
              color: !selectedId || loading ? 'var(--text-secondary)' : '#0f1117',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              cursor: !selectedId || loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'analysing...' : '⚡ analyse'}
          </button>
        </div>

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[
                { label: 'Actual Emissions', value: (result.actual_emissions_kg * 1e9).toFixed(2), unit: 'ngCO₂', dim: true },
                { label: 'Optimal Emissions', value: result.optimal_emissions_kg ? (result.optimal_emissions_kg * 1e9).toFixed(2) : 'N/A', unit: 'ngCO₂', accent: true },
                { label: 'Actual Grid Intensity', value: result.actual_intensity_gco2_kwh ? result.actual_intensity_gco2_kwh.toFixed(1) : 'N/A', unit: 'gCO₂/kWh', dim: true },
                { label: 'Optimal Grid Intensity', value: result.optimal_intensity_gco2_kwh ? result.optimal_intensity_gco2_kwh.toFixed(1) : 'N/A', unit: 'gCO₂/kWh', accent: true },
              ].map(({ label, value, unit, accent, dim }) => (
                <div key={label} style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '14px 16px',
                }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    {label}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: accent ? 'var(--accent-green)' : dim ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: '500' }}>
                    {value}
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '4px' }}>{unit}</span>
                  </p>
                </div>
              ))}
            </div>

            {result.saving_percentage > 0 && (
              <div style={{
                background: 'var(--accent-green-dim)',
                border: '1px solid var(--accent-green)',
                borderRadius: '6px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {result.message}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: 'var(--accent-green)', fontWeight: '500', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                  -{result.saving_percentage}%
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function IntelligencePanel() {
  const [budget, setBudget] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getBudget(),
      fetch('http://localhost:8000/tracker/runs').then(r => r.json())
    ]).then(([budgetData, runsData]) => {
      setBudget(budgetData);
      setRuns(runsData);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
      loading intelligence...
    </p>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
            Emissions Intelligence
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Carbon budget tracking and what-if analysis
          </p>
        </div>
        <InfoButton content="This panel closes the loop between measuring and optimising. The carbon budget auto-calculates from your run history and sets a monthly target 10% below your baseline — getting stricter each month. The what-if tool shows how much CO₂ you would have saved by training at the cleanest grid window instead of when you actually ran." />
      </div>

      {budget && (
        budget.has_enough_data
          ? <BudgetCard budget={budget} />
          : <BaselineProgress runs_recorded={budget.runs_recorded} runs_required={budget.runs_required} />
      )}

      <WhatIfAnalysis runs={runs} />
    </div>
  );
}