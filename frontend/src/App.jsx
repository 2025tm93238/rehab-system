import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './auth/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Sessions from './pages/Sessions';
import SessionDetail from './pages/SessionDetail';
import NotFound from './pages/NotFound';
import './App.css';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/patients" element={
            <ProtectedRoute><Patients /></ProtectedRoute>
          } />
          <Route path="/patients/:id" element={
            <ProtectedRoute><PatientDetail /></ProtectedRoute>
          } />
          <Route path="/sessions" element={
            <ProtectedRoute><Sessions /></ProtectedRoute>
          } />
          <Route path="/sessions/:id" element={
            <ProtectedRoute><SessionDetail /></ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
