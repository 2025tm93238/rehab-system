import { useParams } from 'react-router-dom';

export default function PatientDetail() {
  const { id } = useParams();
  return (
    <div className="page">
      <h1>Patient #{id}</h1>
      <p>Patient detail with sessions and progress timeline lands in Phase 11–13.</p>
    </div>
  );
}
