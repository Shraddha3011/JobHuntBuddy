import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartHandshake,
  Inbox,
  UserPlus,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
export default function RegisterPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token, data.name);
      nav('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try another email or password.');
    }
  };

  return (
<div className="relative min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900">
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
  height: 60px;
  background: rgba(15, 23, 42, 0.7);
  border: 2px solid rgba(16, 185, 129, 0.25);
  color: white;

  font-size: 18px;
  font-weight: 500;

  padding: 0 18px;
  border-radius: 14px;

  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.smart-input::placeholder {
  color: rgba(148, 163, 184, 0.7);
  font-size: 17px;
}

.smart-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
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
// .glass-panel {
//   background: rgba(2, 6, 23, 0.95);
//   border: 1px solid rgba(16,185,129,0.15);
//   box-shadow:
//     0 20px 80px rgba(0,0,0,0.45);
// }

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
  <div className="w-full max-w-7xl">
    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8">

      {/* LEFT SIDE */}
      <div className="space-y-8">

        <div className="logo-container">
          <div className="logo-badge">
            <img
              src={logo}
              alt="JobHuntBuddy"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <h1 className="text-4xl font-black text-white">
              Job<span className="gradient-text">Hunt</span>Buddy
            </h1>

            <p className="text-slate-400">
              Your AI companion for every application
            </p>
          </div>
        </div>

        <h2 className="text-4xl lg:text-5xl font-black text-white">
          Stop Carrying Every <br></br>
          <span className="text-emerald-400"> Application In </span>
          Your Head
        </h2>

        <div className="glass-panel p-6">
          <p className="text-emerald-400 font-semibold mb-3">
            Why JobHuntBuddy?
          </p>

          <ul className="space-y-3 text-slate-300">
            <li>✓ Track applications automatically</li>
            <li>✓ Manage multiple resume versions</li>
            <li>✓ Track interviews and offers</li>
            <li>✓ Never lose a follow-up email again</li>
          </ul>
        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="glass-panel p-8 lg:p-10">

        <div className="mb-8">
          <h2 className="text-4xl font-black text-white">
            Create Workspace
          </h2>

          <p className="text-slate-400 mt-2">
            Join JobHuntBuddy and organize your entire job search.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">

          <input
            className="smart-input w-full"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            className="smart-input w-full"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

<div className="relative">
  <input
    className="smart-input w-full pr-14"
    placeholder="Password"
    type={showPassword ? "text" : "password"}
    value={form.password}
    onChange={(e) =>
      setForm({ ...form, password: e.target.value })
    }
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition"
  >
    {showPassword ? (
      <EyeOff className="w-5 h-5" />
    ) : (
      <Eye className="w-5 h-5" />
    )}
  </button>
</div>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="magic-button"
          >
            <UserPlus className="w-5 h-5" />
            Create Workspace
          </button>

        </form>

        <p className="text-center text-slate-400 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="accent-link"
          >
            Sign In
          </Link>
        </p>

      </div>

    </div>
  </div>
</div>
  );
}
