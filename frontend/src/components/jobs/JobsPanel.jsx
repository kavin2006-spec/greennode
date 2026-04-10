import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { getJobQueue, getJobHistory, deferJob, reorderJobs } from '../../api/greennode';
import JobCard from './JobCard';
import DeferModal from './DeferModal';
import InfoButton from '../shared/InfoButton';

export default function JobsPanel() {
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAll() {
    try {
      const [qRes, hRes] = await Promise.all([getJobQueue(), getJobHistory()]);
      setQueue(qRes.data);
      setHistory(hRes.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleDefer(jobData) {
    await deferJob(jobData);
    await fetchAll();
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const running = queue.find(j => j.status === 'running');
    if (active.id === running?.id) return;

    const oldIndex = queue.findIndex(j => j.id === active.id);
    const newIndex = queue.findIndex(j => j.id === over.id);

    if (newIndex === 0 && running) return;

    const newQueue = arrayMove(queue, oldIndex, newIndex);
    setQueue(newQueue);
    await reorderJobs(newQueue.map(j => j.id));
    await fetchAll();
  }

  const runningJob = queue.find(j => j.status === 'running');
  const pendingJobs = queue.filter(j => j.status === 'pending');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
              Auto-Defer Scheduler
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Queue training jobs — they run automatically at the optimal carbon window
            </p>
          </div>
          <InfoButton content="Instead of just recommending the best time to train, GreenNode actually schedules and runs your jobs automatically at the lowest-carbon grid window. Drag to reorder jobs in the queue — the currently training job is locked at the top. Each job runs when the grid is cleanest, minimising your emissions without any manual effort." />
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'var(--accent-green)',
            color: '#0f1117',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          + defer to optimal window
        </button>
      </div>

      <div style={{ display: 'flex', gap: '4px' }}>
        {['queue', 'history'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? 'var(--accent-green-dim)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent-green)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--accent-green)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              padding: '8px 16px',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.15s ease',
            }}
          >
            {tab}
            {tab === 'queue' && queue.length > 0 && (
              <span style={{
                marginLeft: '6px',
                background: 'var(--accent-green)',
                color: '#0f1117',
                borderRadius: '10px',
                padding: '1px 6px',
                fontSize: '10px',
              }}>
                {queue.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'queue' && (
        loading ? (
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            loading queue...
          </p>
        ) : queue.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              no jobs in queue
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Click "defer to optimal window" to schedule your first job
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {runningJob && (
              <JobCard
                key={runningJob.id}
                job={runningJob}
                index={0}
                isFirst={true}
                isDraggable={false}
              />
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pendingJobs.map(j => j.id)}
                strategy={verticalListSortingStrategy}
              >
                {pendingJobs.map((job, i) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    index={i}
                    isFirst={!runningJob && i === 0}
                    isDraggable={true}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )
      )}

      {activeTab === 'history' && (
        history.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>
              no completed jobs yet
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                isFirst={false}
                isDraggable={false}
              />
            ))}
          </div>
        )
      )}

      {showModal && (
        <DeferModal
          onClose={() => setShowModal(false)}
          onSubmit={handleDefer}
        />
      )}
    </div>
  );
}