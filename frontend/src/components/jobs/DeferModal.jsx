import { useState } from 'react';

const AVAILABLE_JOBS = [
  {
    label: 'F1 Race Predictor',
    project: 'f1',
    script_path: 'jobs/f1/train_model.py',
    description: 'Gradient Boosting + Random Forest on F1Database'
  }
];

export default function DeferModal({ onClose, onSubmit }) {
  const [selected, setSelected] = useState(AVAILABLE_JOBS[0]);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  function handleSubmit() {
    onSubmit({
      job_name: useCustom ? customName : selected.label,
      job_description: useCustom ? customDesc : selected.description,
      project: useCustom ? 'custom' : selected.project,
      script_path: useCustom ? '' : selected.script_path,
      source: 'manual'
    });
    onClose();
  }

  const canSubmit = useCustom ? customName.trim().length > 0 : true;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 200,
        }}
      />
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 201,
        background: 'var(--bg-card)',
        border: '1px solid var(--accent-green)',
        borderRadius: '12px',
        padding: '28px',
        width: '480px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            defer to optimal window
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
            Job will be scheduled at the next lowest-carbon grid window
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['preset', 'custom'].map(type => (
            <button
              key={type}
              onClick={() => setUseCustom(type === 'custom')}
              style={{
                flex: 1,
                background: (useCustom ? type === 'custom' : type === 'preset') ? 'var(--accent-green-dim)' : 'transparent',
                border: `1px solid ${(useCustom ? type === 'custom' : type === 'preset') ? 'var(--accent-green)' : 'var(--border)'}`,
                borderRadius: '6px',
                color: (useCustom ? type === 'custom' : type === 'preset') ? 'var(--accent-green)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                padding: '8px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {!useCustom ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {AVAILABLE_JOBS.map(job => (
              <div
                key={job.script_path}
                onClick={() => setSelected(job)}
                style={{
                  background: selected.script_path === job.script_path ? 'var(--accent-green-dim)' : 'var(--bg-base)',
                  border: `1px solid ${selected.script_path === job.script_path ? 'var(--accent-green)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                }}
              >
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {job.label}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {job.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                job name
              </p>
              <input
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="e.g. Customer churn model v2"
                style={{
                  width: '100%',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  padding: '10px 12px',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                description (optional)
              </p>
              <input
                value={customDesc}
                onChange={e => setCustomDesc(e.target.value)}
                placeholder="What is this training job?"
                style={{
                  width: '100%',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  padding: '10px 12px',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              padding: '10px',
              cursor: 'pointer',
            }}
          >
            cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              flex: 2,
              background: canSubmit ? 'var(--accent-green)' : 'var(--bg-base)',
              border: 'none',
              borderRadius: '6px',
              color: canSubmit ? '#0f1117' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              fontWeight: '500',
              padding: '10px',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
            }}
          >
            ⚡ defer to optimal window
          </button>
        </div>
      </div>
    </>
  );
}