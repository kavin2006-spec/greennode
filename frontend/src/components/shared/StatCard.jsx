export default function StatCard({ label, value, unit, accent = false }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderLeft: accent ? '3px solid var(--accent-green)' : '1px solid var(--border)',
      borderRadius: '8px',
      padding: '20px 24px',
    }}>
      <p style={{
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '8px'
      }}>
        {label}
      </p>
      <p style={{
        fontSize: '28px',
        fontFamily: 'var(--font-mono)',
        color: accent ? 'var(--accent-green)' : 'var(--text-primary)',
        fontWeight: '500',
        lineHeight: 1
      }}>
        {value}
        {unit && (
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '6px' }}>
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}