import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, FileText, HardDrive, KeyRound, Link2, Loader2, RefreshCw, Unplug, UploadCloud } from 'lucide-react';
import api from '../api/axios';
import { DRIVE_SCOPE, useGoogleGmailAuth } from '../hooks/useGoogleGmailAuth';

export default function GoogleDriveConnectPanel({ onImported, compact = false }) {
  const [status, setStatus] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [tokenInput, setTokenInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const clientId = status?.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const { ready: googleReady, error: googleError, requestAccessToken, scope } = useGoogleGmailAuth(clientId, DRIVE_SCOPE);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/agent/drive/status');
      setStatus(data);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const { data } = await api.get('/agent/drive/resumes');
      setFiles(data.files || []);
      if (!data.connected && data.message) {
        setMessage(data.message);
        setMessageType('error');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Could not load Google Drive files.');
      setMessageType('error');
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (status?.connected) {
      loadFiles();
    }
  }, [status?.connected]);

  const connectWithToken = async (accessToken) => {
    setConnecting(true);
    setMessage('');
    setMessageType('info');
    try {
      const { data } = await api.post('/agent/drive/connect', { accessToken: accessToken.trim() });
      setMessage(data.message || (data.connected ? 'Google Drive connected.' : 'Could not connect Google Drive.'));
      setMessageType(data.connected ? 'success' : 'error');
      if (data.connected) {
        setStatus((prev) => ({ ...prev, connected: true }));
        setTokenInput('');
        await loadStatus();
        await loadFiles();
      }
    } catch (err) {
      const detail = err.response?.data?.message || err.response?.data?.error || err.message;
      setMessage(detail || 'Could not connect Google Drive.');
      setMessageType('error');
    } finally {
      setConnecting(false);
    }
  };

  const connectWithGoogle = async () => {
    try {
      const accessToken = await requestAccessToken();
      await connectWithToken(accessToken);
    } catch (err) {
      setMessage(err.message || 'Google sign-in was cancelled.');
      setMessageType('error');
    }
  };

  const syncResumes = async () => {
    setSyncing(true);
    setMessage('');
    try {
      const { data } = await api.post('/agent/drive/sync-resumes', {});
      setFiles(data.files || []);
      setMessage(data.message || 'Drive resume versions synced.');
      setMessageType(data.connected ? 'success' : 'error');
      if (data.connected) {
        onImported?.(data.resumes);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Could not import Drive resumes.');
      setMessageType('error');
    } finally {
      setSyncing(false);
    }
  };

  const disconnect = async () => {
    setConnecting(true);
    setMessage('');
    try {
      await api.delete('/agent/drive/connect');
      setStatus((prev) => ({ ...prev, connected: false }));
      setFiles([]);
      setMessage('Google Drive disconnected.');
      setMessageType('info');
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking Google Drive connection...
      </div>
    );
  }

  if (status?.connected) {
    return (
      <div className={`${compact ? '' : 'mb-6'} border border-emerald-200 bg-emerald-50 p-5`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
            <div>
              <h2 className="font-semibold text-emerald-900">Google Drive connected</h2>
              <p className="mt-1 text-sm text-emerald-800">
                Resume files with Resume or CV in the name can be imported into the Resume Vault.
              </p>
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.slice(0, 3).map((file) => (
                    <a
                      key={file.id || file.webViewLink || file.name}
                      href={file.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm font-medium text-emerald-900 underline"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="truncate">{file.name}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={loadFiles}
              disabled={syncing || connecting}
              className="inline-flex items-center justify-center gap-2 border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={syncResumes}
              disabled={syncing || connecting}
              className="inline-flex items-center justify-center gap-2 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {syncing ? 'Importing...' : 'Import resumes'}
            </button>
            <button
              type="button"
              onClick={disconnect}
              disabled={connecting || syncing}
              className="inline-flex items-center justify-center gap-2 border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
            >
              <Unplug className="h-4 w-4" />
              Disconnect
            </button>
          </div>
        </div>
        {message && <Message type={messageType} text={message} />}
      </div>
    );
  }

  return (
    <div className={`${compact ? '' : 'mb-6'} border border-sky-200 bg-sky-50 p-5`}>
      <div className="flex items-start gap-3">
        <HardDrive className="mt-0.5 h-5 w-5 text-sky-700" />
        <div className="flex-1">
          <h2 className="font-semibold text-sky-950">Connect Google Drive</h2>
          <p className="mt-1 text-sm text-sky-800">
            Import resume versions from your Drive folder so every application can remember the exact resume link.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {clientId ? (
              <button
                type="button"
                onClick={connectWithGoogle}
                disabled={connecting || !googleReady}
                className="inline-flex items-center gap-2 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                {connecting ? 'Connecting...' : googleReady ? 'Sign in with Google' : 'Loading Google sign-in...'}
              </button>
            ) : (
              <p className="text-sm text-sky-800">
                Add <code className="rounded bg-white px-1">VITE_GOOGLE_CLIENT_ID</code> to enable one-click sign-in,
                or paste a token below.
              </p>
            )}
          </div>

          {googleError && <p className="mt-2 text-sm text-red-700">{googleError}</p>}

          <button
            type="button"
            onClick={() => setShowAdvanced((value) => !value)}
            className="mt-4 text-sm font-semibold text-sky-950 underline"
          >
            {showAdvanced ? 'Hide' : 'Show'} manual token option
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3">
              <p className="text-xs leading-5 text-sky-800">
                Paste a Google access token with scope <code className="rounded bg-white px-1">{scope}</code>.
                In OAuth Playground, choose Drive API v3, authorize <strong>drive.metadata.readonly</strong>, then copy the access token.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <KeyRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(event) => setTokenInput(event.target.value)}
                    placeholder="Paste Google Drive access token"
                    className="w-full border border-sky-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => connectWithToken(tokenInput)}
                  disabled={connecting || !tokenInput.trim()}
                  className="inline-flex items-center justify-center gap-2 border border-sky-300 bg-white px-4 py-2.5 text-sm font-semibold text-sky-950 hover:bg-sky-100 disabled:opacity-50"
                >
                  {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Connect with token
                </button>
              </div>
            </div>
          )}

          {message && <Message type={messageType} text={message} />}
        </div>
      </div>
    </div>
  );
}

function Message({ type, text }) {
  const className =
    type === 'error'
      ? 'border-red-200 bg-red-50 text-red-800'
      : type === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-sky-200 bg-white text-sky-900';

  return <p className={`mt-3 rounded border px-3 py-2 text-sm ${className}`}>{text}</p>;
}
