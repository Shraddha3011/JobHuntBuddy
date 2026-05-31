import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardPaste, Save, WandSparkles, X, Check, AlertCircle, Sparkles, FileText, Mail, MapPin, DollarSign, Briefcase } from 'lucide-react';
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
  const [extractedData, setExtractedData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeSection, setActiveSection] = useState('paste');

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
    setIsExtracting(true);
    setTimeout(() => {
      const lines = rawPost
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const text = rawPost.toLowerCase();
      const url = rawPost.match(/https?:\/\/\S+/)?.[0] || '';
      const locationLine = lines.find((line) => /(remote|hybrid|onsite|bengaluru|bangalore|mumbai|pune|delhi|hyderabad|chennai)/i.test(line));
      const salaryLine = lines.find((line) => /(lpa|salary|ctc|₹|\$)/i.test(line));
      const requirementLines = lines.filter((line) => /(\breact\b|\bjava\b|\bspring\b|\bpython\b|\bsql\b|\baws\b|\bnode\b|\bexperience\b|\byears\b|\bskills\b)/i.test(line));

      const extracted = {
        jobTitle: lines[0] || '',
        companyName: lines[1] || '',
        jobUrl: url,
        location: locationLine || '',
        salaryRange: salaryLine || '',
        isRemote: text.includes('remote'),
        jobDescription: rawPost,
        keyRequirements: requirementLines.slice(0, 8).join('\n'),
        sourcePlatform: url.includes('linkedin') ? 'LINKEDIN' : 'OTHER',
      };

      setExtractedData(extracted);

      setForm((previous) => ({
        ...previous,
        jobTitle: previous.jobTitle || extracted.jobTitle,
        companyName: previous.companyName || extracted.companyName,
        jobUrl: previous.jobUrl || extracted.jobUrl,
        location: previous.location || extracted.location,
        salaryRange: previous.salaryRange || extracted.salaryRange,
        isRemote: previous.isRemote || extracted.isRemote,
        jobDescription: previous.jobDescription || extracted.jobDescription,
        keyRequirements: previous.keyRequirements || extracted.keyRequirements,
        sourcePlatform: extracted.sourcePlatform,
      }));

      setActiveSection('form');
      setIsExtracting(false);
    }, 800);
  };

  const getCompletionPercentage = () => {
    const required = ['companyName', 'jobTitle'];
    const filled = required.filter((key) => form[key]?.trim()).length;
    return Math.round((filled / required.length) * 100);
  };

  const getMemoryStats = () => {
    const stats = {
      jobTitle: !!form.jobTitle,
      company: !!form.companyName,
      jd: !!form.jobDescription,
      requirements: !!form.keyRequirements,
      location: !!form.location,
      salary: !!form.salaryRange,
      resume: !!form.resumeId,
    };
    return stats;
  };

  const memory = getMemoryStats();
  const memoryCount = Object.values(memory).filter(Boolean).length;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;600;700;800;900&display=swap');

        * {
          font-family: 'Urbanist', sans-serif;
        }
          .remote-text {
  color: white;
  font-weight: 600;
}
  .input option {
  background: white;
  color: black;
}

        h1, h2, h3, h4, h5, h6 {
          font-family: 'Urbanist', sans-serif;
        }

        @keyframes float-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
          }
          50% { 
            box-shadow: 0 0 40px rgba(16, 185, 129, 0.6);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes slide-in-left {
          0% {
            opacity: 0;
            transform: translateX(-30px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scale-pop {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .container {
          animation: float-up 0.6s ease-out;
        }

        .hero-section {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.08) 100%);
          border: 1px solid rgba(16, 185, 129, 0.25);
          backdrop-filter: blur(15px);
          border-radius: 24px;
          padding: 56px 48px;
          margin-bottom: 48px;
        }

        .hero-title {
          font-size: 48px;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.2;
        }

        .hero-subtitle {
          color: rgba(148, 163, 184, 0.85);
          font-size: 18px;
          margin-top: 24px;
          line-height: 1.7;
        }

        .gradient-accent {
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .paste-panel {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          transition: all 0.4s ease;
          animation: float-up 0.6s ease-out 0.1s backwards;
        }

        .paste-panel:hover {
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15);
        }

        .paste-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
        }

        .paste-header-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          border-radius: 14px;
          color: white;
        }

        .paste-header-icon svg {
          width: 28px;
          height: 28px;
        }

        .paste-header-title {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
        }

        .paste-header-subtitle {
          font-size: 15px;
          color: rgba(148, 163, 184, 0.7);
          margin-top: 4px;
        }

        .paste-textarea {
          width: 100%;
          height: 380px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 14px;
          padding: 20px;
          color: #ffffff;
          font-size: 16px;
          line-height: 1.7;
          resize: none;
          transition: all 0.3s ease;
          font-family: 'Urbanist', sans-serif;
        }

        .paste-textarea:focus {
          outline: none;
          border-color: rgba(16, 185, 129, 0.6);
          background: rgba(16, 185, 129, 0.08);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
        }

        .paste-textarea::placeholder {
          color: rgba(148, 163, 184, 0.5);
        }

        .extract-button {
          width: 100%;
          margin-top: 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: 1px solid rgba(16, 185, 129, 0.6);
          color: white;
          padding: 16px 28px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          position: relative;
          overflow: hidden;
        }

        .extract-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(16, 185, 129, 0.4);
          border-color: rgba(16, 185, 129, 1);
        }

        .extract-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .extract-button.loading {
          background: linear-gradient(90deg, rgba(16, 185, 129, 0.4), rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.4));
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }

        .extract-button svg {
          width: 18px;
          height: 18px;
        }

        .paste-hint {
          font-size: 14px;
          color: rgba(148, 163, 184, 0.6);
          margin-top: 16px;
          line-height: 1.7;
        }

        .form-panel {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 48px;
          animation: float-up 0.6s ease-out 0.2s backwards;
        }

        .form-title {
          font-size: 36px;
          font-weight: 900;
          color: #ffffff;
          margin-bottom: 12px;
        }

        .form-subtitle {
          font-size: 16px;
          color: rgba(148, 163, 184, 0.7);
          margin-bottom: 32px;
        }

        .memory-indicator {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 12px 20px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          color: #86efac;
          margin-bottom: 28px;
          animation: scale-pop 0.4s ease-out;
        }

        .memory-indicator-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #10b981;
          border-radius: 50%;
          color: white;
          font-size: 12px;
          font-weight: 700;
        }

        .form-section {
          margin-bottom: 40px;
          animation: slide-in-left 0.6s ease-out backwards;
        }

        .form-section:nth-child(1) { animation-delay: 0.3s; }
        .form-section:nth-child(2) { animation-delay: 0.4s; }
        .form-section:nth-child(3) { animation-delay: 0.5s; }
        .form-section:nth-child(4) { animation-delay: 0.6s; }
        .form-section:nth-child(5) { animation-delay: 0.7s; }
        .form-section:nth-child(6) { animation-delay: 0.8s; }
        .form-section:nth-child(7) { animation-delay: 0.9s; }
        .form-section:nth-child(8) { animation-delay: 1s; }

        .form-grid {
          display: grid;
          gap: 24px;
        }

        .form-grid.cols-2 {
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        }

        .form-grid.cols-3 {
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }

        .field {
          display: flex;
          flex-direction: column;
        }

        .field-label {
          font-size: 15px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .field-label svg {
          width: 18px;
          height: 18px;
        }

        .field-required {
          color: #ef4444;
        }

        .field-hint {
          font-size: 13px;
          color: rgba(148, 163, 184, 0.6);
          margin-top: 8px;
        }

        .input {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 12px;
          padding: 16px 18px;
          color: #ffffff;
          font-size: 16px;
          transition: all 0.3s ease;
          font-family: 'Urbanist', sans-serif;
          min-height: 48px;
        }

        .input:focus {
          outline: none;
          border-color: rgba(16, 185, 129, 0.6);
          background: rgba(16, 185, 129, 0.08);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
        }

        .input::placeholder {
          color: rgba(148, 163, 184, 0.5);
        }

        .textarea {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 12px;
          padding: 16px 18px;
          color: #ffffff;
          font-size: 16px;
          resize: vertical;
          min-height: 140px;
          transition: all 0.3s ease;
          font-family: 'Urbanist', sans-serif;
          line-height: 1.6;
        }

        .textarea:focus {
          outline: none;
          border-color: rgba(16, 185, 129, 0.6);
          background: rgba(16, 185, 129, 0.08);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
        }

        .textarea::placeholder {
          color: rgba(148, 163, 184, 0.5);
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 18px;
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          min-height: 48px;
        }

        .checkbox-group:hover {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.4);
        }

        .checkbox-group input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: #10b981;
          min-width: 20px;
        }

        .checkbox-group label {
          cursor: pointer;
          color: rgba(255, 255, 255, 0.95);
          font-size: 16px;
          font-weight: 500;
          flex: 1;
        }

        .memory-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          border: 1px solid;
          animation: scale-pop 0.3s ease-out;
        }

        .memory-pill svg {
          width: 16px;
          height: 16px;
        }

        .memory-pill-good {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.3);
          color: #86efac;
        }

        .memory-pill-missing {
          background: rgba(245, 158, 11, 0.15);
          border-color: rgba(245, 158, 11, 0.3);
          color: #fbbf24;
        }

        .memory-pills-group {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .form-actions {
          display: flex;
          gap: 16px;
          margin-top: 48px;
          padding-top: 40px;
          border-top: 1px solid rgba(16, 185, 129, 0.1);
          animation: float-up 0.6s ease-out 1.1s backwards;
        }

        .btn-save {
          flex: 1;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: 1px solid rgba(16, 185, 129, 0.6);
          color: white;
          padding: 18px 32px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
          min-height: 56px;
        }

        .btn-save:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(16, 185, 129, 0.4);
          border-color: rgba(16, 185, 129, 1);
        }

        .btn-save svg {
          width: 20px;
          height: 20px;
        }

        .btn-cancel {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.3);
          color: rgba(255, 255, 255, 0.85);
          padding: 18px 32px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
          min-height: 56px;
        }

        .btn-cancel:hover {
          border-color: rgba(148, 163, 184, 0.5);
          background: rgba(148, 163, 184, 0.08);
          color: rgba(255, 255, 255, 0.95);
        }

        .btn-cancel svg {
          width: 20px;
          height: 20px;
        }

        .data-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: rgba(148, 163, 184, 0.7);
          margin-top: 8px;
        }

        .data-indicator svg {
          width: 16px;
          height: 16px;
        }

        .data-indicator.filled {
          color: #86efac;
        }

        .extracted-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(16, 185, 129, 0.2);
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #86efac;
        }

        .main-container {
          padding: 24px;
          max-width: 100%;
        }

        @media (max-width: 1024px) {
          .hero-section {
            padding: 40px 32px;
          }

          .form-panel {
            padding: 36px;
          }

          .hero-title {
            font-size: 40px;
          }

          .form-title {
            font-size: 28px;
          }
        }

        @media (max-width: 768px) {
          .hero-section {
            padding: 32px 24px;
          }

          .form-panel,
          .paste-panel {
            padding: 28px;
          }

          .hero-title {
            font-size: 32px;
          }

          .form-title {
            font-size: 24px;
          }

          .form-grid.cols-2,
          .form-grid.cols-3 {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn-save,
          .btn-cancel {
            width: 100%;
          }
        }
      `}</style>

      <div className="relative z-10 min-h-screen w-full main-container">
     <div className="container max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="hero-section">
            <h1 className="hero-title">
              Capture Your <span className="gradient-accent">Dream Role</span>
            </h1>
            <p className="hero-subtitle">
              Paste a job posting and we'll intelligently extract the details. Keep everything you need to track your application journey in one place.
            </p>
          </div>

          {/* Two-Column Layout */}
          <div className="grid gap-12 xl:grid-cols-[450px_1fr] w-full">
            {/* Left: Paste Panel */}
            <div className="paste-panel">
              <div className="paste-header">
                <div className="paste-header-icon">
                  <ClipboardPaste />
                </div>
                <div>
                  <div className="paste-header-title">Smart Paste</div>
                  <div className="paste-header-subtitle">We'll extract the good stuff</div>
                </div>
              </div>

              <textarea
                value={rawPost}
                onChange={(event) => setRawPost(event.target.value)}
                placeholder="Paste a LinkedIn job post, email, job board link, or recruiter message. We'll pull out the company name, role, location, salary, and more."
                className="paste-textarea"
              />

              <button
                type="button"
                onClick={extractFromPost}
                disabled={!rawPost.trim() || isExtracting}
                className={`extract-button ${isExtracting ? 'loading' : ''}`}
              >
                {isExtracting ? (
                  <>
                    <Sparkles className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <WandSparkles />
                    Extract Details
                  </>
                )}
              </button>

              <p className="paste-hint">
                💡 Tip: Copy-paste from LinkedIn, emails, Naukri, job boards—we handle all formats. The more detail you paste, the better we extract.
              </p>
            </div>

            {/* Right: Form Panel */}
            <div className="form-panel">
              <div className="form-title">Application Details</div>
              <p className="form-subtitle">
                {memoryCount > 0 && (
                  <div className="memory-indicator">
                    <div className="memory-indicator-icon">✓</div>
                    {memoryCount} field{memoryCount !== 1 ? 's' : ''} captured
                  </div>
                )}
              </p>

              <form onSubmit={submit} className="space-y-0">
                {/* Section 1: Role & Company */}
                <div className="form-section">
                  <div className="form-grid cols-2">
                    <div className="field">
                      <label className="field-label">
                        <Briefcase />
                        Company <span className="field-required">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={form.companyName}
                        onChange={(event) => update('companyName', event.target.value)}
                        placeholder="Google, Microsoft, Startup..."
                        className="input"
                      />
                      {extractedData?.companyName && (
                        <div className="data-indicator filled">
                          <Check /> Auto-filled from paste
                        </div>
                      )}
                    </div>

                    <div className="field">
                      <label className="field-label">
                        <Briefcase />
                        Job Title <span className="field-required">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={form.jobTitle}
                        onChange={(event) => update('jobTitle', event.target.value)}
                        placeholder="Senior Backend Engineer..."
                        className="input"
                      />
                      {extractedData?.jobTitle && (
                        <div className="data-indicator filled">
                          <Check /> Auto-filled from paste
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Job Link & Platform */}
                <div className="form-section">
                  <div className="field">
                    <label className="field-label">Job Link (if available)</label>
                    <input
                      type="url"
                      value={form.jobUrl}
                      onChange={(event) => update('jobUrl', event.target.value)}
                      placeholder="https://linkedin.com/jobs/..."
                      className="input"
                    />
                    {extractedData?.jobUrl && (
                      <div className="data-indicator filled">
                        <Check /> Auto-filled from paste
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Platform, Status, Date */}
                <div className="form-section">
                  <div className="form-grid cols-3">
                    <div className="field">
                      <label className="field-label">Platform</label>
                      <select
                        value={form.sourcePlatform}
                        onChange={(event) => update('sourcePlatform', event.target.value)}
                        className="input"
                      >
                        {['LINKEDIN', 'NAUKRI', 'GLASSDOOR', 'INDEED', 'COMPANY_WEBSITE', 'REFERRAL', 'OTHER'].map((platform) => (
                          <option key={platform} value={platform}>
                            {platform === 'COMPANY_WEBSITE' ? 'Company Site' : platform.charAt(0) + platform.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label className="field-label">Status</label>
                      <select
                        value={form.status}
                        onChange={(event) => update('status', event.target.value)}
                        className="input"
                      >
                        {['APPLIED', 'OA', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED', 'WITHDRAWN'].map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label className="field-label">Applied Date</label>
                      <input
                        type="date"
                        value={form.appliedDate}
                        onChange={(event) => update('appliedDate', event.target.value)}
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Location & Salary */}
                <div className="form-section">
                  <div className="form-grid cols-3">
                    <div className="field">
                      <label className="field-label">
                        <MapPin />
                        Location
                      </label>
                      <input
                        type="text"
                        value={form.location}
                        onChange={(event) => update('location', event.target.value)}
                        placeholder="Bengaluru, Mumbai..."
                        className="input"
                      />
                      {extractedData?.location && (
                        <div className="data-indicator filled">
                          <Check /> From paste
                        </div>
                      )}
                    </div>

                    <div className="field">
                      <label className="field-label">
                        <DollarSign />
                        Salary Range
                      </label>
                      <input
                        type="text"
                        value={form.salaryRange}
                        onChange={(event) => update('salaryRange', event.target.value)}
                        placeholder="15-20 LPA, $100K-120K..."
                        className="input"
                      />
                      {extractedData?.salaryRange && (
                        <div className="data-indicator filled">
                          <Check /> From paste
                        </div>
                      )}
                    </div>

                    <div className="field" style={{ justifyContent: 'flex-end', }}>
                      <label className="checkbox-group">
                        <input
                          type="checkbox"
                          checked={form.isRemote}
                          onChange={(event) => update('isRemote', event.target.checked)}
                        />
                        <span className="remote-text">
  Remote Position
</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section 5: Resume */}
                <div className="form-section">
                  <div className="field">
                    <label className="field-label">
                      <FileText />
                      Which resume did you use?
                    </label>
<select
  value={form.resumeId}
  onChange={(event) => update('resumeId', event.target.value)}
  className="input"
>
                      <option value="">Choose a resume version...</option>
                      {resumes.map((resume) => (
                        <option key={resume.id} value={resume.id}>
                          {resume.name}
                        </option>
                      ))}
                    </select>
                    <div className="field-hint">Link your resume so you can reference it during interviews</div>
                  </div>
                </div>

                {/* Section 6: Job Description */}
                <div className="form-section">
                  <div className="field">
                    <label className="field-label">
                      <FileText />
                      Job Description
                    </label>
                    <textarea
                      value={form.jobDescription}
                      onChange={(event) => update('jobDescription', event.target.value)}
                      placeholder="Full job description goes here. Save it so you can revisit during interview prep."
                      className="textarea"
                    />
                    {memory.jd && (
                      <div className="memory-pills-group">
                        <div className="memory-pill memory-pill-good">
                          <Check />
                          JD saved
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 7: Key Requirements */}
                <div className="form-section">
                  <div className="field">
                    <label className="field-label">
                      <Sparkles />
                      Key Requirements
                    </label>
                    <textarea
                      value={form.keyRequirements}
                      onChange={(event) => update('keyRequirements', event.target.value)}
                      placeholder="Skills needed, years of experience, tech stack, must-haves. One per line."
                      className="textarea"
                    />
                    {memory.requirements && (
                      <div className="memory-pills-group">
                        <div className="memory-pill memory-pill-good">
                          <Check />
                          Requirements saved
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 8: Notes */}
                <div className="form-section">
                  <div className="field">
                    <label className="field-label">
                      <Mail />
                      Your Notes
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(event) => update('notes', event.target.value)}
                      placeholder="Referral contact name, recruiter email, follow-up reminders, anything you want to remember..."
                      className="textarea"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="form-actions">
                  <button type="submit" className="btn-save">
                    <Save />
                    Save Application
                  </button>
                  <button
                    type="button"
                    onClick={() => nav('/')}
                    className="btn-cancel"
                  >
                    <X />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}