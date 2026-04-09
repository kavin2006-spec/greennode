export default function TimezoneSelector({ timezone, setTimezone }) {
  const zones = [
    { label: 'UTC', value: 'UTC' },
    { label: 'Amsterdam (CET)', value: 'Europe/Amsterdam' },
    { label: 'London (GMT)', value: 'Europe/London' },
    { label: 'New York (EST)', value: 'America/New_York' },
    { label: 'San Francisco (PST)', value: 'America/Los_Angeles' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        tz
      </span>
      <select
        value={timezone}
        onChange={e => setTimezone(e.target.value)}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          padding: '6px 10px',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {zones.map(z => (
          <option key={z.value} value={z.value}>{z.label}</option>
        ))}
      </select>
    </div>
  );
}