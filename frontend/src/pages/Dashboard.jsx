import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, CalendarClock, CheckCircle2, XCircle, TrendingUp,
  Inbox, Calendar, History, LayoutDashboard,
} from 'lucide-react';
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
    <>
      <div className="dashboard-hero">
        <h1><LayoutDashboard size={24} /> Dashboard</h1>
        <p>Welcome back, {user?.name} — signed in as <strong>{user?.role}</strong>.</p>
      </div>

      {loading && <div className="page"><p>Loading…</p></div>}
      {error && <div className="page"><div className="form-error">{error}</div></div>}

      {!loading && !error && (
        <>
          <div className="stat-grid">
            <StatCard label="Total patients"     value={stats.totalPatients}     to="/patients" tone="blue" Icon={Users} />
            <StatCard label="Active patients"    value={stats.activePatients}    to="/patients" tone="green" Icon={UserCheck} />
            <StatCard label="Scheduled sessions" value={stats.scheduled}         to="/sessions" tone="purple" Icon={CalendarClock} />
            <StatCard label="Completed sessions" value={stats.completed}         to="/sessions" tone="teal" Icon={CheckCircle2} />
            <StatCard label="Last 7 days"        value={stats.completedThisWeek}                tone="amber" Icon={TrendingUp} />
            <StatCard label="Cancelled"          value={stats.cancelled}         to="/sessions" tone="red"   Icon={XCircle} />
          </div>

          <div className="page">
            <div className="dashboard-row">
              <section className="dashboard-section">
                <h2><Calendar size={18} /> Upcoming sessions</h2>
                {upcoming.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><Inbox size={20} /></div>
                    <p>No upcoming sessions.</p>
                  </div>
                ) : (
                  <SessionList sessions={upcoming} />
                )}
              </section>

              <section className="dashboard-section">
                <h2><History size={18} /> Recently completed</h2>
                {recentlyCompleted.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><Inbox size={20} /></div>
                    <p>No completed sessions yet.</p>
                  </div>
                ) : (
                  <SessionList sessions={recentlyCompleted} />
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function StatCard({ label, value, to, tone, Icon }) {
  const card = (
    <div className={`stat-card ${tone ? `stat-card-${tone}` : ''}`}>
      <div className="stat-card-icon"><Icon size={22} /></div>
      <div className="stat-card-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
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
