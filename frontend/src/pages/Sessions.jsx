import { useEffect, useState, useCallback } from 'react';
import { listSessions, createSession } from '../api/sessions';
import { useAuth } from '../auth/AuthContext';
import SessionForm from '../components/SessionForm';
import SessionList from '../components/SessionList';

export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [therapistFilter, setTherapistFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(async (filters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSessions(filters || {});
      setSessions(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  function handleApply(e) {
    e.preventDefault();
    refresh({
      status: statusFilter || undefined,
      therapistId: therapistFilter || undefined,
    });
  }

  function clearFilters() {
    setStatusFilter('');
    setTherapistFilter('');
    refresh();
  }

  async function handleCreate(payload) {
    await createSession(payload);
    setShowForm(false);
    await refresh({ status: statusFilter || undefined, therapistId: therapistFilter || undefined });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Therapy sessions</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel' : '+ Schedule session'}
        </button>
      </div>

      {showForm && (
        <div className="patient-form-wrapper">
          <h2>Schedule a new session</h2>
          <SessionForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            currentUserId={user?.id}
            submitLabel="Schedule session"
          />
        </div>
      )}

      <form className="filters" onSubmit={handleApply}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          type="number"
          min="1"
          placeholder="Therapist ID"
          value={therapistFilter}
          onChange={(e) => setTherapistFilter(e.target.value)}
          style={{ maxWidth: 160, padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: 6 }}
        />
        <button type="submit" className="btn btn-secondary">Apply</button>
        {(statusFilter || therapistFilter) && (
          <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear</button>
        )}
      </form>

      {loading && <p>Loading sessions…</p>}
      {error && <div className="form-error">{error}</div>}
      {!loading && !error && <SessionList sessions={sessions} />}
    </div>
  );
}
