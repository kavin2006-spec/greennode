import { useState } from 'react';
import Navbar from './components/shared/Navbar';
import StatsBar from './components/shared/StatsBar';
import TrackerPanel from './components/tracker/TrackerPanel';
import SchedulerPanel from './components/scheduler/SchedulerPanel';
import CleanerPanel from './components/cleaner/CleanerPanel';
import IntelligencePanel from './components/intelligence/IntelligencePanel';


export default function App() {
  const [activeTab, setActiveTab] = useState('tracker');
  const [timezone, setTimezone] = useState('Europe/Amsterdam');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <StatsBar />
      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        {activeTab === 'tracker' && <TrackerPanel timezone={timezone} />}
        {activeTab === 'scheduler' && <SchedulerPanel timezone={timezone} setTimezone={setTimezone} />}
        {activeTab === 'cleaner' && <CleanerPanel />}
        {activeTab === 'intelligence' && <IntelligencePanel />}
      </main>
    </div>
  );
}