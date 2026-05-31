import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import logo from '../assets/logo.png';
import {
  BarChart3,
  Bot,
  FileText,
  HeartHandshake,
  Info,
  Inbox,
  LayoutDashboard,
  Link2,
  LogOut,
  PlusCircle,
  Menu,
  X,
  ChevronDown,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/', icon: Inbox, label: 'Inbox Scan', hint: 'Auto-track' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', hint: 'Dashboard' },
  { to: '/add', icon: PlusCircle, label: 'Save a Job', hint: 'New role' },
  { to: '/resumes', icon: FileText, label: 'Resumes', hint: 'Vault' },
];

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    nav('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;600;700;800&display=swap');

        * {
          font-family: 'Urbanist', sans-serif;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
          50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.6); }
        }

        .navbar-container {
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.8) 100%);
          border-bottom: 1px solid rgba(16, 185, 129, 0.1);
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .nav-wrapper {
          max-width: 100%;
          padding: 0 24px;
          margin: 0 auto;
        }

        .nav-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 72px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 280px;
        }

        .logo-badge {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
          transition: all 0.3s ease;
        }

        .logo-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(16, 185, 129, 0.5);
        }

        .logo-text h1 {
          font-size: 20px;
          font-weight: 900;
          color: white;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .logo-text p {
          font-size: 11px;
          color: rgba(148, 163, 184, 0.8);
          margin: 2px 0 0 0;
          font-weight: 600;
        }

.nav-center {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  margin-right: 24px;
}

        @media (max-width: 1024px) {
          .nav-center {
            display: none;
          }
        }

        .nav-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          border-radius: 12px;
          color: rgba(148, 163, 184, 0.8);
          text-decoration: none;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }

        .nav-link::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(16, 185, 129, 0.1);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .nav-link:hover {
          color: #34d399;
        }

        .nav-link:hover::before {
          opacity: 1;
        }

        .nav-link.active {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #10b981, #34d399);
          border-radius: 2px 2px 0 0;
        }

        .nav-link > span:first-child {
          position: relative;
          z-index: 1;
        }

        .nav-link > span:last-child {
          font-size: 11px;
          opacity: 0.6;
          position: relative;
          z-index: 1;
        }

        // .nav-right {
        //   display: flex;
        //   align-items: center;
        //   gap: 20px;
        //   min-width: 280px;
        //   justify-content: flex-end;
        // }

        .quick-stats {
          display: flex;
          gap: 16px;
        }

        @media (max-width: 768px) {
          .quick-stats {
            display: none;
          }
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 10px;
        }

        .stat-item svg {
          width: 16px;
          height: 16px;
          color: #34d399;
        }

        .stat-item span {
          font-size: 12px;
          font-weight: 700;
          color: #34d399;
        }

        .profile-section {
          position: relative;
        }

        .profile-button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
          color: rgba(148, 163, 184, 0.9);
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          font-size: 13px;
        }

        .profile-button:hover {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.4);
          color: #34d399;
        }

        .profile-avatar {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 14px;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 14px;
          min-width: 220px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: slideDown 0.3s ease;
          overflow: hidden;
        }

        .dropdown-header {
          padding: 16px;
          border-bottom: 1px solid rgba(16, 185, 129, 0.1);
          background: rgba(16, 185, 129, 0.05);
        }

        .dropdown-name {
          font-weight: 700;
          color: white;
          font-size: 14px;
        }

        .dropdown-email {
          font-size: 12px;
          color: rgba(148, 163, 184, 0.7);
          margin-top: 4px;
        }

        .dropdown-item {
          padding: 12px 16px;
          color: rgba(148, 163, 184, 0.8);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.3s ease;
          border-left: 3px solid transparent;
        }

        .dropdown-item:hover {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
          border-left-color: #10b981;
        }

        .dropdown-item svg {
          width: 16px;
          height: 16px;
        }

        .dropdown-logout {
          border-top: 1px solid rgba(16, 185, 129, 0.1);
          color: #fca5a5;
          padding: 12px 16px;
          cursor: pointer;
        }

        .dropdown-logout:hover {
          background: rgba(239, 68, 68, 0.1);
          border-left-color: #dc2626;
        }

        .mobile-menu-button {
          display: none;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #34d399;
          cursor: pointer;
          transition: all 0.3s ease;
          align-items: center;
          justify-content: center;
        }

        .mobile-menu-button:hover {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.4);
        }

        @media (max-width: 1024px) {
          .mobile-menu-button {
            display: flex;
          }
        }

        .mobile-menu {
          position: fixed;
          top: 72px;
          left: 0;
          right: 0;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%);
          border-bottom: 1px solid rgba(16, 185, 129, 0.1);
          max-height: calc(100vh - 72px);
          overflow-y: auto;
          animation: slideDown 0.3s ease;
          z-index: 40;
        }

        .mobile-menu-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          color: rgba(148, 163, 184, 0.8);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
          border-left: 3px solid transparent;
        }

        .mobile-nav-link:hover {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
          border-left-color: #10b981;
        }

        .mobile-nav-link.active {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border-left-color: #10b981;
        }

        .main-content {
          flex: 1;
          overflow-auto;
          animation: fadeIn 0.5s ease;
        }
          .logo-section {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 280px;
}

.logo-image-link {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.navbar-logo {
  width: 64px;
  height: 64px;
  object-fit: contain;
  transition: all 0.35s ease;
}

.navbar-logo:hover {
  transform: scale(1.08) rotate(-3deg);
}

.logo-text {
  text-decoration: none;
}

.logo-text h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
  color: white;
  letter-spacing: -1px;
  line-height: 1;
}

.logo-text h1 span {
  color: #10b981;
}

.logo-text p {
  margin-top: 4px;
  font-size: 11px;
  color: rgba(148, 163, 184, 0.8);
  font-weight: 600;
  letter-spacing: 0.5px;
}
      `}</style>

      {/* Top Navbar */}
      <nav className="navbar-container">
        <div className="nav-wrapper">
          <div className="nav-inner">
            {/* Logo Section */}
{/* Logo Section */}
<div className="logo-section">
  <Link to="/" className="logo-image-link">
    <img
      src={logo}
      alt="JobHuntBuddy"
      className="navbar-logo"
    />
  </Link>

  <Link to="/" className="logo-text">
    <h1>
      Job<span>Hunt</span>Buddy
    </h1>
    <p>Your AI companion for every application</p>
  </Link>
</div>

            {/* Center Navigation */}
            <div className="nav-center">
              {navLinks.map(({ to, icon: Icon, label }) => {
                const isActive = pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Section */}
            <div className="nav-right">
              {/* <div className="quick-stats">
                <div className="stat-item">
                  <Zap className="w-4 h-4" />
                  <span>Active</span>
                </div>
                <div className="stat-item">
                  <TrendingUp className="w-4 h-4" />
                  <span>Growing</span>
                </div>
              </div> */}

              {/* Profile Dropdown */}
              <div className="profile-section">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="profile-button"
                >
                  <div className="profile-avatar">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <div className="dropdown-name">{user?.name || 'User'}</div>
                      <div className="dropdown-email">{user?.email || 'user@example.com'}</div>
                    </div>
                    <Link to="/" className="dropdown-item">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link to="/first-mate" className="dropdown-item">
                      <Bot className="w-4 h-4" />
                      Buddy Brief
                    </Link>
                    <Link to="/insights" className="dropdown-item">
                      <BarChart3 className="w-4 h-4" />
                      Analytics
                    </Link>
                    <Link to="/about" className="dropdown-item">
                      <Info className="w-4 h-4" />
                      About
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="dropdown-item dropdown-logout w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="mobile-menu-button"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-content">
            {navLinks.map(({ to, icon: Icon, label, hint }) => {
              const isActive = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex flex-col">
                    <span>{label}</span>
                    <span className="text-xs opacity-60">{hint}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}