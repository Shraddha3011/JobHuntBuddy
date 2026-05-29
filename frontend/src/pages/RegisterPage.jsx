import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, Inbox, UserPlus } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

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
    <div className="story-shell grid min-h-screen place-items-center p-6">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_440px]">
        <section className="surface p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase text-teal-700">JobHuntBuddy</p>
              <p className="text-sm text-slate-500">Your job-search support system</p>
            </div>
          </div>

          <div className="mt-14">
            <h1 className="max-w-2xl text-5xl font-black leading-tight text-slate-950 lg:text-6xl">
              Stop carrying every application in your head.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Connect your inbox, save resume versions, and let your buddy build a timeline of what you applied to, when, and what happened next.
            </p>
          </div>

          <div className="mt-10 rounded-[2rem] border border-teal-100 bg-teal-50/80 p-6">
            <div className="flex items-start gap-4">
              <Inbox className="mt-1 h-6 w-6 text-teal-700" />
              <div>
                <p className="font-bold text-slate-900">Designed for tired applicants</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  No scary setup screens first. Start simple, then connect Coral sources when you are ready for automatic tracking.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="surface p-8">
          <p className="text-sm font-semibold uppercase text-teal-700">Create workspace</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Meet your buddy</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">A few seconds now saves hours of “which resume did I send?” later.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <input className="input" placeholder="Your name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input className="input" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input className="input" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button className="action-button w-full py-3">
              <UserPlus className="h-4 w-4" />
              Create workspace
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">
            Already have one? <Link to="/login" className="font-semibold text-teal-700">Sign in</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
