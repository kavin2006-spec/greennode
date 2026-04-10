import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const STATUS_COLORS = {
  pending: 'var(--accent-yellow)',
  running: 'var(--accent-green)',
  completed: 'var(--text-secondary)',
  failed: 'var(--accent-red)',
};

const STATUS_ICONS = {
  pending: '◷',
  running: '⟳',
  completed: '✓',
  failed: '✕',
};

export default function JobCard({ job, index, isFirst, isDraggable }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusColor = STATUS_COLORS[job.status] || 'var(--text-secondary)';

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--bg-card)',
        border: `1px solid ${isFirst && job.status === 'pending' ? 'var(--accent-green)' : 'var(--border)'}`,
        borderRadius: '8px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: isDraggable ? 'grab' : 'default',
      }}
    >
      {isDraggable && (
        <div
          {...attributes}
          {...listeners}
          style={{
            color: 'var(--text-secondary)',
            fontSize: '16px',
            cursor: 'grab',
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          ⠿
        </div>
      )}

      <div style={{
        width: '28px', height: '28px',
        borderRadius: '50%',
        background: `${statusColor}18`,
        border: `1px solid ${statusColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '12px', color: statusColor }}>
          {STATUS_ICONS[job.status]}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
            {job.job_name}
          </p>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: statusColor,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {job.status}
          </span>
        </div>
        {job.job_description && (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            {job.job_description}
          </p>
        )}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {job.scheduled_for ? (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
              ⏱ {new Date(job.scheduled_for).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
              ⏱ after previous job
            </span>
          )}
          {job.optimal_intensity_gco2_kwh && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-green)' }}>
              ⚡ {job.optimal_intensity_gco2_kwh.toFixed(1)} gCO₂/kWh
            </span>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
            📁 {job.project}
          </span>
        </div>
      </div>

      {isFirst && job.status === 'pending' && (
        <div style={{
          background: 'var(--accent-green-dim)',
          border: '1px solid var(--accent-green)',
          borderRadius: '4px',
          padding: '4px 8px',
          flexShrink: 0,
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent-green)' }}>
            up next
          </p>
        </div>
      )}
    </div>
  );
}