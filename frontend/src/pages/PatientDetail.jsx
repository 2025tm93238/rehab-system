import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, Calendar, Plus, X, ClipboardPlus,
  TrendingUp, User, Phone, UserCog, Calendar as CalendarIcon,
  ClipboardList, CalendarPlus,
} from 'lucide-react';
import { getPatient, updatePatient, deletePatient } from '../api/patients';
import { listSessions, createSession } from '../api/sessions';
import { useAuth } from '../auth/AuthContext';
import PatientForm from '../components/PatientForm';
import SessionForm from '../components/SessionForm';
import SessionList from '../components/SessionList';
import ProgressTimeline from '../components/ProgressTimeline';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPatient(id);
      setPatient(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Patient not found.');
      } else {
        setError(err.response?.data?.error || 'Could not load this patient.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleUpdate(payload) {
    const updated = await updatePatient(id, payload);
    setPatient(updated);
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete patient "${patient.name}"? This cannot be undone.`)) {
      return;
    }
    setDeleteError(null);
    try {
      await deletePatient(id);
      navigate('/patients', { replace: true });
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Delete failed.');
    }
  }

  if (loading) return <div className="page"><p>Loading patient…</p></div>;
  if (error) return (
    <div className="page">
      <div className="form-error">{error}</div>
      <p><Link to="/patients" className="back-link"><ArrowLeft size={14} /> Back to patients</Link></p>
    </div>
  );
  if (!patient) return null;

  return (
    <div className="page">
      <Link to="/patients" className="back-link"><ArrowLeft size={14} /> All patients</Link>

      <div className="page-header">
        <div>
          <h1>{patient.name}</h1>
          <div><span className={`badge badge-${patient.status}`}>{patient.status}</span></div>
        </div>
        {!editing && (
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>
              <Pencil size={14} /> Edit
            </button>
            {user?.role === 'admin' && (
              <button className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        )}
      </div>

      {deleteError && <div className="form-error">{deleteError}</div>}

      {editing ? (
        <div className="patient-form-wrapper">
          <h2><Pencil size={18} /> Edit patient</h2>
          <PatientForm
            initial={patient}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
            submitLabel="Save changes"
          />
        </div>
      ) : (
        <dl className="patient-details">
          <dt><User size={14} /> Age</dt><dd>{patient.age}</dd>
          <dt><User size={14} /> Gender</dt><dd>{patient.gender}</dd>
          <dt><Phone size={14} /> Contact</dt><dd>{patient.contact || '—'}</dd>
          <dt><UserCog size={14} /> Assigned therapist</dt>
          <dd>{patient.assigned_therapist_id ? `#${patient.assigned_therapist_id}` : '—'}</dd>
          <dt><CalendarIcon size={14} /> Admission date</dt>
          <dd>{patient.admission_date ? String(patient.admission_date).slice(0, 10) : '—'}</dd>
          <dt><ClipboardList size={14} /> Diagnosis</dt><dd className="diagnosis-text">{patient.diagnosis}</dd>
        </dl>
      )}

      <PatientSessions patientId={patient.id} currentUser={user} />

      <section className="patient-sessions">
        <h2><TrendingUp size={18} /> Progress timeline</h2>
        <ProgressTimeline patientId={patient.id} />
      </section>
    </div>
  );
}

function PatientSessions({ patientId, currentUser }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSessions({ patientId });
      setSessions(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load sessions.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleCreate(payload) {
    await createSession(payload);
    setShowForm(false);
    await refresh();
  }

  return (
    <section className="patient-sessions">
      <div className="page-header">
        <div><h2><Calendar size={18} /> Therapy sessions</h2></div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Schedule session</>}
        </button>
      </div>

      {showForm && (
        <div className="patient-form-wrapper">
          <h2><CalendarPlus size={18} /> Schedule a new session</h2>
          <SessionForm
            initial={{ patient_id: patientId }}
            lockPatient
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            currentUserId={currentUser?.id}
            submitLabel="Schedule session"
          />
        </div>
      )}

      {loading && <p>Loading sessions…</p>}
      {error && <div className="form-error">{error}</div>}
      {!loading && !error && <SessionList sessions={sessions} hidePatient />}
    </section>
  );
}
