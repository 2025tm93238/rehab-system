import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import { formatDateTime } from '../utils/format';

export default function SessionList({ sessions, hidePatient = false }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Inbox size={20} /></div>
        <p>No sessions yet.</p>
      </div>
    );
  }

  return (
    <table className="session-table">
      <thead>
        <tr>
          <th>When</th>
          {!hidePatient && <th>Patient</th>}
          <th>Therapist</th>
          <th>Type</th>
          <th>Duration</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((s) => (
          <tr key={s.id}>
            <td>
              <Link to={`/sessions/${s.id}`}>{formatDateTime(s.scheduled_at)}</Link>
            </td>
            {!hidePatient && (
              <td><Link to={`/patients/${s.patient_id}`}>#{s.patient_id}</Link></td>
            )}
            <td>#{s.therapist_id}</td>
            <td>{s.session_type}</td>
            <td>{s.duration_minutes} min</td>
            <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
