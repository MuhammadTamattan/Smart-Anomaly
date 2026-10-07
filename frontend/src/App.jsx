import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LogUpload from './pages/LogUpload';
import MLAnalysis from './pages/MLAnalysis';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import WebsiteScanner from './pages/WebsiteScanner';
import ReportIncident from './pages/ReportIncident';
import IncidentManagement from './pages/IncidentManagement';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ml-analysis" element={<MLAnalysis />} />
              <Route path="/log-upload" element={<LogUpload />} />
              <Route path="/website-scanner" element={<WebsiteScanner />} />
              <Route path="/report-incident" element={<ReportIncident />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/incident-management" element={<IncidentManagement />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Navigate to="/settings" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
