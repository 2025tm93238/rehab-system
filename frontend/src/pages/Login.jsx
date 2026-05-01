import { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Activity, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page auth-card">
      <div className="auth-icon"><Activity size={24} /></div>
      <h1>Welcome back</h1>
      <p className="auth-subtitle">Login to manage patients and therapy sessions.</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email" type="email" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            required autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password" type="password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            required minLength={6}
          />
        </div>

        {error && (
          <div className="form-error" role="alert">
            <AlertCircle size={16} /> <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          <LogIn size={16} /> {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <p className="auth-footer">
        Don&apos;t have an account? <Link to="/signup">Create one</Link>
      </p>
    </div>
  );
}
