import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import {
  LogIn,
  Mail,
  CheckCircle2,
  XCircle,
  Zap,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [scrollY, setScrollY] = useState(0);
const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.name);
      nav('/');
    } catch {
      setError('That sign-in did not work. Check the email and password once.');
      setIsLoading(false);
    }
  };

  const journeySteps = [
    { icon: '📧', label: 'Apply', color: '#06b6d4', desc: 'Send applications' },
    { icon: '⏳', label: 'Wait', color: '#f59e0b', desc: 'Hear back' },
    { icon: '✨', label: 'Track', color: '#8b5cf6', desc: 'Monitor progress' },
    { icon: '🎯', label: 'Win', color: '#10b981', desc: 'Get hired' },
  ];

  return (
<div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Urbanist:wght@400;600;700;800&display=swap');

        * {
          font-family: 'Urbanist', sans-serif;
        }

        h1, h2, h3 {
          font-family: 'Urbanist', sans-serif;
        }
body {
  background: linear-gradient(
    180deg,
    #000000 0%,
    #07130f 50%,
    #000000 100%
  );
  overflow-x: hidden;
}

        /* Animated background elements */
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(30px, -30px) rotate(90deg); }
          50% { transform: translate(0, -60px) rotate(180deg); }
          75% { transform: translate(-30px, -30px) rotate(270deg); }
        }

        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.4), 
                        inset 0 0 20px rgba(16, 185, 129, 0.1);
          }
          50% { 
            box-shadow: 0 0 50px rgba(16, 185, 129, 0.8), 
                        inset 0 0 30px rgba(16, 185, 129, 0.3);
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3) rotateX(-100deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotateX(0deg);
          }
        }

        @keyframes float-up {
          0% {
            opacity: 0;
            transform: translateY(40px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer-text {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

@keyframes rotate-border {
  0% { border-color: #10b981; }
  25% { border-color: #22c55e; }
  50% { border-color: #34d399; }
  75% { border-color: #6ee7b7; }
  100% { border-color: #10b981; }
}

        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(100px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
        }

        @keyframes flip-card {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }

        /* Glow orbs */
        .glow-orb {
          animation: drift 20s ease-in-out infinite;
          filter: blur(40px);
        }

        .glow-orb-1 {
          animation-delay: 0s;
        }

        .glow-orb-2 {
          animation-delay: 5s;
        }

        .glow-orb-3 {
          animation-delay: 10s;
        }

        /* Form inputs */
.smart-input {
  width: 100%;
  background: rgba(15, 23, 42, 0.7);
  border: 2px solid rgba(16, 185, 129, 0.25);
  color: #ffffff;
  padding: 18px 20px;
  border-radius: 14px;
  font-size: 18px;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
}

.smart-input::placeholder {
  color: rgba(255, 255, 255, 0.45);
  font-size: 17px;
}

.smart-input:hover {
  border-color: rgba(16, 185, 129, 0.5);
}

.smart-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow:
    0 0 0 3px rgba(16, 185, 129, 0.15),
    0 0 20px rgba(16, 185, 129, 0.25);
}

/* PASSWORD FIELD */
.password-input {
  font-size: 28px !important;
  font-family: sans-serif;
  // letter-spacing: 6px;
  padding-right: 55px;
}

/* When password is visible */
.password-input.show-password {
  font-size: 18px;
  // letter-spacing: normal;
}

/* Eye Button */
.password-wrapper {
  position: relative;
}

.eye-button {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #34d399;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eye-button:hover {
  color: #6ee7b7;
}

        /* Magic button */
.magic-button {
  background: linear-gradient(
    135deg,
    #10b981 0%,
    #059669 100%
  );
  border: 2px solid rgba(16, 185, 129, 0.6);
  color: white;
  padding: 14px 24px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
  width: 100%;
}

        .magic-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transition: left 0.6s;
          z-index: 1;
        }

        .magic-button:hover {
          transform: translateY(-4px);
          box-shadow: 0 30px 60px rgba(16, 185, 129, 0.5),
                      inset 0 0 20px rgba(255, 255, 255, 0.1);
          border-color: rgba(16, 185, 129, 1);
        }

        .magic-button:hover::before {
          left: 100%;
        }

        .magic-button:active {
          transform: translateY(-1px);
        }

        .magic-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .magic-button > * {
          position: relative;
          z-index: 2;
        }

        /* Journey card */
.journey-card {
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.12) 0%,
    rgba(5, 150, 105, 0.08) 100%
  );
  border: 2px solid rgba(16, 185, 129, 0.3);
  backdrop-filter: blur(15px);
  border-radius: 18px;
  padding: 24px;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

        .journey-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.5s ease;
        }

        .journey-card:hover {
          transform: translateY(-12px) scale(1.05);
          border-color: rgba(16, 185, 129, 0.8);
          box-shadow: 0 30px 60px rgba(16, 185, 129, 0.3);
        }

        .journey-card:hover::before {
          opacity: 1;
        }

        /* Logo glow */
        .logo-container {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          animation: float-up 0.8s ease-out;
        }
.logo-badge {
  width: 100px;
  height: 100px;
  // border-radius: 18px;
  // background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  backdrop-filter: blur(10px);
}

.logo-badge img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

        /* Glass morphism */
.glass-panel {
  // background: rgba(2, 6, 23, 0.95);
  border: 1px solid rgba(16,185,129,0.15);
  // box-shadow:
  //   0 20px 80px rgba(0,0,0,0.45);
}

        /* Journey visualization */
        .journey-timeline {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 16px;
          margin: 32px 0;
        }

        .timeline-item {
          text-align: center;
          position: relative;
          animation: bounce-in 0.6s ease-out;
        }

        .timeline-item:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 40px;
          left: 60%;
          width: 40%;
          height: 2px;
          background: linear-gradient(90deg, rgba(16, 185, 129, 0.5), transparent);
        }

        .timeline-icon {
          width: 70px;
          height: 70px;
          margin: 0 auto 12px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          background: rgba(16, 185, 129, 0.15);
          border: 2px solid rgba(16, 185, 129, 0.3);
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }

        .timeline-icon::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(16, 185, 129, 0.4), transparent);
          opacity: 0;
          transition: opacity 0.4s;
        }

        .timeline-item:hover .timeline-icon {
          transform: scale(1.15) rotate(10deg);
          border-color: rgba(16, 185, 129, 0.8);
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
        }

        .timeline-item:hover .timeline-icon::before {
          opacity: 1;
        }

        .timeline-label {
          font-weight: 700;
          color: rgba(16, 185, 129, 0.9);
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .timeline-desc {
          font-size: 12px;
          color: rgba(148, 163, 184, 0.7);
          margin-top: 6px;
        }

        /* Error message */
        .error-box {
          background: rgba(239, 68, 68, 0.15);
          border: 2px solid rgba(239, 68, 68, 0.4);
          color: #fca5a5;
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 14px;
          animation: float-up 0.4s ease-out;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        /* Link styling */
        .accent-link {
          color: rgba(16, 185, 129, 0.9);
          text-decoration: none;
          font-weight: 700;
          position: relative;
          transition: color 0.3s;
        }

        .accent-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #10b981, #22c55e);
          transition: width 0.3s ease;
        }

.accent-link:hover {
  color: #34d399;
}
        .accent-link:hover::after {
          width: 100%;
        }

        /* Stagger animations */
        .stagger {
          animation: float-up 0.8s ease-out backwards;
        }

        .stagger-1 { animation-delay: 0s; }
        .stagger-2 { animation-delay: 0.1s; }
        .stagger-3 { animation-delay: 0.2s; }
        .stagger-4 { animation-delay: 0.3s; }
        .stagger-5 { animation-delay: 0.4s; }
        .stagger-6 { animation-delay: 0.5s; }

        /* Gradient text */
.gradient-text {
  background: linear-gradient(
    135deg,
    #10b981 0%,
    #34d399 50%,
    #6ee7b7 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
        /* Loading spinner */
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Helper text */
        .helper-text {
          font-size: 12px;
          color: rgba(148, 163, 184, 0.6);
          margin-top: 8px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .journey-timeline {
            grid-template-columns: 1fr;
          }
          
          .timeline-item:not(:last-child)::after {
            display: none;
          }
        }
          /* FORCE EMERALD THEME */

.text-purple-300,
.text-purple-400,
.text-cyan-400 {
  color: #34d399 !important;
}

.bg-purple-500\/20 {
  background: rgba(16, 185, 129, 0.12) !important;
}

.border-purple-500\/20,
.border-purple-500\/30 {
  border-color: rgba(16, 185, 129, 0.25) !important;
}

.from-purple-500\/20 {
  --tw-gradient-from: rgba(16, 185, 129, 0.2) !important;
}
  .login-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      circle at top right,
      rgba(16,185,129,0.08),
      transparent 25%
    ),
    radial-gradient(
      circle at bottom left,
      rgba(16,185,129,0.05),
      transparent 25%
    ),
    #020617;
}
      `}</style>

      {/* Animated background orbs */}
      {/* <div className="relative min-h-screen w-full overflow-hidden bg-black">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500 glow-orb glow-orb-1"></div>
        <div className="absolute -bottom-32 -left-40 w-80 h-80 rounded-full bg-green-500 glow-orb glow-orb-2"></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 rounded-full bg-emerald-400 glow-orb glow-orb-3"></div>
      </div> */}

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-7xl">
     <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16">
            {/* Left: Story & Journey */}
            <div className="space-y-8">
              {/* Logo & Title */}
              <div className="logo-container stagger stagger-1">
<div className="logo-badge">
  <img
    src={logo}
    alt="JobHuntBuddy"
    className="w-full h-full object-contain"
  />
</div>
                <div>
<h1 className="text-4xl font-black text-white leading-tight">
  Job<span className="gradient-text">Hunt</span>Buddy
</h1>
                  <p className="text-sm text-slate-400 mt-1">
  Your AI companion for every application
</p>
                </div>
              </div>

              {/* Problem Statement */}
<h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
  Track Your Entire<br></br>
  <span className="text-emerald-400"> Job Hunt </span>
  In One Place
</h3>
              {/* The Journey (Self-explanatory visualization) */}
              <div className="stagger stagger-3">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">Your Journey</p>
                <div className="journey-timeline">
                  {journeySteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="timeline-item"
                      onMouseEnter={() => setHoverIndex(idx)}
                      onMouseLeave={() => setHoverIndex(null)}
                    >
                      <div className="timeline-icon">{step.icon}</div>
                      <div className="timeline-label">{step.label}</div>
                      <div className="timeline-desc">{step.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What Makes Us Different */}
              <div className="stagger stagger-4 glass-panel p-6">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">Why JobHuntBuddy?</p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-200"><strong>Reads your Gmail</strong> - Every application, rejection, offer automatically tracked</span>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-200"><strong>Tracks outcomes</strong> - Rejections, interviews, offers in one dashboard</span>
                  </div>
                  <div className="flex gap-3">
                    <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-200"><strong>Tells you what's next</strong> - Follow-ups, interviews, deadlines all clear</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Login Form */}
            <div className="glass-panel p-8 lg:p-10 stagger stagger-2 h-fit lg:sticky lg:top-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span className="text-xs font-semibold text-purple-300">Get Started</span>
                </div>
                <h2 className="text-4xl font-black text-white mb-2">Sign in</h2>
                <p className="text-sm text-slate-400">
                  Welcome back, seeker. Let's find your next opportunity.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                {/* Email Input */}
                <div className="stagger stagger-3">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="smart-input w-full"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                  <p className="helper-text">💡 Make sure it's the email you use for job hunting</p>
                </div>

                {/* Password Input */}
                <div className="stagger stagger-4">

<div className="password-wrapper">
<input
  type={showPassword ? "text" : "password"}
  placeholder="Password"
  className="smart-input w-full"
  style={{
    fontSize: showPassword ? "18px" : "18px",
    // letterSpacing: showPassword ? "normal" : "6px",
    paddingRight: "55px"
  }}
  value={form.password}
  onChange={(e) =>
    setForm({ ...form, password: e.target.value })
  }
/>

  <button
    type="button"
    className="eye-button"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  </button>
</div>
                  <p className="helper-text">🔒 Keep this safe</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="error-box stagger stagger-5">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="magic-button stagger stagger-5"
                >
                  {isLoading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Enter the Buddy Realm</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent"></div>
                <span className="text-xs text-slate-500 px-2">or</span>
                <div className="flex-1 h-px bg-gradient-to-l from-purple-500/20 to-transparent"></div>
              </div>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-slate-400 stagger stagger-6">
                New to the hunt?{' '}
                <Link to="/register" className="accent-link">
                  Create your space
                </Link>
              </p>

              {/* Footer Note */}
              <div className="mt-8 pt-6 border-t border-purple-500/20 stagger stagger-6">
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  🎯 <strong>This is real.</strong> We actually read your Gmail using industry-standard encryption. Your data stays yours. Always.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}