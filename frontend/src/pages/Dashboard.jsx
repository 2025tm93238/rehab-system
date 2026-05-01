import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPatients } from '../api/patients';
import { listSessions } from '../api/sessions';
import { useAuth } from '../auth/AuthContext';
import SessionList from '../components/SessionList';

export default function Dashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, s] = await Promise.all([listPatients(), listSessions()]);
        if (!cancelled) {
          setPatients(p);
          setSessions(s);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Could not load dashboard data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const stats = computeStats(patients, sessions);
  const upcoming = sessions
    .filter((s) => s.status === 'scheduled' && new Date(s.scheduled_at) >= new Date())
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    .slice(0, 5);
  const recentlyCompleted = sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))
    .slice(0, 5);

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p>Welcome back, <strong>{user?.name}</strong> ({user?.role}).</p>

      {loading && <p>Loading…</p>}
      {error && <div className="form-error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="stat-grid">
            <StatCard label="Patients (total)"  value={stats.totalPatients}    to="/patients" />
            <StatCard label="Active patients"   value={stats.activePatients}   to="/patients" />
            <StatCard label="Sessions scheduled" value={stats.scheduled}       to="/sessions" tone="blue" />
            <StatCard label="Sessions completed" value={stats.completed}       to="/sessions" tone="green" />
            <StatCard label="Completed (7 days)" value={stats.completedThisWeek} tone="green" />
            <StatCard label="Sessions cancelled" value={stats.cancelled}       to="/sessions" tone="red" />
          </div>

          <div className="dashboard-row">
            <section className="dashboard-section">
              <h2>Upcoming sessions</h2>
              {upcoming.length === 0 ? (
                <div className="empty-state"><p>No upcoming sessions.</p></div>
              ) : (
                <SessionList sessions={upcoming} />
              )}
            </section>

            <section className="dashboard-section">
              <h2>Recently completed</h2>
              {recentlyCompleted.length === 0 ? (
                <div className="empty-state"><p>No completed sessions yet.</p></div>
              ) : (
                <SessionList sessions={recentlyCompleted} />
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, to, tone }) {
  const card = (
    <div className={`stat-card ${tone ? `stat-card-${tone}` : ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
  return to ? <Link to={to} className="stat-card-link">{card}</Link> : card;
}

function computeStats(patients, sessions) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return {
    totalPatients: patients.length,
    activePatients: patients.filter((p) => p.status === 'active').length,
    scheduled: sessions.filter((s) => s.status === 'scheduled').length,
    completed: sessions.filter((s) => s.status === 'completed').length,
    cancelled: sessions.filter((s) => s.status === 'cancelled').length,
    completedThisWeek: sessions.filter(
      (s) => s.status === 'completed' && new Date(s.scheduled_at) >= oneWeekAgo
    ).length,
  };
}
