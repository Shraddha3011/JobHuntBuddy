import { useEffect, useState } from 'react';
import { CheckCircle2, Inbox, KeyRound, Link2, Loader2, Unplug } from 'lucide-react';
import api from '../api/axios';
import { useGoogleGmailAuth } from '../hooks/useGoogleGmailAuth';

export default function GmailConnectPanel({ onConnected, compact = false }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [tokenInput, setTokenInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const clientId = status?.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const { ready: googleReady, error: googleError, requestAccessToken, scope } = useGoogleGmailAuth(clientId);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/agent/email/status');
      setStatus(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const connectWithToken = async (accessToken) => {
    setConnecting(true);
    setMessage('');
    setMessageType('info');
    try {
      const { data } = await api.post('/agent/email/connect', { accessToken: accessToken.trim() });
      setMessage(data.message || (data.connected ? 'Connected.' : 'Could not connect Gmail.'));
      setMessageType(data.connected ? 'success' : 'error');
      if (data.connected) {
        setStatus((prev) => ({ ...prev, connected: true }));
        setTokenInput('');
        await loadStatus();
        onConnected?.();
      }
    } catch (err) {
      const detail = err.response?.data?.message || err.response?.data?.error || err.message;
      setMessage(detail || 'Could not connect Gmail. Is the backend running on port 8080?');
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
    }
  };

  const disconnect = async () => {
    setConnecting(true);
    setMessage('');
    try {
      await api.delete('/agent/email/connect');
      setStatus((prev) => ({ ...prev, connected: false }));
      setMessage('Gmail disconnected.');
      onConnected?.();
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking Gmail connection...
      </div>
    );
  }

  if (status?.connected) {
    return (
      <div className={`${compact ? '' : 'mb-6'} border border-emerald-200 bg-emerald-50 p-5`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
            <div>
              <h2 className="font-semibold text-emerald-900">Gmail connected</h2>
              <p className="mt-1 text-sm text-emerald-800">
                JobHuntBuddy can scan acknowledgement, interview, offer, and rejection emails through Coral.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={disconnect}
            disabled={connecting}
            className="inline-flex items-center justify-center gap-2 border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
          >
            <Unplug className="h-4 w-4" />
            Disconnect
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-emerald-800">{message}</p>}
      </div>
    );
  }

  return (
    <div className={`${compact ? '' : 'mb-6'} border border-amber-200 bg-amber-50 p-5`}>
      <div className="flex items-start gap-3">
        <Inbox className="mt-0.5 h-5 w-5 text-amber-700" />
        <div className="flex-1">
          <h2 className="font-semibold text-amber-900">Connect Gmail</h2>
          <p className="mt-1 text-sm text-amber-800">
            No terminal commands needed. Sign in with Google here and JobHuntBuddy will configure Coral for you.
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
              <p className="text-sm text-amber-800">
                Add <code className="rounded bg-white px-1">VITE_GOOGLE_CLIENT_ID</code> to enable one-click sign-in,
                or paste a token below.
              </p>
            )}
          </div>

          {googleError && <p className="mt-2 text-sm text-red-700">{googleError}</p>}

          <button
            type="button"
            onClick={() => setShowAdvanced((value) => !value)}
            className="mt-4 text-sm font-semibold text-amber-900 underline"
          >
            {showAdvanced ? 'Hide' : 'Show'} manual token option
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3">
              <p className="text-xs leading-5 text-amber-800">
                Paste the <strong>access token</strong> (starts with <code className="rounded bg-white px-1">ya29.</code>),
                not your Client ID. Scope: <code className="rounded bg-white px-1">{scope}</code>.
                Use <a className="underline" href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer">OAuth Playground</a>
                → gear icon → use your own credentials → Gmail API v1 → gmail.readonly → Authorize → Exchange → copy token.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <KeyRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(event) => setTokenInput(event.target.value)}
                    placeholder="Paste Google access token"
                    className="w-full border border-amber-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => connectWithToken(tokenInput)}
                  disabled={connecting || !tokenInput.trim()}
                  className="inline-flex items-center justify-center gap-2 border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                >
                  {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Connect with token
                </button>
              </div>
            </div>
          )}

          {message && (
            <p
              className={`mt-3 rounded border px-3 py-2 text-sm ${
                messageType === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : messageType === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-amber-200 bg-white text-amber-900'
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
