
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import OfflineBanner from './components/OfflineBanner';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentDashboard from './pages/ResidentDashboard';
import ReportIssue from './pages/ReportIssue';
import ResidentSchedule from './pages/ResidentSchedule';
import ResidentHistory from './pages/ResidentHistory';
import SmartBinMonitor from './pages/SmartBinMonitor';
import AdminDashboard from './pages/AdminDashboard';
import WasteTracking from './pages/WasteTracking';
import InfrastructureReports from './pages/InfrastructureReports';
import Records from './pages/Records';
import FirebaseSetup from './pages/FirebaseSetup';
import CommunityAssistant from './pages/CommunityAssistant';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { UserRole } from './types';
import { isFirebaseConfigured } from './services/firebase';

const AppRoutes: React.FC = () => {
  const { currentUser, loading, logout } = useAuth();
  const navigate = useNavigate();
  const isConfigured = isFirebaseConfigured();

  if (!isConfigured) {
    return (
      <Routes>
        <Route path="/setup" element={<FirebaseSetup />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardRoute = () => {
    if (!currentUser) return '/login';
    if (currentUser.role === UserRole.ADMIN) return '/admin/dashboard';
    if (currentUser.role === UserRole.DRIVER) return '/driver/dashboard';
    return '/resident/dashboard';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FCFA]">
        <Loader2 className="h-10 w-10 text-[#77DD77] animate-spin mb-4" />
        <p className="text-[#4F7942] font-medium">Loading application...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-slate-900 pb-10 bg-[#F9FCFA]">
      <Navbar userRole={currentUser?.role || null} onLogout={handleLogout} />
      <OfflineBanner />
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/setup" element={<FirebaseSetup />} />
        
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to={getDashboardRoute()} replace />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to={getDashboardRoute()} replace />} />
        
        <Route 
          path="/resident/*" 
          element={currentUser ? (
            <Routes>
              <Route path="dashboard" element={<ResidentDashboard />} />
              <Route path="report" element={<ReportIssue />} />
              <Route path="history" element={<ResidentHistory />} />
              <Route path="schedule" element={<ResidentSchedule />} />
              <Route path="bins" element={<SmartBinMonitor />} />
              <Route path="tracking" element={<WasteTracking />} />
              <Route path="assistant" element={<CommunityAssistant />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          ) : <Navigate to="/login" replace />} 
        />

        <Route 
          path="/driver/*" 
          element={currentUser?.role === UserRole.DRIVER ? (
            <Routes>
              <Route path="dashboard" element={<WasteTracking />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          ) : <Navigate to="/login" replace />} 
        />

        <Route 
          path="/admin/*" 
          element={currentUser?.role === UserRole.ADMIN ? (
            <Routes>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="waste" element={<WasteTracking />} />
              <Route path="infrastructure" element={<InfrastructureReports />} />
              <Route path="records" element={<Records />} />
              <Route path="bins" element={<SmartBinMonitor />} />
              <Route path="assistant" element={<CommunityAssistant />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          ) : <Navigate to="/login" replace />} 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;

