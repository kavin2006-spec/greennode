import { useState, useEffect } from 'react';
import { runTrainingJob, getTrainingRuns, getRunsCount } from '../../api/greennode';
import StatCard from '../shared/StatCard';
import InfoButton from '../shared/InfoButton';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

const PAGE_SIZE = 20;

export default function TrackerPanel({ timezone }) {
  const [runs, setRuns] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRuns(0, true);
  }, []);

  async function fetchRuns(newOffset = 0, reset = false) {
    setLoading(true);
    try {
      const [runsRes, countRes] = await Promise.all([
        getTrainingRuns(PAGE_SIZE, newOffset),
        getRunsCount()
      ]);
      setRuns(reset ? runsRes.data : prev => [...prev, ...runsRes.data]);
      setTotalCount(countRes.data.count);
      setOffset(newOffset);
    } catch (e) {
      setError('Failed to fetch runs');
    } finally {
      setLoading(false);
    }
  }

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      await runTrainingJob();
      await fetchRuns(0, true);
    } catch (e) {
      setError('Training run failed');
    } finally {
      setRunning(false);
    }
  }

  function handleLoadMore() {
    fetchRuns(offset + PAGE_SIZE, false);
  }

  const hasMore = offset + PAGE_SIZE < totalCount;

  const totalEmissions = runs.reduce((sum, r) => sum + r.emissions_kg, 0);
  const totalEnergy = runs.reduce((sum, r) => sum + r.energy_kwh, 0);
  const avgDuration = runs.length
    ? runs.reduce((sum, r) => sum + r.duration_seconds, 0) / runs.length
    : 0;

  const chartData = [...runs]
    .reverse()
    .map((r, i) => ({
      run: `#${i + 1}`,
      emissions: parseFloat((r.emissions_kg * 1e6).toFixed(4)),
    }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '10px 14px',
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</p>
          {payload.map(p => (
            <p key={p.name} style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-green)' }}>
              {p.value} μgCO₂
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
              Green AI Tracker
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Measure CO₂ emissions per model training run
            </p>
          </div>
          <InfoButton content="This panel runs a real machine learning training job and measures exactly how much CO₂ it emits using CodeCarbon. Each run is stored in the database so you can track your cumulative environmental cost over time. The chart shows emissions per run — lower is better." />
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          style={{
            background: running ? 'var(--bg-card)' : 'var(--accent-green)',
            color: running ? 'var(--text-secondary)' : '#0f1117',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            fontWeight: '500',
            cursor: running ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {running ? 'measuring...' : '▶ run training job'}
        </button>
      </div>

      {error && (
        <p style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          ⚠ {error}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <StatCard
          label="Total Emissions (loaded)"
          value={(totalEmissions * 1e6).toFixed(4)}
          unit="μgCO₂"
          accent={true}
        />
        <StatCard
          label="Total Energy (loaded)"
          value={(totalEnergy * 1e6).toFixed(4)}
          unit="μWh"
        />
        <StatCard
          label="Avg Duration"
          value={avgDuration.toFixed(2)}
          unit="sec"
        />
      </div>

      {chartData.length > 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '24px',
        }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '20px'
          }}>
            Emissions per run (μgCO₂) — showing {runs.length} of {totalCount}
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="run"
                tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#7a8499' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#7a8499' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="emissions"
                stroke="var(--accent-green)"
                strokeWidth={2}
                dot={{ fill: 'var(--accent-green)', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            Run History
          </p>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-secondary)'
          }}>
            {runs.length} of {totalCount} runs
          </p>
        </div>

        {loading && runs.length === 0 ? (
          <p style={{ padding: '24px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            loading...
          </p>
        ) : runs.length === 0 ? (
          <p style={{ padding: '24px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            no runs yet — hit run training job to start
          </p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['time', 'model', 'dataset', 'duration', 'emissions (μgCO₂)', 'energy (μWh)'].map(h => (
                    <th key={h} style={{
                      padding: '10px 24px',
                      textAlign: 'left',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: '400'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s ease' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 24px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(run.created_at).toLocaleTimeString('en-GB', { timeZone: timezone })}
                    </td>
                    <td style={{ padding: '12px 24px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                      {run.model_name}
                    </td>
                    <td style={{ padding: '12px 24px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {run.dataset}
                    </td>
                    <td style={{ padding: '12px 24px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                      {run.duration_seconds.toFixed(2)}s
                    </td>
                    <td style={{ padding: '12px 24px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-green)' }}>
                      {(run.emissions_kg * 1e6).toFixed(4)}
                    </td>
                    <td style={{ padding: '12px 24px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                      {(run.energy_kwh * 1e6).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {hasMore && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: loading ? 'var(--text-secondary)' : 'var(--accent-green)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    padding: '8px 20px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {loading ? 'loading...' : `load more (${totalCount - offset - PAGE_SIZE} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}