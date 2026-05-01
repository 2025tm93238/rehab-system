import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity, LayoutDashboard, Users, Calendar, LogOut, LogIn,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((s) => s[0]).slice(0, 2).join('')
    : '';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-brand-icon"><Activity size={18} /></span>
        Rehab Tracker
      </div>
      {user && (
        <ul className="navbar-links">
          <li>
            <NavLink to="/dashboard">
              <LayoutDashboard size={16} /> Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/patients">
              <Users size={16} /> Patients
            </NavLink>
          </li>
          <li>
            <NavLink to="/sessions">
              <Calendar size={16} /> Sessions
            </NavLink>
          </li>
        </ul>
      )}
      <div className="navbar-user">
        {user ? (
          <>
            <span className="navbar-user-name">
              <span className="navbar-user-avatar">{initials}</span>
              {user.name} <em>· {user.role}</em>
            </span>
            <button onClick={handleLogout} className="btn btn-secondary">
              <LogOut size={14} /> Logout
            </button>
          </>
        ) : (
          <NavLink to="/login" className="btn btn-primary">
            <LogIn size={14} /> Login
          </NavLink>
        )}
      </div>
    </nav>
  );
}
