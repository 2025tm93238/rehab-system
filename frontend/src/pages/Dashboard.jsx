import { useAuth } from '../auth/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p>Welcome back, <strong>{user?.name}</strong>.</p>
      <p>Stats and recent activity land here in Phase 13.</p>
    </div>
  );
}
