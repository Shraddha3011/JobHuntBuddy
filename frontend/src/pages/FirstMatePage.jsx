import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Database,
  FileSearch,
  GitMerge,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';
import api from '../api/axios';

function Metric({ label, value }) {
  return (
    <div className="soft-panel p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function ActionCard({ item, icon: Icon }) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white/88 p-4 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Icon className="h-4 w-4 shrink-0 text-teal-700" />
            <span className="truncate">{item.jobTitle}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{item.companyName}</p>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
          {item.status}
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-slate-800">{item.reason}</p>
      <p className="mt-1 text-sm text-slate-500">{item.nextAction}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        <span>{item.daysSinceApplied} days since apply</span>
        {item.resumeName && <span>Resume: {item.resumeName}</span>}
      </div>
    </div>
  );
}

export default function FirstMatePage() {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/agent/briefing');
      setBriefing(data);
    } catch {
      setError('Could not load the agent briefing. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadInitialBriefing = async () => {
      setError('');
      try {
        const { data } = await api.get('/agent/briefing');
        if (!ignore) setBriefing(data);
      } catch {
        if (!ignore) setError('Could not load the agent briefing. Check that the backend is running.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadInitialBriefing();
    return () => {
      ignore = true;
    };
  }, []);

  const resumeRows = useMemo(() => {
    if (!briefing?.resumeUsage) return [];
    return Object.entries(briefing.resumeUsage);
  }, [briefing]);

  if (loading) {
    return (
      <div className="story-shell flex min-h-screen items-center justify-center text-slate-600">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        Building your job-search briefing
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</div>
      </div>
    );
  }

  const summary = briefing?.summary || {};

  return (
    <div className="min-h-screen">
      <section className="px-6 pt-8">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="surface flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between lg:p-8">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-teal-800">
                <Sparkles className="h-3.5 w-3.5" />
                Buddy brief
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 lg:text-5xl">Here is what needs your energy today.</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                JobHuntBuddy turns applications, resumes, email signals, and Coral-connected tools into a short, kind action list.
              </p>
            </div>
            <button
              onClick={load}
              className="action-button"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <div className="grid gap-4 md:grid-cols-5">
          <Metric label="Applications" value={summary.totalApplications || 0} />
          <Metric label="Active" value={summary.activeApplications || 0} />
          <Metric label="Pipeline" value={summary.interviewPipeline || 0} />
          <Metric label="Missing Resume" value={summary.missingResume || 0} />
          <Metric label="Resume Versions" value={summary.resumeVersions || 0} />
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="soft-panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-teal-700" />
              <h2 className="text-lg font-black text-slate-950">Today&apos;s gentle plan</h2>
            </div>
            <div className="space-y-3">
              {briefing.missions?.map((mission) => (
                <div key={mission} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/85 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-sm text-slate-700">{mission}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-slate-800 bg-slate-950 p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
            <div className="mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-teal-300" />
              <h2 className="text-lg font-black">Coral connection story</h2>
            </div>
            <p className="text-sm leading-6 text-slate-300">
              Demo the source-joining angle by querying Gmail, Calendar, Notion, resumes, and applications as SQL tables.
            </p>
            <div className="mt-4 space-y-3">
              {Object.entries(briefing.coralSql || {}).map(([label, sql]) => (
                <div key={label} className="border border-slate-700 bg-slate-900 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-300">{label}</p>
                  <code className="block whitespace-pre-wrap text-xs leading-5 text-slate-300">{sql}</code>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Send className="h-5 w-5 text-teal-700" />
              <h2 className="text-lg font-black text-slate-950">Follow-up queue</h2>
            </div>
            <div className="space-y-3">
              {briefing.followUps?.length ? (
                briefing.followUps.map((item) => <ActionCard key={item.id} item={item} icon={Send} />)
              ) : (
                <EmptyState text="No urgent follow-ups right now." />
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-teal-700" />
              <h2 className="text-lg font-black text-slate-950">Memory gaps</h2>
            </div>
            <div className="space-y-3">
              {briefing.missingMemory?.length ? (
                briefing.missingMemory.map((item) => <ActionCard key={item.id} item={item} icon={FileSearch} />)
              ) : (
                <EmptyState text="Every application has the important context attached." />
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="soft-panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <GitMerge className="h-5 w-5 text-teal-700" />
              <h2 className="text-lg font-black text-slate-950">Possible duplicates</h2>
            </div>
            <div className="space-y-3">
              {briefing.duplicates?.length ? (
                briefing.duplicates.map((item) => (
                  <div key={`${item.companyName}-${item.jobTitle}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/85 p-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.jobTitle}</p>
                      <p className="text-sm text-slate-500">{item.companyName}</p>
                    </div>
                    <span className="text-sm font-semibold text-amber-700">{item.count} entries</span>
                  </div>
                ))
              ) : (
                <EmptyState text="No duplicate company and title pairs found." />
              )}
            </div>
          </div>

          <div className="soft-panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-teal-700" />
              <h2 className="text-lg font-black text-slate-950">Resume usage</h2>
            </div>
            <div className="space-y-3">
              {resumeRows.length ? (
                resumeRows.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/85 p-3">
                    <span className="font-medium text-slate-900">{name}</span>
                    <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                      {count} applications <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                ))
              ) : (
                <EmptyState text="Attach resume versions to applications to unlock this analysis." />
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-500">
      {text}
    </div>
  );
}
