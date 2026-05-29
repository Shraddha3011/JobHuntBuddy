import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardPaste, Save, WandSparkles, X } from 'lucide-react';
import api from '../api/axios';

const initialForm = {
  companyName: '',
  jobTitle: '',
  jobUrl: '',
  sourcePlatform: 'LINKEDIN',
  status: 'APPLIED',
  resumeId: '',
  jobDescription: '',
  keyRequirements: '',
  salaryRange: '',
  location: '',
  isRemote: false,
  appliedDate: new Date().toISOString().split('T')[0],
  notes: '',
};

export default function AddApplicationPage() {
  const nav = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [rawPost, setRawPost] = useState('');
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    api.get('/resumes').then((r) => setResumes(r.data));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    await api.post('/applications', { ...form, resumeId: form.resumeId || null });
    nav('/');
  };

  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  const extractFromPost = () => {
    const lines = rawPost
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const text = rawPost.toLowerCase();
    const url = rawPost.match(/https?:\/\/\S+/)?.[0] || '';
    const locationLine = lines.find((line) => /(remote|hybrid|onsite|bengaluru|bangalore|mumbai|pune|delhi|hyderabad|chennai)/i.test(line));
    const salaryLine = lines.find((line) => /(lpa|salary|ctc|₹|\$)/i.test(line));
    const requirementLines = lines.filter((line) => /(\breact\b|\bjava\b|\bspring\b|\bpython\b|\bsql\b|\baws\b|\bnode\b|\bexperience\b|\byears\b|\bskills\b)/i.test(line));

    setForm((previous) => ({
      ...previous,
      jobTitle: previous.jobTitle || lines[0] || '',
      companyName: previous.companyName || lines[1] || '',
      jobUrl: previous.jobUrl || url,
      location: previous.location || locationLine || '',
      salaryRange: previous.salaryRange || salaryLine || '',
      isRemote: previous.isRemote || text.includes('remote'),
      jobDescription: previous.jobDescription || rawPost,
      keyRequirements: previous.keyRequirements || requirementLines.slice(0, 8).join('\n'),
      sourcePlatform: url.includes('linkedin') ? 'LINKEDIN' : previous.sourcePlatform,
    }));
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-950">Log a new application</h1>
        <p className="mt-1 text-sm text-slate-500">
          Capture the exact resume, job description, and requirements at the moment you apply.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardPaste className="h-5 w-5 text-cyan-700" />
            <h2 className="font-semibold text-slate-950">Quick paste</h2>
          </div>
          <textarea
            value={rawPost}
            onChange={(event) => setRawPost(event.target.value)}
            rows={14}
            placeholder="Paste a LinkedIn post, job page snippet, email, or recruiter message."
            className="w-full resize-none border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-600"
          />
          <button
            type="button"
            onClick={extractFromPost}
            disabled={!rawPost.trim()}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <WandSparkles className="h-4 w-4" />
            Prefill from paste
          </button>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            This hackathon-friendly flow shows the personal agent remembering what applicants usually forget later.
          </p>
        </aside>

        <form onSubmit={submit} className="space-y-5 border border-slate-200 bg-white p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Company" required>
              <input required value={form.companyName} onChange={(event) => update('companyName', event.target.value)} className="input" placeholder="Google" />
            </Field>
            <Field label="Job title" required>
              <input required value={form.jobTitle} onChange={(event) => update('jobTitle', event.target.value)} className="input" placeholder="Frontend Engineer" />
            </Field>
          </div>

          <Field label="Job link">
            <input value={form.jobUrl} onChange={(event) => update('jobUrl', event.target.value)} className="input" placeholder="https://..." />
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Platform">
              <select value={form.sourcePlatform} onChange={(event) => update('sourcePlatform', event.target.value)} className="input">
                {['LINKEDIN', 'NAUKRI', 'GLASSDOOR', 'INDEED', 'COMPANY_WEBSITE', 'REFERRAL', 'OTHER'].map((platform) => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(event) => update('status', event.target.value)} className="input">
                {['APPLIED', 'OA', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED', 'WITHDRAWN'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </Field>
            <Field label="Applied date">
              <input type="date" value={form.appliedDate} onChange={(event) => update('appliedDate', event.target.value)} className="input" />
            </Field>
          </div>

          <Field label="Resume used">
            <select value={form.resumeId} onChange={(event) => update('resumeId', event.target.value)} className="input">
              <option value="">No specific resume yet</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>{resume.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Location">
              <input value={form.location} onChange={(event) => update('location', event.target.value)} className="input" placeholder="Bengaluru" />
            </Field>
            <Field label="Salary range">
              <input value={form.salaryRange} onChange={(event) => update('salaryRange', event.target.value)} className="input" placeholder="15-20 LPA" />
            </Field>
            <label className="flex items-center gap-2 pt-7 text-sm text-slate-600">
              <input type="checkbox" checked={form.isRemote} onChange={(event) => update('isRemote', event.target.checked)} className="h-4 w-4" />
              Remote position
            </label>
          </div>

          <Field label="Job description">
            <textarea rows={6} value={form.jobDescription} onChange={(event) => update('jobDescription', event.target.value)} className="input resize-y" placeholder="Paste the full JD for future interview prep." />
          </Field>

          <Field label="Key requirements">
            <textarea rows={4} value={form.keyRequirements} onChange={(event) => update('keyRequirements', event.target.value)} className="input resize-y" placeholder="Skills, years of experience, tools, must-haves." />
          </Field>

          <Field label="Notes">
            <textarea rows={3} value={form.notes} onChange={(event) => update('notes', event.target.value)} className="input resize-y" placeholder="Referral name, recruiter details, follow-up reminders." />
          </Field>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              <Save className="h-4 w-4" />
              Save application
            </button>
            <button type="button" onClick={() => nav('/')} className="inline-flex items-center justify-center gap-2 border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
