import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Plus } from 'lucide-react';
import api from '../api/axios';

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', fileUrl: '' });

  const load = () => api.get('/resumes').then((r) => setResumes(r.data));

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    await api.post('/resumes', form);
    setForm({ name: '', description: '', fileUrl: '' });
    load();
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-950">Resume versions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Keep every tailored resume link searchable so callbacks never become guesswork.
        </p>
      </div>

      <form onSubmit={submit} className="mb-6 space-y-4 border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-cyan-700" />
          <h2 className="font-semibold text-slate-950">Add resume version</h2>
        </div>
        <input
          required
          placeholder="Backend Focus v3"
          className="input"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <input
          placeholder="Google Drive, Notion, or portfolio link"
          className="input"
          value={form.fileUrl}
          onChange={(event) => setForm({ ...form, fileUrl: event.target.value })}
        />
        <textarea
          placeholder="What changed in this version?"
          className="input resize-y"
          rows={3}
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <button className="bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
          Add resume
        </button>
      </form>

      <div className="grid gap-3 md:grid-cols-2">
        {resumes.map((resume) => (
          <div key={resume.id} className="border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-700" />
                  <p className="font-semibold text-slate-950">{resume.name}</p>
                </div>
                {resume.description && <p className="mt-2 text-sm leading-6 text-slate-500">{resume.description}</p>}
              </div>
              {resume.fileUrl && (
                <a href={resume.fileUrl} target="_blank" rel="noreferrer" className="shrink-0 text-cyan-700 hover:text-cyan-900">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        ))}
        {resumes.length === 0 && (
          <div className="border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 md:col-span-2">
            No resume versions yet.
          </div>
        )}
      </div>
    </div>
  );
}
