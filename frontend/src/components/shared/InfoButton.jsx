import { useState } from 'react';

export default function InfoButton({ content }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          width: '22px',
          height: '22px',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--accent-green)';
          e.currentTarget.style.color = 'var(--accent-green)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        ?
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99,
            }}
          />
          <div style={{
            position: 'absolute',
            top: '30px',
            right: 0,
            zIndex: 100,
            background: 'var(--bg-card)',
            border: '1px solid var(--accent-green)',
            borderRadius: '8px',
            padding: '16px',
            width: '280px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-primary)',
              lineHeight: '1.6',
            }}>
              {content}
            </p>
          </div>
        </>
      )}
    </div>
  );
}