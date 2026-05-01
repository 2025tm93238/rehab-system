import { useState } from 'react';

// Form for recording or editing the progress entry tied to a session.
// `initial` — existing entry when editing.
export default function ProgressForm({ initial, onSubmit, onCancel, submitLabel = 'Save progress' }) {
  const [painLevel, setPainLevel] = useState(initial?.pain_level ?? 5);
  const [mobilityScore, setMobilityScore] = useState(initial?.mobility_score ?? 5);
  const [summary, setSummary] = useState(initial?.summary || '');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        pain_level: Number(painLevel),
        mobility_score: Number(mobilityScore),
        summary: summary.trim(),
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save progress.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="patient-form">
      <div className="form-group">
        <label htmlFor="pg-pain">Pain level: <strong>{painLevel}</strong> / 10</label>
        <input id="pg-pain" type="range" min="0" max="10" value={painLevel}
               onChange={(e) => setPainLevel(e.target.value)} />
        <div className="range-scale"><span>none</span><span>severe</span></div>
      </div>

      <div className="form-group">
        <label htmlFor="pg-mob">Mobility score: <strong>{mobilityScore}</strong> / 10</label>
        <input id="pg-mob" type="range" min="0" max="10" value={mobilityScore}
               onChange={(e) => setMobilityScore(e.target.value)} />
        <div className="range-scale"><span>limited</span><span>full</span></div>
      </div>

      <div className="form-group">
        <label htmlFor="pg-summary">Summary</label>
        <textarea id="pg-summary" rows="3" value={summary} onChange={(e) => setSummary(e.target.value)} required />
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}
