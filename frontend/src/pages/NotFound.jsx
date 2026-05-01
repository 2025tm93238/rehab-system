import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page">
      <h1>404 — Page not found</h1>
      <p><Link to="/dashboard">Back to dashboard</Link></p>
    </div>
  );
}
