import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">Rehab Tracker</div>
      {user && (
        <ul className="navbar-links">
          <li><NavLink to="/dashboard">Dashboard</NavLink></li>
          <li><NavLink to="/patients">Patients</NavLink></li>
          <li><NavLink to="/sessions">Sessions</NavLink></li>
        </ul>
      )}
      <div className="navbar-user">
        {user ? (
          <>
            <span className="navbar-user-name">{user.name} <em>({user.role})</em></span>
            <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
          </>
        ) : (
          <NavLink to="/login" className="btn btn-primary">Login</NavLink>
        )}
      </div>
    </nav>
  );
}
