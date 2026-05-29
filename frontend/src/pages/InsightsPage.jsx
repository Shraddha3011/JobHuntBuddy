import { useState } from 'react';
import { Clock, Database, FileSearch, Terminal, TrendingUp, Zap } from 'lucide-react';
import api from '../api/axios';

const SAMPLE_QUERIES = [
  'SELECT company_name, job_title, status FROM job_applications ORDER BY applied_date DESC LIMIT 10',
  'SELECT source_platform, COUNT(*) AS total FROM job_applications GROUP BY source_platform',
  'SELECT r.name, COUNT(j.id) AS applications FROM resumes r LEFT JOIN job_applications j ON j.resume_id = r.id GROUP BY r.name',
];

export default function InsightsPage() {
  const [sql, setSql] = useState(SAMPLE_QUERIES[0]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(null);

  const runQuery = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/coral/query', { sql });
      setResult(data.result);
    } catch {
      setResult('Error running query. Confirm that the backend and Coral CLI are available.');
    } finally {
      setLoading(false);
    }
  };

  const loadInsight = async (endpoint, label) => {
    setActive(label);
    setLoading(true);
    try {
      const { data } = await api.get(`/coral/insight/${endpoint}`);
      setSql(data.sql);
      setResult(data.result);
    } catch {
      setResult('Error loading insight.');
    } finally {
      setLoading(false);
    }
  };

  const insights = [
    { label: 'Follow-ups', endpoint: 'ghosted', icon: Clock, desc: 'No update in 14+ days' },
    { label: 'Platform ROI', endpoint: 'platform-conversion', icon: TrendingUp, desc: 'Conversion by source' },
    { label: 'Timeline', endpoint: 'timeline', icon: FileSearch, desc: 'Daily apply volume' },
    { label: 'Company join', endpoint: 'company-data', icon: Database, desc: 'Cross-source JOIN demo' },
  ];

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-950">Coral SQL workspace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Query job applications, resumes, and imported sources with one SQL interface.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {insights.map(({ label, endpoint, icon: Icon, desc }) => (
          <button
            key={endpoint}
            onClick={() => loadInsight(endpoint, label)}
            className={`border p-4 text-left transition ${
              active === label ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white hover:border-cyan-200'
            }`}
          >
            <Icon className={`mb-2 h-5 w-5 ${active === label ? 'text-cyan-700' : 'text-slate-400'}`} />
            <p className="text-sm font-semibold text-slate-950">{label}</p>
            <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
          </button>
        ))}
      </div>

      <div className="overflow-hidden border border-slate-800 bg-slate-950 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900 px-4 py-3">
          <Terminal className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-mono text-slate-500">coral query - jobhuntbuddy</span>
        </div>

        <div className="p-5">
          <div className="mb-2 font-mono text-xs text-cyan-300">-- Write SQL. Coral handles source auth, pagination, and schema mapping.</div>
          <textarea
            value={sql}
            onChange={(event) => setSql(event.target.value)}
            className="w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-emerald-300 outline-none"
            rows={6}
            spellCheck={false}
          />
        </div>

        <div className="px-5 pb-3">
          <p className="mb-2 font-mono text-xs text-slate-600">-- Quick examples</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUERIES.map((query, index) => (
              <button
                key={query}
                onClick={() => {
                  setSql(query);
                  setActive(null);
                }}
                className="bg-slate-800 px-3 py-1.5 font-mono text-xs text-slate-400 transition hover:bg-slate-700 hover:text-emerald-300"
              >
                Query {index + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end px-5 pb-5">
          <button
            onClick={runQuery}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
          >
            <Zap className="h-4 w-4" />
            {loading ? 'Running...' : 'Run query'}
          </button>
        </div>

        {result && (
          <div className="border-t border-slate-800 p-5">
            <p className="mb-3 font-mono text-xs text-slate-600">-- Result</p>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-emerald-200">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
