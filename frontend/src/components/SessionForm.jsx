import { useEffect, useState } from 'react';
import { listPatients } from '../api/patients';

const SESSION_TYPES = [
  'physiotherapy',
  'occupational',
  'speech',
  'cognitive',
  'group',
  'other',
];

// Reusable form for scheduling or rescheduling a session.
// `lockPatient` hides the patient picker (used when scheduling from a patient
// detail page where the patient is already known).
export default function SessionForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Schedule session',
  currentUserId,
  lockPatient = false,
}) {
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(!lockPatient);

  const [form, setForm] = useState(() => ({
    patient_id: initial?.patient_id != null ? String(initial.patient_id) : '',
    therapist_id:
      initial?.therapist_id != null
        ? String(initial.therapist_id)
        : (currentUserId ? String(currentUserId) : ''),
    scheduled_at: initial?.scheduled_at
      ? toLocalInputValue(initial.scheduled_at)
      : '',
    duration_minutes:
      initial?.duration_minutes != null ? String(initial.duration_minutes) : '45',
    session_type: initial?.session_type || 'physiotherapy',
    notes: initial?.notes || '',
  }));

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (lockPatient) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await listPatients({ status: 'active' });
        if (!cancelled) setPatients(data);
      } catch (e) {
        // Non-fatal — user can still type the id
      } finally {
        if (!cancelled) setLoadingPatients(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lockPatient]);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        patient_id: Number(form.patient_id),
        therapist_id: Number(form.therapist_id),
        scheduled_at: localToIsoString(form.scheduled_at),
        duration_minutes: Number(form.duration_minutes),
        session_type: form.session_type,
      };
      if (form.notes.trim()) payload.notes = form.notes.trim();
      await onSubmit(payload);
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 409 && data?.conflicting_session_id) {
        setError(
          `Therapist already has a session that overlaps this slot (#${data.conflicting_session_id}). ` +
          `Pick a different time or therapist.`
        );
      } else {
        setError(data?.error || 'Could not save the session. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="patient-form">
      {!lockPatient && (
        <div className="form-group">
          <label htmlFor="sf-patient">Patient</label>
          {loadingPatients ? (
            <input id="sf-patient" disabled placeholder="Loading patients…" />
          ) : (
            <select id="sf-patient" value={form.patient_id} onChange={update('patient_id')} required>
              <option value="">— select a patient —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} · {p.name} ({p.age}, {p.gender})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="sf-therapist">Therapist ID</label>
          <input id="sf-therapist" type="number" min="1" value={form.therapist_id} onChange={update('therapist_id')} required />
        </div>
        <div className="form-group">
          <label htmlFor="sf-type">Session type</label>
          <select id="sf-type" value={form.session_type} onChange={update('session_type')}>
            {SESSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="sf-when">Scheduled at</label>
          <input id="sf-when" type="datetime-local" value={form.scheduled_at} onChange={update('scheduled_at')} required />
        </div>
        <div className="form-group">
          <label htmlFor="sf-duration">Duration (minutes)</label>
          <input id="sf-duration" type="number" min="1" max="480" value={form.duration_minutes} onChange={update('duration_minutes')} required />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="sf-notes">Notes (optional)</label>
        <textarea id="sf-notes" rows="2" value={form.notes} onChange={update('notes')} />
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// Helpers for converting between datetime-local input values and ISO strings.

function toLocalInputValue(input) {
  if (!input) return '';
  const d = new Date(input);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear() +
    '-' + pad(d.getMonth() + 1) +
    '-' + pad(d.getDate()) +
    'T' + pad(d.getHours()) +
    ':' + pad(d.getMinutes())
  );
}

function localToIsoString(value) {
  // value is "YYYY-MM-DDTHH:mm". new Date() interprets it as local time —
  // convert to ISO so the backend always sees an unambiguous timestamp.
  if (!value) return '';
  const d = new Date(value);
  return d.toISOString();
}
