import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, RefreshCw, Sparkles, UploadCloud, X } from 'lucide-react';
import api from '../api/axios';
import GmailConnectPanel from '../components/GmailConnectPanel';

const STATUSES = ['HIRING', 'APPLIED', 'OA', 'INTERVIEW', 'OFFER', 'REJECTED'];
const STATUS_FILTERS = ['ALL', ...STATUSES];
const BATCH_SIZE = 25;

export default function AutoTrackPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanningMore, setScanningMore] = useState(false);
  const [scanStage, setScanStage] = useState('Preparing Gmail scan...');
  const [scanError, setScanError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const scanIdRef = useRef(0);

  const load = async (startOffset = 0) => {
    const scanId = scanIdRef.current + 1;
    scanIdRef.current = scanId;
    setLoading(true);
    setScanningMore(false);
    setScanError('');
    setScanStage('Connecting to Gmail and finding job-related emails...');
    let nextOffset = startOffset;

    try {
      while (true) {
        setScanStage(nextOffset === startOffset ? 'Fetching the first emails...' : `Fetching more emails, scanned ${nextOffset} so far...`);
        const { data: batch } = await api.get(`/agent/email/preview?limit=${BATCH_SIZE}&offset=${nextOffset}`);
        if (scanIdRef.current !== scanId) return;
        const isFirstBatch = nextOffset === startOffset;

        setData((current) => mergePreviewData(isFirstBatch ? null : current, batch));
        setOffset(nextOffset);
        setLoading(false);
        setScanStage('Showing emails while the rest continue loading...');

        if (!batch.connected || (batch.emailsScanned || 0) < BATCH_SIZE) {
          break;
        }

        nextOffset += BATCH_SIZE;
        setScanningMore(true);
      }
    } catch (error) {
      if (scanIdRef.current === scanId) {
        const detail = error.response?.data?.message || error.response?.data?.error || error.message;
        setScanError(detail || 'Could not load Gmail preview.');
        setData((current) => current || {
          connected: false,
          emailsScanned: 0,
          inferred: [],
          emails: [],
          overview: { totals: {}, byDay: {} },
        });
      }
    } finally {
      if (scanIdRef.current === scanId) {
        setLoading(false);
        setScanningMore(false);
        setScanStage('Scan complete.');
      }
    }
  };

  const sync = async () => {
    setSyncing(true);
    const { data } = await api.post(`/agent/email/sync?limit=25&offset=${offset}`);
    setData(data);
    setSyncing(false);
  };

  useEffect(() => {
    let ignore = false;
    const loadInitial = async () => {
      if (!ignore) {
        setData({
          connected: true,
          emailsScanned: 0,
          inferred: [],
          emails: [],
          overview: { totals: {}, byDay: {} },
        });
      }
    };
    loadInitial();
    return () => {
      ignore = true;
    };
  }, []);

  const totals = data?.overview?.totals || {};
  const filteredEmails = useMemo(() => {
    const emails = data?.inferred || [];
    return emails
      .filter((item) => statusFilter === 'ALL' || item.status === statusFilter)
      .sort((a, b) => {
        const result = (a.date || '').localeCompare(b.date || '');
        return sortOrder === 'oldest' ? result : -result;
      });
  }, [data, statusFilter, sortOrder]);

  const byDay = useMemo(() => {
    return Object.entries(data?.overview?.byDay || {})
      .map(([date, counts]) => {
        const visibleCounts = STATUSES.reduce((result, status) => ({
          ...result,
          [status]: statusFilter === 'ALL' || statusFilter === status ? counts[status] || 0 : 0,
        }), {});
        const total = STATUSES.reduce((sum, status) => sum + visibleCounts[status], 0);
        return [date, visibleCounts, total];
      })
      .filter(([, , total]) => total > 0 || statusFilter === 'ALL')
      .sort(([a], [b]) => (sortOrder === 'oldest' ? a.localeCompare(b) : b.localeCompare(a)));
  }, [data, statusFilter, sortOrder]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Automatic tracking</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Gmail application intelligence</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Coral reads Gmail acknowledgement, interview, offer, and rejection emails. The agent infers application status
            and can create tracker records without manual entry.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load(0)} disabled={loading || scanningMore} className="inline-flex items-center gap-2 border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading || scanningMore ? 'animate-spin' : ''}`} />
            {loading ? 'Loading preview...' : scanningMore ? 'Fetching more...' : 'Preview'}
          </button>
          <button onClick={sync} disabled={!data?.connected || syncing} className="inline-flex items-center gap-2 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            <UploadCloud className="h-4 w-4" />
            {syncing ? 'Importing...' : 'Import inferred jobs'}
          </button>
        </div>
      </div>

      <GmailConnectPanel onConnected={() => {
        setScanError('');
        setData({
          connected: true,
          emailsScanned: 0,
          inferred: [],
          emails: [],
          overview: { totals: {}, byDay: {} },
        });
      }} />

      {(loading || scanningMore) && (
        <div className="mb-6 border border-cyan-200 bg-cyan-50 p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-cyan-700" />
            <div>
              <p className="text-sm font-semibold text-cyan-950">{loading ? 'Loading preview' : 'Still scanning Gmail'}</p>
              <p className="text-sm text-cyan-800">{scanStage}</p>
            </div>
          </div>
        </div>
      )}

      {scanError && (
        <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {scanError}
        </div>
      )}

      {data?.connected === false && data?.message && !loading && (
        <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {data.message}
          {data.needsReconnect && (
            <span className="block mt-1">Your Gmail token may have expired — disconnect and connect again above.</span>
          )}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3 lg:grid-cols-7">
        <Metric label="Emails scanned" value={data?.emailsScanned || data?.inferred?.length || 0} active={statusFilter === 'ALL'} onClick={() => setStatusFilter('ALL')} />
        {STATUSES.map((status) => (
          <Metric key={status} label={statusLabel(status)} value={totals[status] || 0} active={statusFilter === status} onClick={() => setStatusFilter(status)} />
        ))}
      </div>

      {data?.imported !== undefined && (
        <div className="mb-6 flex items-center gap-2 border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          Imported {data.imported} new applications from Gmail.
        </div>
      )}

      <section className="mb-6 border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-700" />
            <h2 className="text-lg font-semibold text-slate-950">Daily overview</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>{status === 'ALL' ? 'All emails' : statusLabel(status)}</option>
              ))}
            </select>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-3">Date</th>
                {STATUSES.map((status) => <th key={status} className="py-3">{statusLabel(status)}</th>)}
              </tr>
            </thead>
            <tbody>
              {byDay.map(([date, counts]) => (
                <tr key={date} className="border-b border-slate-100">
                  <td className="py-3 font-medium text-slate-950">{formatDate(date)}</td>
                  {STATUSES.map((status) => <td key={status} className="py-3 text-slate-600">{counts[status] || 0}</td>)}
                </tr>
              ))}
              {byDay.length === 0 && (
                <tr>
                  <td colSpan={STATUSES.length + 1} className="py-8 text-center text-slate-500">
                    {loading ? 'Scanning Gmail now...' : data?.connected ? 'No inferred email activity yet.' : 'Connect Gmail to start scanning.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{statusFilter === 'ALL' ? 'All inferred emails' : `${statusLabel(statusFilter)} emails`}</h2>
            <p className="text-sm text-slate-500">
              Showing {filteredEmails.length} email{filteredEmails.length === 1 ? '' : 's'}{scanningMore ? ' while more batches load.' : '.'}
            </p>
          </div>
        </div>

        {filteredEmails.map((item, index) => (
          <button type="button" key={`${item.subject}-${index}`} onClick={() => setSelectedEmail(item)} className="border border-slate-200 bg-white p-4 text-left transition hover:border-cyan-300 hover:bg-cyan-50">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-950">{item.jobTitle}</h3>
                  <span className="text-slate-400">at</span>
                  <span className="font-medium text-cyan-800">{item.companyName}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{formatDate(item.date)} | {item.subject}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.snippet}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <span className="border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600">{formatDate(item.date)}</span>
                <span className="border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-800">{statusLabel(item.status)}</span>
              </div>
            </div>
          </button>
        ))}
        {loading && filteredEmails.length === 0 && (
          <>
            {[1, 2, 3].map((item) => (
              <div key={item} className="border border-slate-200 bg-white p-4">
                <div className="h-4 w-2/3 animate-pulse bg-slate-200" />
                <div className="mt-3 h-3 w-1/2 animate-pulse bg-slate-100" />
                <div className="mt-4 h-3 w-full animate-pulse bg-slate-100" />
                <div className="mt-2 h-3 w-5/6 animate-pulse bg-slate-100" />
              </div>
            ))}
          </>
        )}
        {filteredEmails.length === 0 && (
          <div className="border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            {loading ? 'Waiting for the first emails to arrive...' : `No ${statusFilter === 'ALL' ? '' : statusLabel(statusFilter).toLowerCase()} emails found in this preview batch.`}
          </div>
        )}
      </section>

      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setSelectedEmail(null)}>
          <section className="max-h-[90vh] w-full max-w-3xl overflow-hidden bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{selectedEmail.subject || 'Email'}</h2>
                <p className="mt-2 text-sm text-slate-500">From: {selectedEmail.from || 'Unknown sender'}</p>
                <p className="mt-1 text-sm text-slate-500">Date: {formatDate(selectedEmail.date)}</p>
              </div>
              <button type="button" onClick={() => setSelectedEmail(null)} className="border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Close email">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-auto p-5">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-800">{statusLabel(selectedEmail.status)}</span>
                <span className="border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600">{selectedEmail.companyName}</span>
                <span className="border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600">{selectedEmail.jobTitle}</span>
              </div>
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">
                {selectedEmail.content || selectedEmail.snippet || 'No email content available.'}
              </pre>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function mergePreviewData(current, batch) {
  if (!current) return withOverview(batch);
  if (!batch.connected) return batch;

  const inferred = dedupeByKey([...(current.inferred || []), ...(batch.inferred || [])]);
  return withOverview({
    ...batch,
    connected: current.connected,
    emailsScanned: (current.emailsScanned || 0) + (batch.emailsScanned || 0),
    emails: [...(current.emails || []), ...(batch.emails || [])],
    inferred,
    existingApplications: batch.existingApplications ?? current.existingApplications,
  });
}

function withOverview(result) {
  const inferred = result?.inferred || [];
  return {
    ...result,
    overview: {
      totals: buildTotals(inferred),
      byDay: buildByDay(inferred),
    },
  };
}

function dedupeByKey(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.date || ''}|${item.status || ''}|${item.companyName || ''}|${item.jobTitle || ''}|${item.subject || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildTotals(items) {
  return items.reduce((result, item) => ({
    ...result,
    [item.status]: (result[item.status] || 0) + 1,
  }), {});
}

function buildByDay(items) {
  return items.reduce((result, item) => {
    const date = item.date || 'Unknown';
    const counts = result[date] || {};
    return {
      ...result,
      [date]: {
        ...counts,
        [item.status]: (counts[item.status] || 0) + 1,
      },
    };
  }, {});
}

function Metric({ label, value, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`border p-4 text-left transition hover:border-cyan-300 hover:bg-cyan-50 ${active ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
    </button>
  );
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function statusLabel(status) {
  if (status === 'OA') return 'Assessment';
  if (status === 'HIRING') return 'Hiring';
  return status;
}
