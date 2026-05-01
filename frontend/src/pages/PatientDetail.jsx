import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPatient, updatePatient, deletePatient } from '../api/patients';
import { useAuth } from '../auth/AuthContext';
import PatientForm from '../components/PatientForm';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);

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
    try {
      await deletePatient(id);
      navigate('/patients', { replace: true });
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed.');
    }
  }

  if (loading) return <div className="page"><p>Loading patient…</p></div>;
  if (error) return (
    <div className="page">
      <div className="form-error">{error}</div>
      <p><Link to="/patients">← Back to patients</Link></p>
    </div>
  );
  if (!patient) return null;

  return (
    <div className="page">
      <p className="back-link"><Link to="/patients">← All patients</Link></p>

      <div className="page-header">
        <div>
          <h1>{patient.name}</h1>
          <span className={`badge badge-${patient.status}`}>{patient.status}</span>
        </div>
        {!editing && (
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>
            {user?.role === 'admin' && (
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className="patient-form-wrapper">
          <h2>Edit patient</h2>
          <PatientForm
            initial={patient}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
            submitLabel="Save changes"
          />
        </div>
      ) : (
        <dl className="patient-details">
          <dt>Age</dt><dd>{patient.age}</dd>
          <dt>Gender</dt><dd>{patient.gender}</dd>
          <dt>Contact</dt><dd>{patient.contact || '—'}</dd>
          <dt>Assigned therapist</dt>
          <dd>{patient.assigned_therapist_id ? `#${patient.assigned_therapist_id}` : '—'}</dd>
          <dt>Admission date</dt>
          <dd>{patient.admission_date ? String(patient.admission_date).slice(0, 10) : '—'}</dd>
          <dt>Diagnosis</dt><dd className="diagnosis-text">{patient.diagnosis}</dd>
          <dt>Created</dt><dd>{new Date(patient.created_at).toLocaleString()}</dd>
        </dl>
      )}

      <section className="patient-sessions">
        <h2>Therapy sessions</h2>
        <p>Session list and progress timeline land here in Phase 12–13.</p>
      </section>
    </div>
  );
}
