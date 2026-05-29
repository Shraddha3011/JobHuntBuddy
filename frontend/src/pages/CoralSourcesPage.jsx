import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, Code2, Inbox, KeyRound, MessageSquare, NotebookTabs, RefreshCw, Terminal } from 'lucide-react';
import api from '../api/axios';
import GmailConnectPanel from '../components/GmailConnectPanel';

const SOURCE_CARDS = [
  {
    name: 'gmail',
    label: 'Gmail',
    icon: Inbox,
    env: 'GMAIL_ACCESS_TOKEN',
    uiManaged: true,
    why: 'Scan application acknowledgements, interviews, offers, and rejections — connect from the panel below (no terminal).',
  },
  {
    name: 'github',
    label: 'GitHub',
    icon: Code2,
    env: 'GITHUB_TOKEN',
    command: 'set GITHUB_TOKEN=ghp_your_token && coral source add github',
    why: 'Join projects, repos, issues, and PRs with job applications for portfolio and open-source proof.',
  },
  {
    name: 'google_calendar',
    label: 'Google Calendar',
    icon: CalendarDays,
    env: 'GOOGLE_CALENDAR_ACCESS_TOKEN',
    command: 'set GOOGLE_CALENDAR_ACCESS_TOKEN=ya29_your_token && coral source add google_calendar',
    why: 'Detect interviews, assessment deadlines, recruiter calls, and follow-up reminders.',
  },
  {
    name: 'notion',
    label: 'Notion',
    icon: NotebookTabs,
    env: 'NOTION_API_KEY',
    command: 'set NOTION_API_KEY=secret_your_key && coral source add notion',
    why: 'Query notes, resume tailoring docs, interview prep pages, and company research.',
  },
  {
    name: 'slack',
    label: 'Slack',
    icon: MessageSquare,
    env: 'SLACK_TOKEN',
    command: 'set SLACK_TOKEN=xoxb_your_token && coral source add slack',
    why: 'Track referrals, community job posts, messages, and recruiter conversations from workspaces.',
  },
];

const DEMO_SQL = [
  {
    label: 'Job memory + calendar',
    sql: "SELECT j.company_name, j.job_title, e.summary, e.start_date_time FROM job_applications j LEFT JOIN google_calendar.events e ON LOWER(e.summary) LIKE '%' || LOWER(j.company_name) || '%'",
  },
  {
    label: 'Applications + Notion prep',
    sql: "SELECT j.company_name, j.job_title, n.title FROM job_applications j LEFT JOIN notion.pages n ON LOWER(n.title) LIKE '%' || LOWER(j.company_name) || '%'",
  },
  {
    label: 'Open-source proof + applications',
    sql: "SELECT j.company_name, j.job_title, g.title, g.state FROM job_applications j JOIN github.issues g ON LOWER(g.title) LIKE '%' || LOWER(j.job_title) || '%'",
  },
];

export default function CoralSourcesPage() {
  const [sources, setSources] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/coral/sources');
    setSources(data);
    setLoading(false);
  };

  useEffect(() => {
    let ignore = false;

    const loadInitialSources = async () => {
      const { data } = await api.get('/coral/sources');
      if (!ignore) {
        setSources(data);
        setLoading(false);
      }
    };

    loadInitialSources();
    return () => {
      ignore = true;
    };
  }, []);

  const configuredText = sources?.configured || '';

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Coral connections</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Connect everyday tools</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            This is the hackathon-critical layer: install Coral sources, then the First Mate agent can join applications,
            calendars, notes, messages, and code activity through SQL.
          </p>
        </div>
        <button onClick={load} className="inline-flex items-center justify-center gap-2 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="mb-6">
        <GmailConnectPanel compact onConnected={load} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-4">
        {SOURCE_CARDS.map(({ name, label, icon: Icon, env, command, why, uiManaged }) => {
          const installed = configuredText.toLowerCase().includes(name.toLowerCase());
          return (
            <div key={name} className="border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-cyan-700" />
                  <h2 className="font-semibold text-slate-950">{label}</h2>
                </div>
                <span className={`inline-flex items-center gap-1 border px-2 py-1 text-xs font-medium ${installed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                  {installed && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {installed ? 'Connected' : uiManaged ? 'Use panel above' : 'Needs token'}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">{why}</p>
              {!uiManaged && (
                <div className="mt-4 border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <KeyRound className="h-3.5 w-3.5" />
                    {env}
                  </div>
                  <code className="block whitespace-pre-wrap text-xs leading-5 text-slate-700">{command}</code>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <section className="mb-6 grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Terminal className="h-5 w-5 text-cyan-700" />
            <h2 className="text-lg font-semibold text-slate-950">Live Coral status</h2>
          </div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap bg-slate-950 p-4 text-xs leading-5 text-emerald-200">
            {loading ? 'Loading Coral sources...' : sources?.configured}
          </pre>
        </div>

        <div className="border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">Demo script for judges</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>1. Add at least two sources with the commands above.</p>
            <p>2. Open Coral SQL and run a cross-source query.</p>
            <p>3. Open First Mate and show the agent turning joined data into next actions.</p>
          </div>
        </div>
      </section>

      <section className="border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Cross-source SQL examples</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {DEMO_SQL.map((item) => (
            <div key={item.label} className="border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-sm font-semibold text-slate-900">{item.label}</p>
              <code className="block whitespace-pre-wrap text-xs leading-5 text-slate-600">{item.sql}</code>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
