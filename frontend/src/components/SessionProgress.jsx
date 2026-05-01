import { useEffect, useState, useCallback } from 'react';
import {
  getSessionProgress,
  createSessionProgress,
  updateSessionProgress,
} from '../api/progress';
import ProgressForm from './ProgressForm';
import { formatDateTime } from '../utils/format';

// Progress section for a single (completed) session. Resolves the existing
// entry if any; otherwise shows a "no entry yet" prompt with a create form.
export default function SessionProgress({ sessionId }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSessionProgress(sessionId);
      setProgress(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setProgress(null);
      } else {
        // surface other errors via thrown — caller's error boundary or alert
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(payload) {
    const data = await createSessionProgress(sessionId, payload);
    setProgress(data);
  }

  async function handleUpdate(payload) {
    const data = await updateSessionProgress(sessionId, payload);
    setProgress(data);
    setEditing(false);
  }

  if (loading) return <p>Loading progress…</p>;

  if (!progress) {
    return (
      <div>
        <p className="form-hint">No progress recorded for this session yet.</p>
        <ProgressForm onSubmit={handleCreate} submitLabel="Record progress" />
      </div>
    );
  }

  if (editing) {
    return (
      <ProgressForm
        initial={progress}
        onSubmit={handleUpdate}
        onCancel={() => setEditing(false)}
        submitLabel="Save changes"
      />
    );
  }

  return (
    <div>
      <dl className="patient-details progress-details">
        <dt>Pain level</dt><dd><ScoreBar value={progress.pain_level} flavor="pain" /></dd>
        <dt>Mobility score</dt><dd><ScoreBar value={progress.mobility_score} flavor="mobility" /></dd>
        <dt>Summary</dt><dd className="diagnosis-text">{progress.summary}</dd>
        <dt>Recorded</dt><dd>{formatDateTime(progress.recorded_at)}</dd>
      </dl>
      <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit progress</button>
    </div>
  );
}

function ScoreBar({ value, flavor }) {
  const pct = (value / 10) * 100;
  return (
    <div className="score-row">
      <div className={`score-bar score-bar-${flavor}`}>
        <div className="score-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="score-num">{value} / 10</span>
    </div>
  );
}
