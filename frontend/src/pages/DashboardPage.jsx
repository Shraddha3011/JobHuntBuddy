import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Briefcase, Clock, FileText, HeartPulse, Search, Sparkles, TrendingUp, LogOut } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  APPLIED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  OA: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  INTERVIEW: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  OFFER: 'border-green-500/30 bg-green-500/10 text-green-300',
  REJECTED: 'border-red-500/30 bg-red-500/10 text-red-300',
  GHOSTED: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  WITHDRAWN: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
};

const PLATFORM_LABELS = {
  LINKEDIN: 'LinkedIn',
  NAUKRI: 'Naukri',
  GLASSDOOR: 'Glassdoor',
  INDEED: 'Indeed',
  COMPANY_WEBSITE: 'Company site',
  REFERRAL: 'Referral',
  OTHER: 'Other',
};

export default function DashboardPage() {
  const { logout } = useAuth();
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/applications').then((r) => setApps(r.data));
    api.get('/applications/stats').then((r) => setStats(r.data));
  }, []);

  const filtered = useMemo(() => {
    return apps.filter((app) => {
      const statusMatch = filter === 'ALL' || app.status === filter;
      const q = query.trim().toLowerCase();
      const queryMatch =
        !q ||
        [app.companyName, app.jobTitle, app.location, app.resume?.name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(q));
      return statusMatch && queryMatch;
    });
  }, [apps, filter, query]);

  const metrics = [
    { label: 'Applications', value: stats?.total || apps.length, icon: Briefcase, color: 'text-emerald-400' },
    { label: 'Interviews', value: stats?.interviews || 0, icon: TrendingUp, color: 'text-blue-400' },
    { label: 'Offers', value: stats?.offers || 0, icon: Award, color: 'text-green-400' },
    { label: 'Follow-ups', value: stats?.ghosted || 0, icon: Clock, color: 'text-amber-400' },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Urbanist:wght@400;600;700;800&display=swap');

        * {
          font-family: 'Urbanist', sans-serif;
        }

        h1, h2, h3, h4, h5, h6 {
          font-family: 'Urbanist', sans-serif;
        }

        @keyframes float-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
          }
          50% { 
            box-shadow: 0 0 40px rgba(16, 185, 129, 0.6);
          }
        }

        .dashboard-container {
          animation: float-up 0.6s ease-out;
        }

        .stat-card {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .stat-card:hover {
          transform: translateY(-8px);
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.2);
        }

        .smart-search {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(16, 185, 129, 0.25);
          backdrop-filter: blur(10px);
          border-radius: 14px;
          padding: 12px 16px;
          color: white;
          transition: all 0.3s ease;
        }

        .smart-search:focus {
          outline: none;
          border-color: rgba(16, 185, 129, 0.6);
          background: rgba(16, 185, 129, 0.08);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }

        .smart-search::placeholder {
          color: rgba(148, 163, 184, 0.5);
        }

        .filter-button {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: rgba(148, 163, 184, 0.9);
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(8px);
        }

        .filter-button:hover {
          border-color: rgba(16, 185, 129, 0.4);
          color: rgba(16, 185, 129, 0.9);
          background: rgba(16, 185, 129, 0.1);
        }

        .filter-button.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: rgba(16, 185, 129, 0.8);
          color: white;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
        }

        .app-card {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .app-card:hover {
          transform: translateY(-6px);
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.2);
        }

        .app-title {
          color: #ffffff;
          font-weight: 800;
          font-size: 18px;
        }

        .app-company {
          color: #34d399;
          font-weight: 700;
        }

        .app-meta {
          color: rgba(148, 163, 184, 0.7);
          font-size: 14px;
        }

        .status-badge {
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid;
        }

        .memory-pill {
          border-radius: 16px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .memory-pill-good {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.3);
          color: #86efac;
        }

        .memory-pill-missing {
          background: rgba(245, 158, 11, 0.15);
          border-color: rgba(245, 158, 11, 0.3);
          color: #fbbf24;
        }

        .hero-section {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.08) 100%);
          border: 1px solid rgba(16, 185, 129, 0.25);
          backdrop-filter: blur(15px);
          border-radius: 20px;
          padding: 40px;
        }

        .hero-title {
          font-size: 36px;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.3;
        }

        .hero-subtitle {
          color: rgba(148, 163, 184, 0.8);
          font-size: 16px;
          margin-top: 16px;
          line-height: 1.6;
        }

        .gradient-accent {
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .scan-button {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: 1px solid rgba(16, 185, 129, 0.6);
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          text-align: center;
          text-decoration: none;
          display: inline-block;
        }

        .scan-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(16, 185, 129, 0.4);
          border-color: rgba(16, 185, 129, 1);
        }

        .stagger {
          animation: float-up 0.6s ease-out backwards;
        }

        .stagger-1 { animation-delay: 0s; }
        .stagger-2 { animation-delay: 0.1s; }
        .stagger-3 { animation-delay: 0.2s; }
        .stagger-4 { animation-delay: 0.3s; }
        .stagger-5 { animation-delay: 0.4s; }

        .empty-state {
          border: 2px dashed rgba(16, 185, 129, 0.2);
          border-radius: 16px;
          padding: 48px 24px;
          text-align: center;
          color: rgba(148, 163, 184, 0.6);
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .logout-btn {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }
      `}</style>

      <div className="relative z-10 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div className="header-top stagger stagger-1">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white">
                Your Job Hunt <span className="gradient-accent">Command Center</span>
              </h1>
              <p className="mt-2 text-slate-400 text-sm">Track, organize, and win your next role</p>
            </div>
            <button onClick={logout} className="logout-btn">
              <LogOut className="w-4 h-4" />
              Exit
            </button>
          </div>

          {/* Hero Section with CTA */}
          <div className="hero-section stagger stagger-2">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-300">AI-Powered</span>
                </div>
                <h2 className="hero-title">
                  Never lose track of an opportunity
                </h2>
                <p className="hero-subtitle">
                  Every application, email, and interview in one beautiful dashboard. We read your Gmail so you don't have to.
                </p>
              </div>
              <div className="lg:w-64">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-6">
                  <div className="flex items-start gap-3">
                    <HeartPulse className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-bold text-white text-sm">Quick Sync</p>
                      <p className="mt-2 text-xs leading-5 text-slate-300">
                        Let JobHuntBuddy scan your inbox to auto-track all applications.
                      </p>
                    </div>
                  </div>
                  <Link to="/auto-track" className="scan-button mt-4">
                    Scan Inbox
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger stagger-3">
            {metrics.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="stat-card">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-slate-300">{label}</p>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-3xl sm:text-4xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Filter & Search */}
          <div className="space-y-4 stagger stagger-4">
            <div className="flex flex-wrap gap-2">
              {['ALL', 'APPLIED', 'OA', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`filter-button ${filter === status ? 'active' : ''}`}
                >
                  {status === 'ALL' ? 'Everything' : status}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 smart-search">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search company, role, or resume..."
                className="flex-1 bg-transparent text-sm outline-none text-white"
              />
            </div>
          </div>

          {/* Applications List */}
          <div className="space-y-3 stagger stagger-5">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nothing here yet. Try scanning your inbox or add a job manually.</p>
              </div>
            ) : (
              filtered.map((app) => (
                <div key={app.id} className="app-card">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="app-title">{app.jobTitle}</span>
                        <span className="text-slate-500 text-sm">@</span>
                        <span className="app-company">{app.companyName}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 app-meta mb-4">
                        {app.sourcePlatform && <span>{PLATFORM_LABELS[app.sourcePlatform] || 'Other'}</span>}
                        {app.location && <span>📍 {app.location}</span>}
                        {app.salaryRange && <span>💰 {app.salaryRange}</span>}
                        {app.isRemote && <span>🌐 Remote</span>}
                        {app.appliedDate && <span>📅 {app.appliedDate}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="memory-pill memory-pill-good">
                          <FileText className="w-3 h-3" />
                          {app.resume?.name || 'Resume attached'}
                        </div>
                        {app.jobDescription && (
                          <div className="memory-pill memory-pill-good">
                            JD saved
                          </div>
                        )}
                        {!app.jobDescription && (
                          <div className="memory-pill memory-pill-missing">
                            JD missing
                          </div>
                        )}
                        {app.keyRequirements && (
                          <div className="memory-pill memory-pill-good">
                            Requirements saved
                          </div>
                        )}
                        {!app.keyRequirements && (
                          <div className="memory-pill memory-pill-missing">
                            Requirements missing
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="lg:text-right">
                      <span className={`status-badge ${STATUS_COLORS[app.status] || STATUS_COLORS.APPLIED}`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                  {app.notes && (
                    <div className="mt-4 p-3 rounded-12 bg-slate-700/30 border border-slate-600/30">
                      <p className="text-sm text-slate-300 leading-6">{app.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MemoryPill({ ok, good, missing }) {
  return ok ? (
    <span className="memory-pill memory-pill-good">
      <span>✓</span>
      {good}
    </span>
  ) : (
    <span className="memory-pill memory-pill-missing">
      {missing}
    </span>
  );
}