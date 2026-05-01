import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Pencil, CheckCircle2, XCircle, RotateCcw, TrendingUp,
  User, UserCog, Clock, Calendar, FileText, Tag,
} from 'lucide-react';
import { getSession, updateSession } from '../api/sessions';
import { getPatient } from '../api/patients';
import SessionForm from '../components/SessionForm';
import SessionProgress from '../components/SessionProgress';
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
      <p><Link to="/sessions" className="back-link"><ArrowLeft size={14} /> Back to sessions</Link></p>
    </div>
  );
  if (!session) return null;

  const canMarkCompleted = session.status === 'scheduled';
  const canCancel = session.status !== 'cancelled';
  const canReopen = session.status === 'cancelled';

  return (
    <div className="page">
      <Link to="/sessions" className="back-link"><ArrowLeft size={14} /> All sessions</Link>

      <div className="page-header">
        <div>
          <h1>Session #{session.id}</h1>
          <div><span className={`badge badge-${session.status}`}>{session.status}</span></div>
        </div>
        {!editing && (
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>
              <Pencil size={14} /> Reschedule / edit
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="patient-form-wrapper">
          <h2><Pencil size={18} /> Reschedule / edit</h2>
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
            <dt><User size={14} /> Patient</dt>
            <dd>
              <Link to={`/patients/${session.patient_id}`}>
                {patient ? `${patient.name} (#${patient.id})` : `#${session.patient_id}`}
              </Link>
            </dd>
            <dt><UserCog size={14} /> Therapist ID</dt><dd>#{session.therapist_id}</dd>
            <dt><Calendar size={14} /> Scheduled at</dt><dd>{formatDateTime(session.scheduled_at)}</dd>
            <dt><Clock size={14} /> Duration</dt><dd>{session.duration_minutes} minutes</dd>
            <dt><Tag size={14} /> Type</dt><dd>{session.session_type}</dd>
            <dt><FileText size={14} /> Notes</dt>
            <dd className="diagnosis-text">{session.notes || '—'}</dd>
          </dl>

          {actionError && <div className="form-error">{actionError}</div>}

          <div className="status-actions">
            {canMarkCompleted && (
              <button className="btn btn-primary" disabled={saving} onClick={() => changeStatus('completed')}>
                <CheckCircle2 size={16} /> Mark as completed
              </button>
            )}
            {canCancel && (
              <button className="btn btn-danger" disabled={saving} onClick={() => changeStatus('cancelled')}>
                <XCircle size={16} /> Cancel session
              </button>
            )}
            {canReopen && (
              <button className="btn btn-secondary" disabled={saving} onClick={() => changeStatus('scheduled')}>
                <RotateCcw size={16} /> Reopen as scheduled
              </button>
            )}
          </div>

          {session.status === 'completed' && (
            <section className="patient-sessions">
              <h2><TrendingUp size={18} /> Progress</h2>
              <SessionProgress sessionId={session.id} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
