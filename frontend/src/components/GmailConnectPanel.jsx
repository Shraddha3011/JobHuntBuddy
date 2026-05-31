import { useEffect, useState } from 'react';
import { CheckCircle2, Mail, Lock, Zap, Shield, ArrowRight, ChevronDown, ExternalLink, Loader2, Unplug, X, BookOpen } from 'lucide-react';
import api from '../api/axios';
import { useGoogleGmailAuth } from '../hooks/useGoogleGmailAuth';

export default function GmailConnectPanel({ onConnected, compact = false }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [tokenInput, setTokenInput] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

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
      setMessage(data.message || (data.connected ? 'Gmail connected!' : 'Connection failed.'));
      setMessageType(data.connected ? 'success' : 'error');
      if (data.connected) {
        setStatus((prev) => ({ ...prev, connected: true }));
        setTokenInput('');
        setShowGuide(false);
        await loadStatus();
        onConnected?.();
      }
    } catch (err) {
      const detail = err.response?.data?.message || err.response?.data?.error || err.message;
      setMessage(detail || 'Could not connect Gmail.');
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
      setMessage(err.message || 'Sign-in cancelled.');
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

  const steps = [
    {
      num: 1,
      title: "Open Playground",
      icon: "🌐",
      description: "Visit Google's OAuth Playground",
      detail: "Click the link below to open Google's official OAuth Playground.",
      hint: "It's a safe, official Google tool",
      action: { text: "Open Playground", link: "https://developers.google.com/oauthplayground" }
    },
    {
      num: 2,
      title: "Click Gear ⚙️",
      icon: "⚙️",
      description: "Find the settings icon",
      detail: "Look for the gear icon (⚙️) in the top right corner next to 'Gmail API v1' and click it.",
      hint: "It's on the right side of the page"
    },
    {
      num: 3,
      title: "Your Credentials",
      icon: "🔐",
      description: "Use your own OAuth credentials",
      detail: "Check the box that says 'Use your own OAuth credentials'. You may need to sign in with your Google account.",
      hint: "This ensures you're using your account"
    },
    {
      num: 4,
      title: "Select Scope",
      icon: "📧",
      description: "Choose gmail.readonly",
      detail: "On the left side under 'Step 1', find Gmail API v1 and select 'gmail.readonly' scope.",
      hint: "This lets us READ emails, not delete or modify them"
    },
    {
      num: 5,
      title: "Authorize",
      icon: "✅",
      description: "Click Authorize APIs",
      detail: "Click the blue 'Authorize APIs' button and grant permission when Google asks.",
      hint: "You'll see a permission prompt from Google"
    },
    {
      num: 6,
      title: "Exchange Code",
      icon: "🔄",
      description: "Get your token",
      detail: "After authorization, click 'Exchange Authorization Code for Tokens' on the right side.",
      hint: "This generates your access token"
    },
    {
      num: 7,
      title: "Copy Token",
      icon: "📋",
      description: "Get your secret key",
      detail: "On the right under 'Access Token', you'll see a long string starting with 'ya29.'. Copy the entire token.",
      hint: "It looks like: ya29.a0AfH6SMBx..."
    },
    {
      num: 8,
      title: "Paste & Connect",
      icon: "🎉",
      description: "Almost done!",
      detail: "Come back here and paste your token in the box below, then click 'Connect Now'.",
      hint: "That's it! You're all set 🚀"
    }
  ];

  if (loading) {
    return (
      <div className="mb-8">
        <style>{`
          @keyframes pulse-dot {
            0%, 100% { opacity: 0.4; } 50% { opacity: 1; }
          }
          .loading-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
          .loading-dot:nth-child(2) { animation-delay: 0.2s; }
          .loading-dot:nth-child(3) { animation-delay: 0.4s; }
        `}</style>
        <div className="flex items-center justify-center gap-3 py-12">
          <div className="flex gap-1">
            <div className="loading-dot w-2 h-2 rounded-full bg-emerald-400"></div>
            <div className="loading-dot w-2 h-2 rounded-full bg-emerald-400"></div>
            <div className="loading-dot w-2 h-2 rounded-full bg-emerald-400"></div>
          </div>
          <span className="text-sm text-slate-400">Checking Gmail...</span>
        </div>
      </div>
    );
  }

  if (status?.connected) {
    return (
      <div className={`${compact ? '' : 'mb-8'}`}>
        <style>{`
          @keyframes slideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); } 50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.6); } }
          .connected-panel { animation: slideIn 0.5s ease-out; }
          .check-icon { animation: pulse-glow 2s ease-in-out infinite; }
        `}</style>
        <div className="connected-panel relative overflow-hidden rounded-20 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-8 backdrop-blur-xl">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="check-icon w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-900 text-white mb-2">Gmail Connected</h2>
                <p className="text-sm text-slate-300 leading-relaxed">JobHuntBuddy is reading your emails automatically.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={disconnect}
              disabled={connecting}
              className="lg:w-fit flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 px-6 py-3 rounded-xl font-700 text-sm transition-all duration-300 disabled:opacity-50"
            >
              <Unplug className="w-4 h-4" />
              Disconnect
            </button>
          </div>
          {message && (
            <div className="mt-6 p-4 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
              <p className="text-sm text-emerald-200">{message}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${compact ? '' : 'mb-8'}`}>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .connect-panel { animation: slideUp 0.6s ease-out; }

        .benefit-item { animation: slideUp 0.6s ease-out backwards; }
        .benefit-item:nth-child(1) { animation-delay: 0.1s; }
        .benefit-item:nth-child(2) { animation-delay: 0.2s; }
        .benefit-item:nth-child(3) { animation-delay: 0.3s; }

        .primary-button {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: 1px solid rgba(16, 185, 129, 0.6);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .primary-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.4);
        }
        .primary-button:disabled { opacity: 0.6; cursor: not-allowed; }

        .input-field {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        .input-field:focus {
          outline: none;
          border-color: rgba(16, 185, 129, 0.6);
          background: rgba(16, 185, 129, 0.08);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }
        .input-field::placeholder { color: rgba(148, 163, 184, 0.5); }

        .message-box {
          animation: slideUp 0.4s ease-out;
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 13px;
          font-weight: 600;
        }
        .message-error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; }
        .message-success { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #86efac; }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 60;
          padding: 20px;
          animation: slideUp 0.3s ease-out;
        }

        .modal-content {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 20px;
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          padding: 32px;
          border-bottom: 1px solid rgba(16, 185, 129, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .modal-title {
          font-size: 24px;
          font-weight: 900;
          color: white;
        }

        .modal-close {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #34d399;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        .modal-close:hover {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.4);
        }

        .modal-body {
          padding: 32px;
        }

        .step-tracker {
          display: flex;
          justify-content: space-between;
          margin-bottom: 32px;
          gap: 8px;
        }

        .step-dot {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(16, 185, 129, 0.1);
          border: 2px solid rgba(16, 185, 129, 0.2);
          color: rgba(148, 163, 184, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .step-dot.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: rgba(16, 185, 129, 0.8);
          color: white;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
        }

        .step-dot.completed {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.4);
          color: #34d399;
        }

        .step-content {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          margin-bottom: 24px;
        }

        .step-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .step-title {
          font-size: 28px;
          font-weight: 900;
          color: white;
          margin-bottom: 12px;
        }

        .step-description {
          font-size: 14px;
          color: rgba(148, 163, 184, 0.8);
          margin-bottom: 16px;
        }

        .step-detail {
          font-size: 13px;
          color: rgba(148, 163, 184, 0.7);
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .step-hint {
          background: rgba(245, 158, 11, 0.1);
          border-left: 3px solid #f59e0b;
          padding: 12px;
          border-radius: 8px;
          color: #fcd34d;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .step-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
          padding: 12px 20px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
          font-size: 13px;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .step-action:hover {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.5);
          color: #6ee7b7;
        }

        .step-nav {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding-top: 24px;
          border-top: 1px solid rgba(16, 185, 129, 0.1);
        }

        .nav-button {
          flex: 1;
          padding: 12px 20px;
          border-radius: 10px;
          border: 1px solid rgba(16, 185, 129, 0.2);
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .nav-button:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.4);
        }
        .nav-button:disabled { opacity: 0.5; cursor: not-allowed; }

        .token-input-section {
          margin-top: 32px;
          padding-top: 32px;
          border-top: 1px solid rgba(16, 185, 129, 0.1);
        }

        .token-label {
          font-size: 14px;
          font-weight: 700;
          color: white;
          margin-bottom: 12px;
        }

.token-input-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.token-input-wrapper {
  flex: 1;
  position: relative;
}

        .code-inline {
          background: rgba(0, 0, 0, 0.3);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: #86efac;
        }
      `}</style>

      <div className="connect-panel">
        <div className="relative overflow-hidden rounded-20 border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 p-8 backdrop-blur-xl">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl"></div>

          <div className="relative">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                <Mail className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-900 text-white mb-2">Connect Gmail</h2>
                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                  One click to connect. JobHuntBuddy automatically reads your job application emails.
                </p>
              </div>
            </div>

            {/* <div className="grid sm:grid-cols-3 gap-3 mb-8">
              <div className="benefit-item flex items-start gap-3 p-3 rounded-12 bg-emerald-500/5 border border-emerald-500/15">
                <Zap className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-600 text-white text-sm">Auto-tracking</div>
                  <div className="text-xs text-slate-400 mt-1">Every email analyzed</div>
                </div>
              </div>
              <div className="benefit-item flex items-start gap-3 p-3 rounded-12 bg-emerald-500/5 border border-emerald-500/15">
                <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-600 text-white text-sm">Secure & Private</div>
                  <div className="text-xs text-slate-400 mt-1">Read-only access</div>
                </div>
              </div>
              <div className="benefit-item flex items-start gap-3 p-3 rounded-12 bg-emerald-500/5 border border-emerald-500/15">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-600 text-white text-sm">No Manual Work</div>
                  <div className="text-xs text-slate-400 mt-1">All automatic</div>
                </div>
              </div>
            </div> */}

            {clientId ? (
              <button
                type="button"
                onClick={connectWithGoogle}
                disabled={connecting || !googleReady}
                className="primary-button w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-700 text-sm text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : googleReady ? (
                  <>
                    <Mail className="w-4 h-4" />
                    Sign in with Google
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                )}
              </button>
            ) : (
              <div className="p-4 rounded-12 bg-amber-500/10 border border-amber-500/30 mb-4">
                <p className="text-sm text-amber-200">Add <span className="code-inline">VITE_GOOGLE_CLIENT_ID</span> or use manual token.</p>
              </div>
            )}

            {googleError && (
              <div className="message-box message-error mb-4">
                {googleError}
              </div>
            )}

            <button
              onClick={() => { setShowGuide(true); setCurrentStep(1); }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-700 text-sm border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300 hover:text-emerald-200 transition-all duration-300"
            >
              <BookOpen className="w-4 h-4" />
              Need Manual Token? See Interactive Guide
            </button>
            <div className="token-input-section mt-6">
  <p className="token-label">
    Or Paste Your Gmail Access Token
  </p>

  <div className="token-input-group">
    <div className="token-input-wrapper">
      <Lock
        className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none"
        style={{ position: 'absolute' }}
      />

      <input
        type="password"
        value={tokenInput}
        onChange={(e) => setTokenInput(e.target.value)}
        placeholder="ya29.a0AfH6SMBx..."
        className="input-field w-full pl-10"
      />
    </div>

    <button
      onClick={() => connectWithToken(tokenInput)}
      disabled={connecting || !tokenInput.trim()}
      className="primary-button flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-700 text-sm text-white"
    >
      {connecting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <CheckCircle2 className="w-4 h-4" />
          Connect Now
        </>
      )}
    </button>
  </div>
</div>

            {message && (
              <div className={`message-box mt-4 ${messageType === 'error' ? 'message-error' : messageType === 'success' ? 'message-success' : ''}`}>
                {messageType === 'success' && '✓ '}{message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Guide Modal */}
      {showGuide && (
        <div className="modal-overlay" onClick={() => setShowGuide(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Get Your Access Token</h2>
                <p className="text-sm text-slate-400 mt-2">Step {currentStep} of 8 • Takes ~2 minutes</p>
              </div>
              <button onClick={() => setShowGuide(false)} className="modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-body">
              {/* Step Tracker */}
              <div className="step-tracker">
                {steps.map((step) => (
                  <div
                    key={step.num}
                    onClick={() => setCurrentStep(step.num)}
                    className={`step-dot ${currentStep === step.num ? 'active' : currentStep > step.num ? 'completed' : ''}`}
                  >
                    {currentStep > step.num ? '✓' : step.num}
                  </div>
                ))}
              </div>

              {/* Current Step Content */}
              {steps.map((step) => {
                if (step.num !== currentStep) return null;
                return (
                  <div key={step.num}>
                    <div className="step-content">
                      <div className="step-icon">{step.icon}</div>
                      <h3 className="step-title">{step.title}</h3>
                      <p className="step-description">{step.description}</p>
                      <p className="step-detail">{step.detail}</p>
                      {step.hint && <div className="step-hint">💡 {step.hint}</div>}
                      {step.action && (
                        <a href={step.action.link} target="_blank" rel="noreferrer" className="step-action">
                          <ExternalLink className="w-4 h-4" />
                          {step.action.text}
                        </a>
                      )}
                    </div>

                    {/* Navigation */}
                    <div className="step-nav">
                      <button
                        disabled={currentStep === 1}
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="nav-button"
                      >
                        ← Previous
                      </button>
                      <button
                        disabled={currentStep === 8}
                        onClick={() => setCurrentStep(currentStep + 1)}
                        className="nav-button"
                      >
                        Next →
                      </button>
                    </div>
                    
                  </div>
                );
              })}
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}