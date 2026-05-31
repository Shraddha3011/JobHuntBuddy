import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, UploadCloud, X, Mail, AlertCircle, Zap, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import api from '../api/axios';
import GmailConnectPanel from '../components/GmailConnectPanel';

const STATUSES = ['HIRING', 'APPLIED', 'OA', 'INTERVIEW', 'OFFER', 'REJECTED'];
const BATCH_SIZE = 100;
const MAX_BATCHES = 50; // up to 5000 emails

const STATUS_CONFIG = {
  HIRED:     { color: '#10b981', icon: '🎯', label: 'Hired',      bgColor: 'rgba(16,185,129,0.1)' },
  APPLIED:   { color: '#3b82f6', icon: '📤', label: 'Applied',    bgColor: 'rgba(59,130,246,0.1)' },
  OA:        { color: '#f59e0b', icon: '⚡', label: 'Assessment', bgColor: 'rgba(245,158,11,0.1)' },
  INTERVIEW: { color: '#8b5cf6', icon: '👥', label: 'Interview',  bgColor: 'rgba(139,92,246,0.1)' },
  OFFER:     { color: '#10b981', icon: '🎉', label: 'Offer',      bgColor: 'rgba(16,185,129,0.1)' },
  REJECTED:  { color: '#ef4444', icon: '📭', label: 'Rejected',   bgColor: 'rgba(239,68,68,0.1)' },
  HIRING:    { color: '#06b6d4', icon: '🔥', label: 'Hiring',     bgColor: 'rgba(6,182,212,0.1)' },
};

/* ─── Skeleton components ─── */
function SkeletonRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(16,185,129,0.08)' }}>
          <div className="skeleton-pulse" style={{ height: 18, borderRadius: 8, width: i === 0 ? 90 : i === cols - 1 ? 32 : 28, margin: '0 auto' }} />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: 16, padding: 20, marginBottom: 12, display: 'flex', gap: 16 }}>
      <div className="skeleton-pulse" style={{ width: 50, height: 50, borderRadius: 12, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton-pulse" style={{ height: 16, borderRadius: 8, width: '55%', marginBottom: 10 }} />
        <div className="skeleton-pulse" style={{ height: 12, borderRadius: 8, width: '35%', marginBottom: 10 }} />
        <div className="skeleton-pulse" style={{ height: 12, borderRadius: 8, width: '80%' }} />
      </div>
    </div>
  );
}

function SkeletonMetric() {
  return (
    <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
      <div className="skeleton-pulse" style={{ width: 30, height: 30, borderRadius: 8, margin: '0 auto 10px' }} />
      <div className="skeleton-pulse" style={{ height: 10, borderRadius: 6, width: 60, margin: '0 auto 10px' }} />
      <div className="skeleton-pulse" style={{ height: 28, borderRadius: 8, width: 40, margin: '0 auto' }} />
    </div>
  );
}

export default function AutoTrackPage() {
const [data, setData] = useState(() => {
  const saved = localStorage.getItem('gmailScanData');
  return saved ? JSON.parse(saved) : null;
});
  const [loading, setLoading]         = useState(false);
  const [scanningMore, setScanningMore] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanStage, setScanStage]     = useState('Preparing Gmail scan...');
  const [scanError, setScanError]     = useState('');
  const [syncing, setSyncing]         = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [progress, setProgress]       = useState({ current: 0, total: 0, batches: 0 });
  const [gmailConnected, setGmailConnected] = useState(false);

  // Table controls
  const [tableDateFilter, setTableDateFilter] = useState('ALL');
  const [tableStatusFilter, setTableStatusFilter] = useState('ALL');
  const [tableSortCol, setTableSortCol]   = useState('date');
  const [tableSortDir, setTableSortDir]   = useState('desc');
  const [showTableFilters, setShowTableFilters] = useState(false);

  const scanIdRef = useRef(0);
  const checkGmailStatus = async () => {
  try {
    const { data } = await api.get('/agent/email/status');
    setGmailConnected(data.connected);
  } catch {
    setGmailConnected(false);
  }
};

  /* ── fetch ALL emails in batches ── */
  const load = async () => {
    const scanId = ++scanIdRef.current;
    setLoading(true);
    setScanningMore(false);
    setScanComplete(false);
    setScanError('');
    setProgress({ current: 0, total: 0, batches: 0 });
    // setData(null);
    setScanStage('Connecting to Gmail…');

    let allInferred = [];
    let allEmails   = [];
    let totalScanned = 0;
    let currentOffset = 0;
    let batchNum = 0;

    try {
      while (batchNum < MAX_BATCHES) {
        if (scanIdRef.current !== scanId) return;

        setScanStage(batchNum === 0
          ? 'Reading your inbox…'
          : `Scanning batch ${batchNum + 1} · ${allInferred.length} emails found so far…`);

        const { data: batch } = await api.get(
          `/agent/email/preview?limit=${BATCH_SIZE}&offset=${currentOffset}`
        );

        if (scanIdRef.current !== scanId) return;

const batchEmails = batch.emails || [];
const newInferred = batch.inferred || [];

allInferred = dedupeByKey([
  ...allInferred,
  ...newInferred
]);

allEmails = [
  ...allEmails,
  ...batchEmails
];
        totalScanned += batch.emailsScanned || newInferred.length;
        batchNum++;
        currentOffset += BATCH_SIZE;

        const merged = withOverview({
          ...batch,
          connected: true,
          emailsScanned: totalScanned,
          emails: allEmails,
          inferred: allInferred,
        });

        setData(merged);
        localStorage.setItem(
  'gmailScanData',
  JSON.stringify(merged)
);
        setProgress({ current: allInferred.length, total: totalScanned, batches: batchNum });

        if (batchNum === 1) {
          setLoading(false);
          setScanningMore(true);
        }

        // stop if Gmail returned fewer than requested (no more pages)
       
if (batchEmails.length < BATCH_SIZE) {
  break;
      }
    }
      setScanningMore(false);
      setScanComplete(true);
      setScanStage(`Done! Scanned ${totalScanned} emails · found ${allInferred.length} job signals.`);
    } catch (err) {
      const detail = err.response?.data?.message || err.response?.data?.error || err.message;
      if (batchNum === 0) {
        setScanError(detail || 'Could not reach Gmail.');
        setLoading(false);
      } else {
        setScanningMore(false);
        setScanComplete(true);
        setScanStage(`Partial scan done · ${allInferred.length} emails loaded. (Some batches failed)`);
      }
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const { data: result } = await api.post(`/agent/email/sync?limit=${BATCH_SIZE}&offset=0`, {});
      setData(result);
    } catch (err) {
      setScanError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

useEffect(() => {
  checkGmailStatus();

  const saved = localStorage.getItem('gmailScanData');

  if (saved) {
    setData(JSON.parse(saved));
  }
}, []);
  const totals  = data?.overview?.totals || {};
  const byDay   = data?.overview?.byDay  || {};
  const isFirstLoad = loading && !data;

  /* ── filtered email list ── */
  const filteredEmails = useMemo(() => {
    const emails = data?.inferred || [];
    return emails
      .filter(i => statusFilter === 'ALL' || i.status === statusFilter)
      .sort((a, b) => -(a.date || '').localeCompare(b.date || ''));
  }, [data, statusFilter]);

  /* ── table data ── */
  const allTableDates = useMemo(() =>
    [...new Set(Object.keys(byDay))].sort((a, b) => -a.localeCompare(b)),
    [byDay]
  );

  const tableStatuses = useMemo(() =>
    STATUSES.filter(s => Object.values(byDay).some(c => c[s])),
    [byDay]
  );

  const tableRows = useMemo(() => {
    let rows = Object.entries(byDay).map(([date, counts]) => ({ date, counts }));

    if (tableDateFilter !== 'ALL')
      rows = rows.filter(r => r.date === tableDateFilter);

    if (tableStatusFilter !== 'ALL')
      rows = rows.filter(r => (r.counts[tableStatusFilter] || 0) > 0);

    rows.sort((a, b) => {
      if (tableSortCol === 'date') {
        const cmp = a.date.localeCompare(b.date);
        return tableSortDir === 'asc' ? cmp : -cmp;
      }
      const va = a.counts[tableSortCol] || 0;
      const vb = b.counts[tableSortCol] || 0;
      return tableSortDir === 'asc' ? va - vb : vb - va;
    });

    return rows.slice(0, 10);
  }, [byDay, tableDateFilter, tableStatusFilter, tableSortCol, tableSortDir]);

  const handleSort = (col) => {
    if (tableSortCol === col) setTableSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setTableSortCol(col); setTableSortDir('desc'); }
  };

  const SortIcon = ({ col }) => {
    if (tableSortCol !== col) return <span style={{ opacity: 0.25, fontSize: 10 }}>↕</span>;
    return tableSortDir === 'asc'
      ? <ChevronUp  style={{ width: 12, height: 12, color: '#34d399' }} />
      : <ChevronDown style={{ width: 12, height: 12, color: '#34d399' }} />;
  };

  const showTableSkeleton = (loading || scanningMore) && tableRows.length === 0;
  const showEmailSkeleton = isFirstLoad;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg,#020617 0%,#07130f 50%,#020617 100%)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;600;700;800;900&display=swap');
        * { font-family:'Urbanist',sans-serif; box-sizing:border-box; }

        @keyframes float-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer  { 0%{background-position:-800px 0} 100%{background-position:800px 0} }
        @keyframes slide-in { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px rgba(16,185,129,0.3)} 50%{box-shadow:0 0 40px rgba(16,185,129,0.7)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes skeleton-wave {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        @keyframes scanning-bar {
          0%   { transform: scaleX(0) translateX(0); }
          50%  { transform: scaleX(1) translateX(0); }
          100% { transform: scaleX(0) translateX(100%); }
        }

        .skeleton-pulse {
          background: linear-gradient(90deg,
            rgba(16,185,129,0.06) 25%,
            rgba(16,185,129,0.14) 50%,
            rgba(16,185,129,0.06) 75%);
          background-size: 600px 100%;
          animation: skeleton-wave 1.6s ease-in-out infinite;
        }

        .gradient-text {
          background:linear-gradient(135deg,#10b981 0%,#34d399 50%,#6ee7b7 100%);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }

        .btn-primary {
          display:flex; align-items:center; gap:8px;
          background:linear-gradient(135deg,#10b981,#059669);
          border:1px solid rgba(16,185,129,0.6); color:white;
          padding:12px 24px; border-radius:12px; font-weight:700; font-size:15px;
          cursor:pointer; transition:all 0.3s ease;
        }
        .btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 20px 40px rgba(16,185,129,0.4); }
        .btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none !important;
}

        .btn-secondary {
          display:flex; align-items:center; gap:8px;
          background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3);
          color:#34d399; padding:12px 24px; border-radius:12px; font-weight:700; font-size:15px;
          cursor:pointer; transition:all 0.3s ease;
        }
        .btn-secondary:hover:not(:disabled) { background:rgba(16,185,129,0.2); border-color:rgba(16,185,129,0.5); }
        .btn-secondary:disabled { opacity:0.5; cursor:not-allowed; }

        .metric-card {
          background:linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.05));
          border:1px solid rgba(16,185,129,0.2); border-radius:16px; padding:20px;
          cursor:pointer; transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1); text-align:center;
        }
        .metric-card:hover { transform:translateY(-10px); border-color:rgba(16,185,129,0.5); box-shadow:0 28px 56px rgba(16,185,129,0.2); }
        .metric-card.active { background:linear-gradient(135deg,rgba(16,185,129,0.22),rgba(5,150,105,0.16)); border-color:rgba(16,185,129,0.7); box-shadow:0 0 32px rgba(16,185,129,0.4); }

        .progress-bar { height:100%; background:linear-gradient(90deg,#10b981,#34d399); border-radius:10px; transition:width 0.5s ease; position:relative; overflow:hidden; }
        .progress-bar::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); animation:shimmer 1.8s infinite; }

        .scanning-indicator {
          height: 3px;
          background: rgba(16,185,129,0.15);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 8px;
        }
        .scanning-indicator-bar {
          height: 100%;
          width: 40%;
          background: linear-gradient(90deg, transparent, #10b981, transparent);
          border-radius: 3px;
          animation: shimmer 1.4s ease-in-out infinite;
          background-size: 200% 100%;
        }

        .email-card {
          background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(5,150,105,0.03));
          border:1px solid rgba(16,185,129,0.18); border-radius:16px; padding:20px; margin-bottom:12px;
          cursor:pointer; transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1); display:flex; gap:16px;
        }
        .email-card:hover { transform:translateY(-5px); border-color:rgba(16,185,129,0.45); box-shadow:0 18px 40px rgba(16,185,129,0.18); }

        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:60; padding:24px; }
        .modal-content { background:linear-gradient(135deg,rgba(10,15,30,0.98),rgba(10,15,30,0.95)); border:1px solid rgba(16,185,129,0.22); border-radius:20px; max-width:820px; width:100%; max-height:90vh; overflow-y:auto; box-shadow:0 30px 60px rgba(0,0,0,0.6); }
        .modal-close { width:40px; height:40px; border-radius:10px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); color:#34d399; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.3s; flex-shrink:0; }
        .modal-close:hover { background:rgba(16,185,129,0.2); }

        /* table */
        .activity-table { width:100%; border-collapse:separate; border-spacing:0; font-size:13px; }
        .activity-table thead th {
          padding:12px 16px; text-align:left; font-weight:700; font-size:11px;
          text-transform:uppercase; letter-spacing:0.07em; color:rgba(148,163,184,0.55);
          border-bottom:1px solid rgba(16,185,129,0.15); background:rgba(16,185,129,0.04);
          cursor:pointer; user-select:none; white-space:nowrap;
        }
        .activity-table thead th:hover { color:rgba(52,211,153,0.9); }
        .activity-table tbody tr { transition:background 0.2s; }
        .activity-table tbody tr:hover td { background:rgba(16,185,129,0.06); }
        .activity-table tbody td { padding:11px 16px; border-bottom:1px solid rgba(16,185,129,0.07); color:rgba(226,232,240,0.85); vertical-align:middle; }
        .activity-table tbody tr:last-child td { border-bottom:none; }
        .tbl-count { display:inline-block; min-width:28px; text-align:center; padding:2px 8px; border-radius:8px; font-weight:800; font-size:13px; }
        .tbl-total-pill { display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:50%; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.4); color:#34d399; font-weight:900; font-size:13px; }

        .filter-select {
          background:rgba(2,6,23,0.8); border:1px solid rgba(16,185,129,0.25);
          color:rgba(226,232,240,0.85); padding:8px 12px; border-radius:10px;
          font-size:13px; font-weight:600; font-family:'Urbanist',sans-serif;
          cursor:pointer; outline:none; transition:border-color 0.2s;
        }
        .filter-select:hover, .filter-select:focus { border-color:rgba(16,185,129,0.55); }
        .filter-select option { background:#0f172a; }

        .stagger-1 { animation:float-up 0.8s ease-out 0.0s backwards; }
        .stagger-2 { animation:float-up 0.8s ease-out 0.1s backwards; }
        .stagger-3 { animation:float-up 0.8s ease-out 0.2s backwards; }
        .stagger-4 { animation:float-up 0.8s ease-out 0.3s backwards; }
        .stagger-5 { animation:float-up 0.8s ease-out 0.4s backwards; }

        @media(max-width:768px){ .hero-flex{flex-direction:column} .action-buttons{width:100%} }
      `}</style>

      <div style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

          {/* ── Hero ── */}
          <div className="stagger-1" style={{ marginBottom: 36 }}>
            <div className="hero-flex" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:32, flexWrap:'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'4px 14px', borderRadius:20, background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', marginBottom:14 }}>
                  <Mail style={{ width:13, height:13, color:'#34d399' }} />
                  <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'#34d399' }}>Email Intelligence Hub</span>
                </div>
                <h1 style={{ fontSize:40, fontWeight:900, color:'white', lineHeight:1.2, marginBottom:10 }}>
                  Track Your Entire<br /><span className="gradient-text">Job Hunt</span> from Gmail
                </h1>
                <p style={{ color:'rgba(148,163,184,0.8)', fontSize:16, maxWidth:620, margin:0 }}>
                  Scans <strong style={{ color:'#34d399' }}>every email</strong> in your inbox — no limits, no manual entry.
                  {scanningMore && <span style={{ color:'rgba(52,211,153,0.7)' }}> Currently scanning in background…</span>}
                </p>
              </div>
              <div className="action-buttons" style={{ display:'flex', gap:12, flexShrink:0, alignSelf:'center' }}>
<button
  onClick={load}
  disabled={!gmailConnected || loading}
  className="btn-primary"
>
  <RefreshCw
    style={{
      width: 16,
      height: 16,
      animation: loading ? 'spin 1s linear infinite' : 'none'
    }}
  />

{!gmailConnected
  ? 'Connect Gmail First'
  : loading
  ? 'Scanning Gmail...'
  : scanningMore
  ? 'Loading More Emails...'
  : 'Scan Gmail'}
</button>
                <button onClick={sync} disabled={!gmailConnected || syncing || loading} className="btn-secondary">
                  <UploadCloud style={{ width:16, height:16 }} />
                  {syncing ? 'Importing…' : 'Import All'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Gmail Panel ── */}
        <GmailConnectPanel
  onConnected={() => {
    setGmailConnected(true);
    setScanError('');
    load();
  }}
/>

          {/* ── Metric Cards ── */}
          <div className="stagger-2" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:14, marginBottom:36 }}>
            {isFirstLoad ? (
              Array.from({ length: 7 }).map((_, i) => <SkeletonMetric key={i} />)
            ) : (
              <>
                <div className={`metric-card ${statusFilter==='ALL'?'active':''}`} onClick={() => setStatusFilter('ALL')}>
                  <div style={{ fontSize:26, marginBottom:6 }}>📧</div>
                  <div style={{ fontSize:11, color:'rgba(148,163,184,0.7)', marginBottom:6, textTransform:'uppercase', fontWeight:600, letterSpacing:'0.5px' }}>Total</div>
                  <div style={{ fontSize:30, fontWeight:900, color:'#34d399' }}>{data?.emailsScanned || data?.inferred?.length || 0}</div>
                  {scanningMore && <div className="scanning-indicator"><div className="scanning-indicator-bar" /></div>}
                </div>
                {STATUSES.map(status => {
                  const cfg = STATUS_CONFIG[status];
                  return (
                    <div key={status} className={`metric-card ${statusFilter===status?'active':''}`} onClick={() => setStatusFilter(status)}>
                      <div style={{ fontSize:26, marginBottom:6 }}>{cfg.icon}</div>
                      <div style={{ fontSize:11, color:'rgba(148,163,184,0.7)', marginBottom:6, textTransform:'uppercase', fontWeight:600, letterSpacing:'0.5px' }}>{cfg.label}</div>
                      <div style={{ fontSize:30, fontWeight:900, color:cfg.color }}>{totals[status] || 0}</div>
                      {scanningMore && <div className="scanning-indicator"><div className="scanning-indicator-bar" /></div>}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* ── Progress ── */}
          {(loading || scanningMore || scanComplete) && (
            <div className="stagger-3" style={{ background:'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.08))', border:'1px solid rgba(16,185,129,0.2)', borderRadius:20, padding:28, marginBottom:32 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:'rgba(16,185,129,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#34d399', animation:(loading||scanningMore)?'pulse-glow 2s ease-in-out infinite':undefined }}>
                  <Zap style={{ width:18, height:18 }} />
                </div>
                <div>
                  <div style={{ fontSize:17, fontWeight:800, color:'white' }}>
                    {loading ? '🔍 Connecting to Gmail' : scanningMore ? '📬 Scanning All Emails' : '✨ Scan Complete'}
                  </div>
                  <div style={{ fontSize:13, color:'rgba(148,163,184,0.8)', marginTop:2 }}>{scanStage}</div>
                </div>
              </div>
              <div style={{ width:'100%', height:8, background:'rgba(16,185,129,0.1)', borderRadius:10, overflow:'hidden', marginBottom:10 }}>
                {isFirstLoad ? (
                  <div className="skeleton-pulse" style={{ height:'100%', borderRadius:10 }} />
                ) : (
                  <div className="progress-bar" style={{ width: scanComplete ? '100%' : `${Math.min(95, (progress.batches / MAX_BATCHES) * 100 + 5)}%` }} />
                )}
              </div>
            </div>
          )}

          {/* ── Error banner ── */}
          {scanError && (
            <div style={{ background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:16, marginBottom:28, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'rgba(239,68,68,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <AlertCircle style={{ width:18, height:18, color:'#f87171' }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:'white', fontSize:14 }}>Something went wrong</div>
                <div style={{ fontSize:13, color:'rgba(148,163,184,0.7)', marginTop:2 }}>{scanError}</div>
              </div>
              <button onClick={() => setScanError('')} className="btn-secondary" style={{ padding:'8px 16px', fontSize:13 }}>Dismiss</button>
            </div>
          )}

          {/* ── Activity Table ── */}
          <div className="stagger-4" style={{ marginBottom:36 }}>
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, marginBottom:16, flexWrap:'wrap' }}>
              <div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'4px 14px', borderRadius:20, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', marginBottom:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'#10b981' }}>Activity Log</span>
                  {scanningMore && <span style={{ fontSize:10, color:'rgba(52,211,153,0.7)', fontStyle:'italic' }}>updating…</span>}
                </div>
                <h2 style={{ fontSize:22, fontWeight:900, color:'white', margin:0 }}>Email Activity by Date</h2>
                <p style={{ fontSize:13, color:'rgba(148,163,184,0.6)', marginTop:4 }}>
                  {showTableSkeleton ? 'Gathering data…' : `${tableRows.length} day${tableRows.length !== 1 ? 's' : ''} · click column headers to sort`}
                </p>
              </div>
              <button
                onClick={() => setShowTableFilters(v => !v)}
                className="btn-secondary"
                style={{ padding:'8px 16px', fontSize:13, gap:6 }}
              >
                <Filter style={{ width:14, height:14 }} />
                Filters {showTableFilters ? '▲' : '▼'}
              </button>
            </div>

            {/* Filter bar */}
            {showTableFilters && (
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:14, padding:'14px 18px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.18)', borderRadius:14, animation:'slide-in 0.3s ease-out' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:'rgba(148,163,184,0.6)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Date</label>
                  <select className="filter-select" value={tableDateFilter} onChange={e => setTableDateFilter(e.target.value)}>
                    <option value="ALL">All Dates</option>
                    {allTableDates.map(d => <option key={d} value={d}>{formatDate(d)}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:'rgba(148,163,184,0.6)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Status</label>
                  <select className="filter-select" value={tableStatusFilter} onChange={e => setTableStatusFilter(e.target.value)}>
                    <option value="ALL">All Statuses</option>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex', alignItems:'flex-end' }}>
                  <button onClick={() => { setTableDateFilter('ALL'); setTableStatusFilter('ALL'); setTableSortCol('date'); setTableSortDir('desc'); }} className="btn-secondary" style={{ padding:'8px 14px', fontSize:12 }}>
                    Reset
                  </button>
                </div>
              </div>
            )}

            <div style={{ background:'rgba(2,6,23,0.75)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:18, backdropFilter:'blur(20px)', overflow:'hidden' }}>
              <table className="activity-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('date')} style={{ display:'flex', alignItems:'center', gap:5 }}>
                      Date <SortIcon col="date" />
                    </th>
                    {(tableStatuses.length ? tableStatuses : STATUSES).map(s => (
                      <th key={s} onClick={() => handleSort(s)}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                          {STATUS_CONFIG[s]?.icon} {STATUS_CONFIG[s]?.label || s} <SortIcon col={s} />
                        </span>
                      </th>
                    ))}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {showTableSkeleton ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonRow key={i} cols={(tableStatuses.length || STATUSES.length) + 2} />
                    ))
                  ) : tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={(tableStatuses.length || STATUSES.length) + 2} style={{ textAlign:'center', padding:'40px 0', color:'rgba(148,163,184,0.4)', fontSize:14 }}>
                        No data yet — scan your inbox to begin
                      </td>
                    </tr>
                  ) : (
                    tableRows.map(({ date, counts }) => {
                      const cols = tableStatuses.length ? tableStatuses : STATUSES;
                      const total = cols.reduce((s, k) => s + (counts[k] || 0), 0);
                      return (
                        <tr key={date}>
                          <td style={{ fontWeight:700, fontSize:13, whiteSpace:'nowrap' }}>{formatDate(date)}</td>
                          {cols.map(s => {
                            const cfg = STATUS_CONFIG[s];
                            const val = counts[s] || 0;
                            return (
                              <td key={s}>
<span
  className="tbl-count"
  style={{
    background: val > 0 ? cfg.bgColor : 'rgba(148,163,184,0.08)',
    color: val > 0 ? cfg.color : 'rgba(148,163,184,0.7)',
  }}
>
  {val}
</span>
                              </td>
                            );
                          })}
                          <td><span className="tbl-total-pill">{total}</span></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Email List ── */}
          <div className="stagger-5">
            <div style={{ marginBottom:20 }}>
              <h2 style={{ fontSize:22, fontWeight:900, color:'white', margin:0 }}>
                {statusFilter === 'ALL' ? '📩 All Emails' : `${STATUS_CONFIG[statusFilter]?.icon} ${STATUS_CONFIG[statusFilter]?.label} Emails`}
              </h2>
              <p style={{ fontSize:13, color:'rgba(148,163,184,0.6)', marginTop:4 }}>
                {showEmailSkeleton ? 'Scanning inbox…' : `${filteredEmails.length} email${filteredEmails.length !== 1 ? 's' : ''} · click to view details`}
                {scanningMore && !showEmailSkeleton && <span style={{ color:'rgba(52,211,153,0.6)', marginLeft:8 }}>· loading more…</span>}
              </p>
            </div>

            {showEmailSkeleton ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            ) : filteredEmails.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 24px', color:'rgba(148,163,184,0.55)' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🎯</div>
                <div style={{ fontSize:18, fontWeight:700, color:'white', marginBottom:8 }}>No emails yet</div>
                <div style={{ fontSize:14 }}>Scan your Gmail inbox to discover your job applications</div>
              </div>
            ) : (
              filteredEmails.map((item, index) => {
                const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.APPLIED;
                return (
                  <div key={`${item.subject}-${index}`} className="email-card" onClick={() => setSelectedEmail(item)}>
                    <div style={{ width:50, height:50, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0, background:cfg.bgColor }}>{cfg.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:800, color:'white', fontSize:15 }}>{item.jobTitle}</span>
                        <span style={{ color:'rgba(148,163,184,0.4)' }}>@</span>
                        <span style={{ color:'#34d399', fontWeight:700 }}>{item.companyName}</span>
                        <div style={{ marginLeft:'auto', padding:'4px 12px', borderRadius:10, fontSize:11, fontWeight:700, border:`1px solid ${cfg.color}`, background:cfg.bgColor, color:cfg.color }}>{cfg.label}</div>
                      </div>
                      <div style={{ fontSize:13, color:'rgba(148,163,184,0.6)', marginBottom:6 }}>{formatDate(item.date)} · {item.from || 'Unknown sender'}</div>
                      <div style={{ fontSize:13, color:'rgba(148,163,184,0.7)', lineHeight:1.5 }}>{item.snippet}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {selectedEmail && (
        <div className="modal-overlay" onClick={() => setSelectedEmail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ padding:32, borderBottom:'1px solid rgba(16,185,129,0.1)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>
              <div>
                <div style={{ fontSize:20, fontWeight:900, color:'white', marginBottom:10 }}>{selectedEmail.subject}</div>
                <div style={{ fontSize:13, color:'rgba(148,163,184,0.7)', marginBottom:4 }}>From: {selectedEmail.from || 'Unknown'}</div>
                <div style={{ fontSize:13, color:'rgba(148,163,184,0.7)' }}>{formatDate(selectedEmail.date)}</div>
              </div>
              <button onClick={() => setSelectedEmail(null)} className="modal-close"><X style={{ width:18, height:18 }} /></button>
            </div>
            <div style={{ padding:32 }}>
              <pre style={{ background:'rgba(0,0,0,0.3)', padding:16, borderRadius:12, color:'#86efac', fontSize:13, lineHeight:1.6, overflowX:'auto', whiteSpace:'pre-wrap' }}>
                {selectedEmail.content || selectedEmail.snippet}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── helpers ── */
function mergePreviewData(current, batch) {
  if (!current) return withOverview(batch);
  if (!batch.connected) return batch;
  const inferred = dedupeByKey([...(current.inferred || []), ...(batch.inferred || [])]);
  return withOverview({ ...batch, connected: current.connected, emailsScanned: (current.emailsScanned || 0) + (batch.emailsScanned || 0), emails: [...(current.emails || []), ...(batch.emails || [])], inferred, existingApplications: batch.existingApplications ?? current.existingApplications });
}
function withOverview(result) {
  const inferred = result?.inferred || [];
  return { ...result, overview: { totals: buildTotals(inferred), byDay: buildByDay(inferred) } };
}
function dedupeByKey(items) {
  const seen = new Set();
  return items.filter(item => { const k = `${item.date||''}|${item.status||''}|${item.companyName||''}|${item.jobTitle||''}`; if (seen.has(k)) return false; seen.add(k); return true; });
}
function buildTotals(items) { return items.reduce((r, i) => ({ ...r, [i.status]: (r[i.status] || 0) + 1 }), {}); }
function buildByDay(items) { return items.reduce((r, i) => { const d = i.date || 'Unknown'; const c = r[d] || {}; return { ...r, [d]: { ...c, [i.status]: (c[i.status] || 0) + 1 } }; }, {}); }
function formatDate(value) {
  if (!value) return '';
  const d = new Date(`${value}T00:00:00`);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}