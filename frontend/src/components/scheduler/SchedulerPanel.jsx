import { useState, useEffect } from 'react';
import { getSchedulerRecommendation } from '../../api/greennode';
import StatCard from '../shared/StatCard';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';
import InfoButton from '../shared/InfoButton';
import TimezoneSelector from '../shared/TimezoneSelector';

export default function SchedulerPanel({ timezone, setTimezone }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendation();
  }, []);

  async function fetchRecommendation() {
    setLoading(true);
    setError(null);
    try {
      const res = await getSchedulerRecommendation();
      setData(res.data);
    } catch (e) {
      setError('Failed to fetch grid data');
    } finally {
      setLoading(false);
    }
  }

  function getIntensityColor(intensity) {
    if (intensity < 150) return 'var(--accent-green)';
    if (intensity < 200) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      return (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '10px 14px',
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {String(label).padStart(2, '0')}:00
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: getIntensityColor(val) }}>
            {val} gCO₂/kWh
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
      fetching grid data...
    </p>
  );

  if (error) return (
    <p style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>⚠ {error}</p>
  );

  const chartData = data.forecast.map(f => ({
    hour: f.hour,
    intensity: f.carbon_intensity_gco2_kwh,
    renewable: f.renewable_percentage,
    is_optimal: f.is_optimal,
  }));

  const currentColor = getIntensityColor(data.current_intensity_gco2_kwh);

  function formatHour(hour, tz) {
    const date = new Date();
    date.setUTCHours(hour, 0, 0, 0);
    return date.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div>
             <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
                Training Time Optimiser
             </h2>
             <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
               NL grid carbon intensity — find the cleanest window to train
             </p>
          </div>
          <InfoButton content="This panel shows the carbon intensity of the Dutch electricity grid over the next 24 hours. Lower intensity means more renewables (wind, solar) are online. The optimal window is the hour where your training run would emit the least CO₂. Scheduling your jobs at night saves roughly 30–40% emissions on the NL grid." />
        </div>
        <button
          onClick={fetchRecommendation}
          style={{
            background: 'transparent',
            color: 'var(--accent-green)',
            border: '1px solid var(--accent-green)',
            borderRadius: '6px',
            padding: '10px 20px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          ↻ refresh
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <StatCard
          label="Current Intensity"
          value={data.current_intensity_gco2_kwh.toFixed(1)}
          unit="gCO₂/kWh"
          accent={true}
        />
        <StatCard
          label="Optimal Window"
          value={formatHour(data.optimal_hour, timezone)}
          unit={timezone === 'UTC' ? 'UTC' : 'local'}
        />
        <StatCard
          label="Potential Saving"
          value={data.potential_saving_percentage.toFixed(1)}
          unit="%"
        />
      </div>

      {/* Recommendation banner */}
      <div style={{
        background: 'var(--accent-green-dim)',
        border: '1px solid var(--accent-green)',
        borderRadius: '8px',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span style={{ fontSize: '20px' }}>⚡</span>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-green)', marginBottom: '2px' }}>
            recommended training window
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
            Schedule your next run at{' '}
            <strong style={{ fontFamily: 'var(--font-mono)' }}>
              {formatHour(data.optimal_hour, timezone)}
            </strong>
            {' '}— grid intensity drops to{' '}
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
              {data.optimal_intensity_gco2_kwh.toFixed(1)} gCO₂/kWh
            </strong>
            , saving{' '}
            <strong style={{ fontFamily: 'var(--font-mono)' }}>
              {data.potential_saving_percentage.toFixed(1)}%
            </strong>
            {' '}vs training now.
          </p>
        </div>
      </div>

      {/* Forecast chart */}
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
          24-hour carbon intensity forecast — NL grid (gCO₂/kWh)
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="intensityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00c896" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#00c896" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="hour"
              tickFormatter={h => `${String(h).padStart(2, '0')}:00`}
              tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#7a8499' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#7a8499' }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              x={data.optimal_hour}
              stroke="var(--accent-green)"
              strokeDasharray="4 4"
              label={{
                value: 'optimal',
                position: 'top',
                fontFamily: 'JetBrains Mono',
                fontSize: 10,
                fill: '#00c896'
              }}
            />
            <Area
              type="monotone"
              dataKey="intensity"
              stroke="var(--accent-green)"
              strokeWidth={2}
              fill="url(#intensityGradient)"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--accent-green)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Source note */}
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        textAlign: 'right'
      }}>
        source: {data.source} · zone: NL ·{' '}
        <span style={{ color: 'var(--accent-yellow)' }}>
          live ENTSO-E data pending API key
        </span>
      </p>

    </div>
  );
}