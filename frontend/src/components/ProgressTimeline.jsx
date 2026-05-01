import { useEffect, useState } from 'react';
import { Calendar, Activity, TrendingUp, Inbox } from 'lucide-react';
import { getPatientProgressTimeline } from '../api/progress';
import { formatDateTime } from '../utils/format';

export default function ProgressTimeline({ patientId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getPatientProgressTimeline(patientId);
        if (!cancelled) setEntries(data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Could not load progress.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [patientId]);

  if (loading) return <p>Loading progress timeline…</p>;
  if (error) return <div className="form-error">{error}</div>;
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Inbox size={20} /></div>
        <p>No completed sessions with recorded progress yet.</p>
      </div>
    );
  }

  return (
    <div>
      <TrendChart entries={entries} />
      <ol className="progress-list">
        {entries.map((e) => (
          <li key={e.progress_id} className="progress-list-item">
            <div className="progress-list-when">
              <Calendar size={13} /> {formatDateTime(e.scheduled_at)}
            </div>
            <div className="progress-list-scores">
              <span className="progress-pill progress-pill-pain">
                <Activity size={12} /> pain {e.pain_level}
              </span>
              <span className="progress-pill progress-pill-mobility">
                <TrendingUp size={12} /> mobility {e.mobility_score}
              </span>
              <span className="progress-list-type">{e.session_type}</span>
            </div>
            <div className="progress-list-summary">{e.summary}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TrendChart({ entries }) {
  if (entries.length < 2) return null;

  const W = 480, H = 120, PAD = 24;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  const xFor = (i) => PAD + (entries.length === 1 ? innerW / 2 : (i / (entries.length - 1)) * innerW);
  const yFor = (v) => PAD + innerH - (v / 10) * innerH;

  const painPath = entries.map((e, i) => `${i === 0 ? 'M' : 'L'}${xFor(i)},${yFor(e.pain_level)}`).join(' ');
  const mobPath  = entries.map((e, i) => `${i === 0 ? 'M' : 'L'}${xFor(i)},${yFor(e.mobility_score)}`).join(' ');

  return (
    <div className="trend-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Progress trend">
        {[0, 5, 10].map((tick) => (
          <g key={tick}>
            <line x1={PAD} y1={yFor(tick)} x2={W - PAD} y2={yFor(tick)} stroke="#e2e8f0" strokeDasharray="3 3" />
            <text x={4} y={yFor(tick) + 4} fontSize="10" fill="#94a3b8">{tick}</text>
          </g>
        ))}
        <path d={painPath} fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinejoin="round" />
        <path d={mobPath} fill="none" stroke="#047857" strokeWidth="2.5" strokeLinejoin="round" />
        {entries.map((e, i) => (
          <g key={e.progress_id}>
            <circle cx={xFor(i)} cy={yFor(e.pain_level)} r="4" fill="#dc2626" stroke="white" strokeWidth="1.5" />
            <circle cx={xFor(i)} cy={yFor(e.mobility_score)} r="4" fill="#047857" stroke="white" strokeWidth="1.5" />
          </g>
        ))}
      </svg>
      <div className="trend-legend">
        <span className="trend-legend-item"><span className="trend-dot trend-dot-pain" /> pain</span>
        <span className="trend-legend-item"><span className="trend-dot trend-dot-mobility" /> mobility</span>
      </div>
    </div>
  );
}
