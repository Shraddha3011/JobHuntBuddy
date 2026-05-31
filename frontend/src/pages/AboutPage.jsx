import {
  Anchor,
  ArrowRight,
  Bot,
  Brain,
  Compass,
  DatabaseZap,
  ExternalLink,
  Inbox,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
  Mail,
  CheckCircle2,
  TrendingUp,
  Target,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const judgingSignals = [
  {
    icon: Anchor,
    title: 'Potential Impact',
    text: 'Job seekers lose track of applications because updates are scattered across Gmail, job boards, resumes, and notes. JobHuntBuddy turns that scattered trail into one calm command center.',
    color: '#10b981',
  },
  {
    icon: Sparkles,
    title: 'Creativity & Originality',
    text: 'Instead of asking users to maintain another tracker, the app listens to the tools they already use and rebuilds the job-search timeline from real signals.',
    color: '#34d399',
  },
  {
    icon: Brain,
    title: 'Learning & Growth',
    text: 'The project explores Coral as a new data layer, using SQL-style retrieval to make personal workflows searchable, explainable, and useful.',
    color: '#6ee7b7',
  },
  {
    icon: ShieldCheck,
    title: 'Technical Implementation',
    text: 'A Spring Boot backend, React frontend, Gmail intelligence, status inference, and Coral-powered source screens work together as a practical product flow.',
    color: '#10b981',
  },
  {
    icon: Compass,
    title: 'Aesthetics & UX',
    text: 'The interface is designed for a stressed applicant: quick filters, readable email previews, visible progress, and simple next actions.',
    color: '#34d399',
  },
  {
    icon: DatabaseZap,
    title: 'Best Use of Coral',
    text: 'Coral helps retrieve data through SQL-like source queries, opening the door to joins across Gmail, local applications, resumes, and company context.',
    color: '#6ee7b7',
  },
];

const productFlow = [
  { label: 'Gmail', detail: 'Acknowledgements, rejections, interviews, offers, hiring alerts', icon: Inbox, emoji: '📧' },
  { label: 'Coral', detail: 'Turns connected sources into queryable data', icon: DatabaseZap, emoji: '🪸' },
  { label: 'Agent', detail: 'Infers company, role, status, date, and recommended action', icon: Bot, emoji: '🤖' },
  { label: 'Tracker', detail: 'Shows the job-search story without manual spreadsheet pain', icon: Trophy, emoji: '🏆' },
];

const benefits = [
  { text: 'No more guessing which companies replied.', icon: '🎯' },
  { text: 'No more manual copy-paste from inbox to tracker.', icon: '✨' },
  { text: 'Fast category filters for hiring alerts, applications, assessments, interviews, offers, and rejections.', icon: '⚡' },
  { text: 'A reusable foundation for joining email, resume, company, and application data.', icon: '🔗' },
];

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function AboutPage() {
  const [activeFlow, setActiveFlow] = useState(null);
  const [sqlVisible, setSqlVisible] = useState(false);
  const sqlRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setSqlVisible(true);
    }, { threshold: 0.3 });
    if (sqlRef.current) observer.observe(sqlRef.current);
    return () => observer.disconnect();
  }, []);

  const sqlLines = [
    'SELECT company_name, job_title, status, applied_date',
    'FROM gmail_job_signals',
    'JOIN local_applications USING (company_name)',
    "WHERE status IN ('HIRING', 'OA', 'INTERVIEW')",
    'ORDER BY applied_date DESC;',
  ];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden" style={{ background: 'linear-gradient(180deg, #020617 0%, #07130f 50%, #020617 100%)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;600;700;800;900&display=swap');

        * { font-family: 'Urbanist', sans-serif; box-sizing: border-box; }

        @keyframes float-up {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(30px, -30px) rotate(90deg); }
          50% { transform: translate(0, -60px) rotate(180deg); }
          75% { transform: translate(-30px, -30px) rotate(270deg); }
        }
        @keyframes orbit-dot {
          0% { transform: rotate(0deg) translateX(90px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(90px) rotate(-360deg); }
        }
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.12); opacity: 0.8; }
        }
        @keyframes radar-sweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes type-in {
          0% { opacity: 0; transform: translateX(-8px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.5); }
          70% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }

        .gradient-text {
          background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .shimmer-text {
          background: linear-gradient(90deg, #10b981, #6ee7b7, #10b981, #34d399);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .glass-panel {
          background: rgba(2, 6, 23, 0.7);
          border: 1px solid rgba(16, 185, 129, 0.15);
          backdrop-filter: blur(20px);
          border-radius: 24px;
        }

        .glass-card {
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.2);
          backdrop-filter: blur(12px);
          border-radius: 18px;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .glass-card:hover {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.5);
          transform: translateY(-6px);
          box-shadow: 0 20px 50px rgba(16, 185, 129, 0.15);
        }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          animation: drift 20s ease-in-out infinite;
          pointer-events: none;
        }

        .flow-pipe {
          position: relative;
          transition: all 0.4s ease;
        }

        .flow-pipe:hover {
          transform: translateY(-8px) scale(1.04);
        }

        .flow-pipe.active {
          border-color: rgba(16, 185, 129, 0.8) !important;
          background: rgba(16, 185, 129, 0.15) !important;
          box-shadow: 0 0 40px rgba(16, 185, 129, 0.3);
        }

        .flow-connector {
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(16, 185, 129, 0.5);
          font-size: 20px;
        }

        .radar-container {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 0 auto;
        }

        .radar-ring {
          position: absolute;
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 50%;
          animation: pulse-ring 3s ease-in-out infinite;
        }

        .radar-ring-1 { inset: 0; animation-delay: 0s; }
        .radar-ring-2 { inset: 20px; animation-delay: 0.5s; }
        .radar-ring-3 { inset: 40px; animation-delay: 1s; }

        .radar-sweep {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(from 0deg, transparent 0%, rgba(16, 185, 129, 0.3) 30%, transparent 60%);
          animation: radar-sweep 4s linear infinite;
        }

        .radar-center {
          position: absolute;
          inset: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.6), rgba(16, 185, 129, 0.2));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(16, 185, 129, 0.6);
        }

        .orbit-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          margin-top: -6px;
          margin-left: -6px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
        }

        .orbit-1 { animation: orbit-dot 4s linear infinite; }
        .orbit-2 { animation: orbit-dot 6s linear infinite reverse; background: #34d399; box-shadow: 0 0 10px #34d399; }
        .orbit-3 { animation: orbit-dot 8s linear infinite; background: #6ee7b7; box-shadow: 0 0 10px #6ee7b7; }

        .stat-card {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 18px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          background: rgba(16, 185, 129, 0.15);
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(16, 185, 129, 0.2);
        }

        .sql-line {
          opacity: 0;
          animation: type-in 0.4s ease-out forwards;
        }

        .judging-card {
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 18px;
          padding: 20px;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: default;
          position: relative;
          overflow: hidden;
        }

        .judging-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.15), transparent 60%);
          opacity: 0;
          transition: opacity 0.4s;
        }

        .judging-card:hover {
          transform: translateY(-8px);
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 24px 60px rgba(16, 185, 129, 0.15);
        }

        .judging-card:hover::before { opacity: 1; }

        .stagger-1 { animation: float-up 0.8s ease-out 0s backwards; }
        .stagger-2 { animation: float-up 0.8s ease-out 0.1s backwards; }
        .stagger-3 { animation: float-up 0.8s ease-out 0.2s backwards; }
        .stagger-4 { animation: float-up 0.8s ease-out 0.3s backwards; }
        .stagger-5 { animation: float-up 0.8s ease-out 0.4s backwards; }
        .stagger-6 { animation: float-up 0.8s ease-out 0.5s backwards; }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.3s ease;
          cursor: pointer;
          text-decoration: none;
        }

        .action-btn-primary {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
        }

        .action-btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 40px rgba(16, 185, 129, 0.4);
        }

        .action-btn-secondary {
          background: transparent;
          color: #34d399;
          border: 2px solid rgba(16, 185, 129, 0.4);
        }

        .action-btn-secondary:hover {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.8);
          transform: translateY(-3px);
        }

        .pipeline-3d {
          perspective: 600px;
        }

        .pipeline-node {
          transform-style: preserve-3d;
          transition: transform 0.5s ease;
        }

        .pipeline-node:hover {
          transform: rotateY(10deg) rotateX(-5deg) scale(1.05);
        }

        .benefit-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px 16px;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.12);
          border-radius: 14px;
          transition: all 0.3s ease;
        }

        .benefit-row:hover {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.35);
          transform: translateX(6px);
        }

        .tag-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
      `}</style>

      {/* Background orbs */}
      <div className="glow-orb" style={{ width: 400, height: 400, top: -100, right: -100, background: 'rgba(16,185,129,0.06)', animationDelay: '0s' }} />
      <div className="glow-orb" style={{ width: 300, height: 300, bottom: 200, left: -80, background: 'rgba(16,185,129,0.04)', animationDelay: '7s' }} />
      <div className="glow-orb" style={{ width: 250, height: 250, top: '40%', right: '20%', background: 'rgba(52,211,153,0.04)', animationDelay: '14s' }} />

      <div className="relative z-10 px-4 sm:px-6 py-10 max-w-7xl mx-auto">

        {/* ─── HERO ─── */}
        <section className="mb-10">
          <div className="glass-panel p-8 lg:p-12 stagger-1">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
              <div>
                <div className="tag-badge mb-6" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399' }}>
                  <Sparkles className="w-3 h-3" />
                  Built for the Coral Hackathon
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-5">
                  Job<span className="gradient-text">Hunt</span>Buddy<br />
                  <span style={{ fontSize: '0.6em', fontWeight: 700, color: 'rgba(148,163,184,0.8)' }}>is a job-search memory layer</span>
                </h1>
                <p className="text-base leading-8 mb-8" style={{ color: 'rgba(148,163,184,0.8)', maxWidth: 520 }}>
                  Powered by everyday inbox signals — it turns Gmail job updates and Coral-retrieved data into an organized application timeline. Know what happened, what's pending, and what to do next.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href="https://www.linkedin.com/in/shraddha-jadhav-a9a762224" target="_blank" rel="noreferrer" className="action-btn action-btn-primary">
                    <ExternalLink className="w-4 h-4" />
                    Created by Shraddha Jadhav
                  </a>
                  <a href="#coral-story" className="action-btn action-btn-secondary">
                    See Coral Flow
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Radar visual */}
              <div className="flex flex-col items-center gap-6">
                <div className="radar-container">
                  <div className="radar-ring radar-ring-1" />
                  <div className="radar-ring radar-ring-2" />
                  <div className="radar-ring radar-ring-3" />
                  <div className="radar-sweep" />
                  <div className="radar-center">
                    <DatabaseZap className="w-6 h-6 text-white" />
                  </div>
                  <div className="orbit-dot orbit-1" />
                  <div className="orbit-dot orbit-2" />
                  <div className="orbit-dot orbit-3" />
                </div>
                <p className="text-center text-sm font-semibold" style={{ color: 'rgba(52,211,153,0.8)' }}>
                  From inbox noise → decision-ready signals
                </p>
                {/* Mini stats */}
                <div className="grid grid-cols-3 gap-3 w-full">
                  {[
                    { value: 100, suffix: '%', label: 'Auto-tracked' },
                    { value: 0, suffix: ' sheets', label: 'Manual work' },
                    { value: 1, suffix: ' place', label: 'Everything in' },
                  ].map((s, i) => (
                    <div key={i} className="stat-card">
                      <div className="text-lg font-black gradient-text">
                        <AnimatedCounter target={s.value} suffix={s.suffix} />
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'rgba(148,163,184,0.6)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── PRODUCT FLOW ─── */}
        <section id="coral-story" className="mb-10 stagger-2">
          <div className="mb-5 flex items-center gap-3">
            <span className="tag-badge" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
              <Zap className="w-3 h-3" /> How It Works
            </span>
          </div>
          <div className="pipeline-3d">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {productFlow.map(({ label, detail, icon: Icon, emoji }, index) => (
                <div key={label} className="pipeline-node">
                  <div
                    className={`flow-pipe glass-card p-5 cursor-pointer h-full ${activeFlow === index ? 'active' : ''}`}
                    onMouseEnter={() => setActiveFlow(index)}
                    onMouseLeave={() => setActiveFlow(null)}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="text-3xl mb-3">{emoji}</div>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <Icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-black text-white mb-2">{label}</h3>
                    <p className="text-sm leading-6" style={{ color: 'rgba(148,163,184,0.7)' }}>{detail}</p>
                    <div className="mt-3 text-xs font-bold" style={{ color: 'rgba(16,185,129,0.7)' }}>
                      Step {index + 1} of 4 →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── WHY IT MATTERS + JUDGING ─── */}
        <section className="mb-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] stagger-3">

          {/* Benefits */}
          <div className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Why It Matters</p>
                <h2 className="text-xl font-black text-white">A tracker that updates from reality</h2>
              </div>
            </div>
            <div className="space-y-3">
              {benefits.map((b, i) => (
                <div key={i} className="benefit-row" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="text-xl flex-shrink-0">{b.icon}</span>
                  <p className="text-sm leading-6" style={{ color: 'rgba(226,232,240,0.85)' }}>{b.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Judging signals */}
          <div className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <Trophy className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#10b981' }}>Judge Lens</p>
                <h2 className="text-xl font-black text-white">Built around the winning signals</h2>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {judgingSignals.map(({ icon: Icon, title, text, color }) => (
                <article key={title} className="judging-card">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <h3 className="font-black text-white text-sm mb-1">{title}</h3>
                  <p className="text-xs leading-5" style={{ color: 'rgba(148,163,184,0.7)' }}>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CORAL SQL PANEL ─── */}
        <section className="mb-10 glass-panel overflow-hidden stagger-4" ref={sqlRef}>
          <div className="grid lg:grid-cols-[0.65fr_1.35fr] items-center">
            <div className="p-8 lg:p-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#10b981' }}>The Pitch</p>
              <h2 className="text-3xl font-black text-white mb-4">
                Coral makes the job search <span className="shimmer-text">queryable.</span>
              </h2>
              <p className="text-sm leading-7" style={{ color: 'rgba(148,163,184,0.75)' }}>
                JobHuntBuddy uses that idea to transform passive inbox data into active career intelligence: what arrived, what changed, which stage it belongs to, and what deserves attention next.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                {[
                  { icon: Mail, text: 'Reads Gmail signals automatically' },
                  { icon: DatabaseZap, text: 'Joins data across multiple sources' },
                  { icon: TrendingUp, text: 'Surfaces actionable insights' },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm" style={{ color: 'rgba(226,232,240,0.8)' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 lg:p-8" style={{ borderLeft: '1px solid rgba(16,185,129,0.1)' }}>
              <div className="rounded-2xl overflow-hidden" style={{ background: '#0a0f1e', border: '1px solid rgba(16,185,129,0.2)' }}>
                {/* Window bar */}
                <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'rgba(16,185,129,0.06)', borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs font-mono" style={{ color: 'rgba(148,163,184,0.5)' }}>coral-query.sql</span>
                </div>
                {/* SQL */}
                <div className="p-5 font-mono text-sm leading-8">
                  {sqlLines.map((line, i) => {
                    const colors = ['#34d399', 'rgba(148,163,184,0.7)', 'rgba(148,163,184,0.7)', '#fbbf24', 'rgba(148,163,184,0.6)'];
                    return (
                      <div
                        key={i}
                        className="sql-line"
                        style={{
                          color: colors[i],
                          animationDelay: sqlVisible ? `${i * 0.18}s` : '99s',
                        }}
                      >
                        <span style={{ color: 'rgba(16,185,129,0.3)', marginRight: 12, userSelect: 'none', fontSize: 11 }}>{i + 1}</span>
                        {line}
                      </div>
                    );
                  })}
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(16,185,129,0.1)' }}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs" style={{ color: 'rgba(52,211,153,0.8)' }}>Query executed · 12 results returned</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── GRATITUDE ─── */}
        <section className="glass-panel p-6 lg:p-8 stagger-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#10b981' }}>Gratitude</p>
              <h2 className="text-2xl font-black text-white mb-2">Thank you, WeMakeDevs. 🙏</h2>
              <p className="text-sm leading-7 max-w-2xl" style={{ color: 'rgba(148,163,184,0.75)' }}>
                This project was built with appreciation for WeMakeDevs and the opportunity to learn, experiment, and turn a real job-search problem into a Coral-powered product.
              </p>
            </div>
            <a href="https://www.wemakedevs.org/" target="_blank" rel="noreferrer" className="action-btn action-btn-secondary shrink-0">
              Visit WeMakeDevs
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}