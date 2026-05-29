import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Briefcase, Clock, FileText, HeartPulse, Search, Sparkles, TrendingUp } from 'lucide-react';
import api from '../api/axios';

const STATUS_COLORS = {
  APPLIED: 'bg-teal-50 text-teal-800 border-teal-200',
  OA: 'bg-amber-50 text-amber-800 border-amber-200',
  INTERVIEW: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  OFFER: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-800 border-rose-200',
  GHOSTED: 'bg-slate-100 text-slate-600 border-slate-200',
  WITHDRAWN: 'bg-orange-50 text-orange-800 border-orange-200',
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
    { label: 'Remembered roles', value: stats?.total || apps.length, icon: Briefcase, color: 'text-teal-700' },
    { label: 'In motion', value: stats?.interviews || 0, icon: TrendingUp, color: 'text-indigo-700' },
    { label: 'Wins', value: stats?.offers || 0, icon: Award, color: 'text-emerald-700' },
    { label: 'Needs care', value: stats?.ghosted || 0, icon: Clock, color: 'text-amber-700' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <section className="surface overflow-hidden p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800">
              <Sparkles className="h-4 w-4" />
              Your search, made lighter
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-950 lg:text-5xl">
              A calm home base for every job you touched.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              JobHuntBuddy keeps roles, resumes, emails, and next steps together so callbacks do not become detective work.
            </p>
          </div>
          <div className="rounded-[2rem] border border-amber-100 bg-amber-50/80 p-5">
            <div className="flex items-start gap-3">
              <HeartPulse className="mt-1 h-5 w-5 text-amber-700" />
              <div>
                <p className="font-bold text-slate-900">Tiny reminder</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  You do not need to remember everything. Save it once, or let Inbox Scan find it for you.
                </p>
              </div>
            </div>
            <Link to="/auto-track" className="secondary-button mt-4 w-full">
              Scan my inbox
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="soft-panel p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="mt-3 text-4xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <section className="soft-panel p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'APPLIED', 'OA', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  filter === status ? 'bg-slate-950 text-white shadow-lg' : 'bg-white/80 text-slate-600 hover:bg-teal-50 hover:text-teal-800'
                }`}
              >
                {status === 'ALL' ? 'Everything' : status}
              </button>
            ))}
          </div>
          <label className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 lg:w-96">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company, role, resume"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
        </div>

        <div className="space-y-3">
          {filtered.map((app) => (
            <article key={app.id} className="rounded-[1.25rem] border border-slate-200 bg-white/88 p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-slate-950">{app.jobTitle}</h3>
                    <span className="text-slate-400">at</span>
                    <span className="font-bold text-teal-800">{app.companyName}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span>{PLATFORM_LABELS[app.sourcePlatform] || 'Other source'}</span>
                    {app.location && <span>{app.location}</span>}
                    {app.salaryRange && <span>{app.salaryRange}</span>}
                    {app.isRemote && <span>Remote</span>}
                    {app.appliedDate && <span>Applied {app.appliedDate}</span>}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                      <FileText className="h-3.5 w-3.5" />
                      {app.resume?.name || 'Resume not attached'}
                    </span>
                    <MemoryPill ok={!!app.jobDescription} good="JD saved" missing="JD missing" />
                    <MemoryPill ok={!!app.keyRequirements} good="Requirements saved" missing="Requirements missing" />
                  </div>
                </div>
                <span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${STATUS_COLORS[app.status] || STATUS_COLORS.APPLIED}`}>
                  {app.status}
                </span>
              </div>
              {app.notes && <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">{app.notes}</p>}
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 py-16 text-center text-slate-500">
              Nothing here yet. Try Inbox Scan or save a job manually.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MemoryPill({ ok, good, missing }) {
  return ok ? (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">{good}</span>
  ) : (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">{missing}</span>
  );
}
