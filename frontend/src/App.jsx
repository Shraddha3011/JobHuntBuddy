import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FirstMatePage from './pages/FirstMatePage';
import AddApplicationPage from './pages/AddApplicationPage';
import ResumesPage from './pages/ResumesPage';
import InsightsPage from './pages/InsightsPage';
import CoralSourcesPage from './pages/CoralSourcesPage';
import AutoTrackPage from './pages/AutoTrackPage';
import AboutPage from './pages/AboutPage';

function PrivateRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/first-mate" element={<PrivateRoute><FirstMatePage /></PrivateRoute>} />
          <Route path="/auto-track" element={<PrivateRoute><AutoTrackPage /></PrivateRoute>} />
          <Route path="/add" element={<PrivateRoute><AddApplicationPage /></PrivateRoute>} />
          <Route path="/resumes" element={<PrivateRoute><ResumesPage /></PrivateRoute>} />
          <Route path="/sources" element={<PrivateRoute><CoralSourcesPage /></PrivateRoute>} />
          <Route path="/insights" element={<PrivateRoute><InsightsPage /></PrivateRoute>} />
          <Route path="/about" element={<PrivateRoute><AboutPage /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
