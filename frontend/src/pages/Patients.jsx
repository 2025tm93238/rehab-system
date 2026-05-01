import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, X, Search, Users, Inbox, User, ClipboardPlus, Phone,
} from 'lucide-react';
import { listPatients, createPatient } from '../api/patients';
import { useAuth } from '../auth/AuthContext';
import PatientForm from '../components/PatientForm';

export default function Patients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(async (filters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPatients(filters || {});
      setPatients(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load patients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  function handleSearch(e) {
    e.preventDefault();
    refresh({ search: search.trim(), status: statusFilter });
  }

  function clearFilters() {
    setSearch('');
    setStatusFilter('');
    refresh();
  }

  async function handleCreate(payload) {
    await createPatient(payload);
    setShowForm(false);
    await refresh();
  }

  return (
    <>
      <div className="page-hero">
        <div>
          <h1><Users size={24} /> Patients</h1>
          <p className="page-hero-sub">{patients.length} {patients.length === 1 ? 'record' : 'records'} in the system</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> New patient</>}
        </button>
      </div>

      <div className="page">
        {showForm && (
          <div className="patient-form-wrapper">
            <h2><ClipboardPlus size={18} /> Register a new patient</h2>
            <PatientForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              submitLabel="Add patient"
              currentUserId={user?.role === 'therapist' ? user.id : null}
            />
          </div>
        )}

        <form className="filters" onSubmit={handleSearch}>
          <div className="filters-search">
            <span className="filters-search-icon"><Search size={16} /></span>
            <input
              type="search"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="discharged">Discharged</option>
          </select>
          <button type="submit" className="btn btn-secondary">Apply</button>
          {(search || statusFilter) && (
            <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear</button>
          )}
        </form>

        {loading && <p>Loading patients…</p>}
        {error && <div className="form-error">{error}</div>}

        {!loading && !error && patients.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><Inbox size={20} /></div>
            <p>No patients found. Try adjusting your filters or registering one.</p>
          </div>
        )}

        <div className="patient-grid">
          {patients.map((p) => (
            <Link key={p.id} to={`/patients/${p.id}`} className="patient-card">
              <div className="patient-card-header">
                <h3>{p.name}</h3>
                <span className={`badge badge-${p.status}`}>{p.status}</span>
              </div>
              <div className="patient-card-meta">
                <span className="patient-card-meta-item">
                  <User size={13} /> {p.age} yrs · {p.gender}
                </span>
                {p.contact && (
                  <span className="patient-card-meta-item">
                    <Phone size={13} /> {p.contact}
                  </span>
                )}
              </div>
              <p className="patient-card-diagnosis">{p.diagnosis}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
