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
} from 'lucide-react';

const judgingSignals = [
  {
    icon: Anchor,
    title: 'Potential Impact',
    text: 'Job seekers lose track of applications because updates are scattered across Gmail, job boards, resumes, and notes. JobHuntBuddy turns that scattered trail into one calm command center.',
  },
  {
    icon: Sparkles,
    title: 'Creativity & Originality',
    text: 'Instead of asking users to maintain another tracker, the app listens to the tools they already use and rebuilds the job-search timeline from real signals.',
  },
  {
    icon: Brain,
    title: 'Learning & Growth',
    text: 'The project explores Coral as a new data layer, using SQL-style retrieval to make personal workflows searchable, explainable, and useful.',
  },
  {
    icon: ShieldCheck,
    title: 'Technical Implementation',
    text: 'A Spring Boot backend, React frontend, Gmail intelligence, status inference, and Coral-powered source screens work together as a practical product flow.',
  },
  {
    icon: Compass,
    title: 'Aesthetics & UX',
    text: 'The interface is designed for a stressed applicant: quick filters, readable email previews, visible progress, and simple next actions.',
  },
  {
    icon: DatabaseZap,
    title: 'Best Use of Coral',
    text: 'Coral helps retrieve data through SQL-like source queries, opening the door to joins across Gmail, local applications, resumes, and company context.',
  },
];

const productFlow = [
  { label: 'Gmail', detail: 'Acknowledgements, rejections, interviews, offers, hiring alerts', icon: Inbox },
  { label: 'Coral', detail: 'Turns connected sources into queryable data', icon: DatabaseZap },
  { label: 'Agent', detail: 'Infers company, role, status, date, and recommended action', icon: Bot },
  { label: 'Tracker', detail: 'Shows the job-search story without manual spreadsheet pain', icon: Trophy },
];

const benefits = [
  'No more guessing which companies replied.',
  'No more manual copy-paste from inbox to tracker.',
  'Fast category filters for hiring alerts, applications, assessments, interviews, offers, and rejections.',
  'A reusable foundation for joining email, resume, company, and application data.',
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(90deg,rgba(20,184,166,0.18),rgba(14,165,233,0.14),rgba(245,158,11,0.14))]" />

      <section className="relative mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <div className="surface overflow-hidden p-8">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800">
              <Sparkles className="h-4 w-4" />
              Built for the Coral hackathon
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-tight text-slate-950">
              JobHuntBuddy is a job-search memory layer powered by everyday inbox signals.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              It helps applicants understand what happened, what is pending, and what to do next by turning Gmail job updates and Coral-retrieved data into an organized application timeline.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://www.linkedin.com/in/shraddha-jadhav-a9a762224"
                target="_blank"
                rel="noreferrer"
                className="action-button"
              >
                <ExternalLink className="h-4 w-4" />
                Created by Shraddha Jadhav
                <ExternalLink className="h-4 w-4" />
              </a>
              <a href="#coral-story" className="secondary-button">
                See Coral flow
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="surface relative overflow-hidden p-6">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#14b8a6,#0ea5e9,#f59e0b)]" />
            <div className="about-radar mx-auto mt-2">
              <div className="about-radar-ring about-radar-ring-one" />
              <div className="about-radar-ring about-radar-ring-two" />
              <div className="about-radar-sweep" />
              <div className="about-radar-core">
                <DatabaseZap className="h-10 w-10 text-white" />
              </div>
              {['Gmail', 'SQL', 'Agent', 'Tracker'].map((item, index) => (
                <span key={item} className={`about-radar-dot about-radar-dot-${index + 1}`}>
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-6 text-center">
              <h2 className="text-xl font-black text-slate-950">From inbox noise to decision-ready signals</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                The product feels simple because the heavy lifting happens behind the scenes: source retrieval, classification, deduping, and timeline building.
              </p>
            </div>
          </div>
        </div>

        <section id="coral-story" className="mt-8 grid gap-4 lg:grid-cols-4">
          {productFlow.map(({ label, detail, icon: Icon }, index) => (
            <div key={label} className="about-flow-card soft-panel p-5" style={{ animationDelay: `${index * 90}ms` }}>
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-950">{label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="surface p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-amber-700">Why it matters</p>
                <h2 className="text-2xl font-black text-slate-950">A tracker that updates from reality</h2>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
                  <p className="text-sm leading-6 text-slate-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-teal-700">Judge lens</p>
                <h2 className="text-2xl font-black text-slate-950">Built around the winning signals</h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {judgingSignals.map(({ icon: Icon, title, text }) => (
                <article key={title} className="group rounded-2xl border border-slate-200 bg-white/80 p-4 transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <Icon className="mb-3 h-5 w-5 text-teal-700 transition group-hover:scale-110" />
                  <h3 className="font-black text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="my-8 surface overflow-hidden p-6">
          <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase text-teal-700">The pitch</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Coral makes the job search queryable.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                JobHuntBuddy uses that idea to transform passive inbox data into active career intelligence: what arrived, what changed, which stage it belongs to, and what deserves attention next.
              </p>
            </div>
            <div className="about-query-panel rounded-3xl border border-slate-900 bg-slate-950 p-5 text-sm text-slate-200 shadow-2xl">
              <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-2">coral-query.sql</span>
              </div>
              <pre className="overflow-auto whitespace-pre-wrap leading-7">
{`SELECT company_name, job_title, status, applied_date
FROM gmail_job_signals
JOIN local_applications USING (company_name)
WHERE status IN ('HIRING', 'OA', 'INTERVIEW')
ORDER BY applied_date DESC;`}
              </pre>
            </div>
          </div>
        </section>

        <section className="mb-8 surface p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-teal-700">Gratitude</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Thank you, WeMakeDevs.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                This project was built with appreciation for WeMakeDevs and the opportunity to learn, experiment, and turn a real job-search problem into a Coral-powered product.
              </p>
            </div>
            <a
              href="https://www.wemakedevs.org/"
              target="_blank"
              rel="noreferrer"
              className="secondary-button shrink-0"
            >
              Visit WeMakeDevs
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </section>
      </section>
    </div>
  );
}
