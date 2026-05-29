import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, LogIn, MailSearch, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.name);
      nav('/');
    } catch {
      setError('That sign-in did not work. Check the email and password once.');
    }
  };

  return (
    <div className="story-shell grid min-h-screen place-items-center p-6">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_440px]">
        <section className="surface overflow-hidden p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase text-teal-700">JobHuntBuddy</p>
              <p className="text-sm text-slate-500">A softer way to survive the job hunt</p>
            </div>
          </div>

          <div className="mt-16 max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
              <Sparkles className="h-4 w-4" />
              Built for people applying everywhere at once
            </div>
            <h1 className="text-5xl font-black leading-tight text-slate-950 lg:text-6xl">
              Let your inbox remember the job hunt for you.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              JobHuntBuddy reads application emails through Coral, finds what changed, and turns chaos into a clear next step.
            </p>
          </div>

          <div className="mt-12 grid gap-3 md:grid-cols-3">
            {['Auto-detect applications', 'Track rejections and interviews', 'Know what to do today'].map((text) => (
              <div key={text} className="rounded-3xl border border-slate-200 bg-white/70 p-4">
                <MailSearch className="mb-3 h-5 w-5 text-teal-700" />
                <p className="text-sm font-semibold text-slate-800">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="surface p-8">
          <p className="text-sm font-semibold uppercase text-teal-700">Welcome back</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Sign in</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Open your calm command center and see what your job search needs today.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <input className="input" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input className="input" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button className="action-button w-full py-3">
              <LogIn className="h-4 w-4" />
              Sign in
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">
            New here? <Link to="/register" className="font-semibold text-teal-700">Create your buddy workspace</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
