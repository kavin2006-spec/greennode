export default function Navbar({ activeTab, setActiveTab }) {
  const tabs = ['tracker', 'scheduler', 'cleaner', 'intelligence', 'jobs'];

  return (
    <nav style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      gap: '32px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '18px 0' }}>
        <div style={{
          width: '8px', height: '8px',
          borderRadius: '50%',
          background: 'var(--accent-green)',
          boxShadow: '0 0 8px var(--accent-green)'
        }} />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text-primary)',
          letterSpacing: '0.05em'
        }}>
          GREENNODE
        </span>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginLeft: '16px' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? 'var(--accent-green-dim)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent-green)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--accent-green)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              fontWeight: '500',
              padding: '18px 16px',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.15s ease',
            }}
          >
            {tab}
          </button>
        ))}
      </div>
    </nav>
  );
}