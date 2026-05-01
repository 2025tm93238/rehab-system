import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSession, updateSession } from '../api/sessions';
import { getPatient } from '../api/patients';
import SessionForm from '../components/SessionForm';
import { formatDateTime } from '../utils/format';

export default function SessionDetail() {
  const { id } = useParams();

  const [session, setSession] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSession(id);
      setSession(data);
      // Best-effort fetch of patient name; not fatal if it fails.
      try {
        const p = await getPatient(data.patient_id);
        setPatient(p);
      } catch {
        setPatient(null);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Session not found.');
      } else {
        setError(err.response?.data?.error || 'Could not load this session.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(nextStatus) {
    setActionError(null);
    setSaving(true);
    try {
      const updated = await updateSession(id, { status: nextStatus });
      setSession(updated);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Could not update status.');
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(payload) {
    const updated = await updateSession(id, payload);
    setSession(updated);
    setEditing(false);
  }

  if (loading) return <div className="page"><p>Loading session…</p></div>;
  if (error) return (
    <div className="page">
      <div className="form-error">{error}</div>
      <p><Link to="/sessions">← Back to sessions</Link></p>
    </div>
  );
  if (!session) return null;

  const canMarkCompleted = session.status === 'scheduled';
  const canCancel = session.status !== 'cancelled';
  const canReopen = session.status === 'cancelled';

  return (
    <div className="page">
      <p className="back-link"><Link to="/sessions">← All sessions</Link></p>

      <div className="page-header">
        <div>
          <h1>Session #{session.id}</h1>
          <span className={`badge badge-${session.status}`}>{session.status}</span>
        </div>
        {!editing && (
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>Reschedule / edit</button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="patient-form-wrapper">
          <h2>Reschedule / edit</h2>
          <SessionForm
            initial={session}
            onSubmit={handleEdit}
            onCancel={() => setEditing(false)}
            submitLabel="Save changes"
          />
        </div>
      ) : (
        <>
          <dl className="patient-details">
            <dt>Patient</dt>
            <dd>
              <Link to={`/patients/${session.patient_id}`}>
                {patient ? `${patient.name} (#${patient.id})` : `#${session.patient_id}`}
              </Link>
            </dd>
            <dt>Therapist ID</dt><dd>#{session.therapist_id}</dd>
            <dt>Scheduled at</dt><dd>{formatDateTime(session.scheduled_at)}</dd>
            <dt>Duration</dt><dd>{session.duration_minutes} minutes</dd>
            <dt>Type</dt><dd>{session.session_type}</dd>
            <dt>Notes</dt>
            <dd className="diagnosis-text">{session.notes || '—'}</dd>
          </dl>

          {actionError && <div className="form-error">{actionError}</div>}

          <div className="status-actions">
            {canMarkCompleted && (
              <button
                className="btn btn-primary"
                disabled={saving}
                onClick={() => changeStatus('completed')}
              >
                Mark as completed
              </button>
            )}
            {canCancel && (
              <button
                className="btn btn-danger"
                disabled={saving}
                onClick={() => changeStatus('cancelled')}
              >
                Cancel session
              </button>
            )}
            {canReopen && (
              <button
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => changeStatus('scheduled')}
              >
                Reopen as scheduled
              </button>
            )}
          </div>

          {session.status === 'completed' && (
            <section className="patient-sessions">
              <h2>Progress</h2>
              <p>Progress recording lands here in Phase 13.</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
