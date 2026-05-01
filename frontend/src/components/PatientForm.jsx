import { useState } from 'react';

const EMPTY = {
  name: '',
  age: '',
  gender: 'male',
  contact: '',
  diagnosis: '',
  assigned_therapist_id: '',
  status: 'active',
  admission_date: '',
};

// Reusable form for creating or editing a patient.
// `initial` populates the fields (used for edit). `onSubmit` receives a clean
// payload (numbers as numbers, empty strings stripped). `submitLabel` lets the
// caller distinguish "Add patient" vs "Save changes".
export default function PatientForm({ initial, onSubmit, onCancel, submitLabel = 'Save', currentUserId }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    assigned_therapist_id: currentUserId ? String(currentUserId) : '',
    ...(initial || {}),
    age: initial?.age != null ? String(initial.age) : '',
    assigned_therapist_id: initial?.assigned_therapist_id != null
      ? String(initial.assigned_therapist_id)
      : (currentUserId ? String(currentUserId) : ''),
    admission_date: initial?.admission_date
      ? String(initial.admission_date).slice(0, 10)
      : '',
  }));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        age: Number(form.age),
        gender: form.gender,
        diagnosis: form.diagnosis.trim(),
        status: form.status,
      };
      if (form.contact.trim()) payload.contact = form.contact.trim();
      if (form.assigned_therapist_id !== '') {
        payload.assigned_therapist_id = Number(form.assigned_therapist_id);
      }
      if (form.admission_date) payload.admission_date = form.admission_date;
      await onSubmit(payload);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save the patient. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="patient-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="pf-name">Full name</label>
          <input id="pf-name" value={form.name} onChange={update('name')} required />
        </div>
        <div className="form-group">
          <label htmlFor="pf-age">Age</label>
          <input id="pf-age" type="number" min="0" max="150" value={form.age} onChange={update('age')} required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="pf-gender">Gender</label>
          <select id="pf-gender" value={form.gender} onChange={update('gender')}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="pf-status">Status</label>
          <select id="pf-status" value={form.status} onChange={update('status')}>
            <option value="active">Active</option>
            <option value="discharged">Discharged</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="pf-contact">Contact (optional)</label>
          <input id="pf-contact" value={form.contact} onChange={update('contact')} placeholder="phone or email" />
        </div>
        <div className="form-group">
          <label htmlFor="pf-therapist">Assigned therapist ID (optional)</label>
          <input id="pf-therapist" type="number" min="1" value={form.assigned_therapist_id} onChange={update('assigned_therapist_id')} />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="pf-admission">Admission date (optional, defaults to today)</label>
        <input id="pf-admission" type="date" value={form.admission_date} onChange={update('admission_date')} />
      </div>

      <div className="form-group">
        <label htmlFor="pf-diagnosis">Diagnosis / treatment plan</label>
        <textarea id="pf-diagnosis" rows="3" value={form.diagnosis} onChange={update('diagnosis')} required />
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
