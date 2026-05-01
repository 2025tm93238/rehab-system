import { useParams } from 'react-router-dom';

export default function SessionDetail() {
  const { id } = useParams();
  return (
    <div className="page">
      <h1>Session #{id}</h1>
      <p>Session detail and progress entry land in Phase 12–13.</p>
    </div>
  );
}
