import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Plus, Trash2, Edit2, Copy, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import api from '../api/axios';

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', fileUrl: '' });
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const load = () => api.get('/resumes').then((r) => setResumes(r.data));

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFeedback({ type: 'error', message: 'Resume name is required' });
      return;
    }

    try {
      if (editingId) {
        await api.put(`/resumes/${editingId}`, form);
        setFeedback({ type: 'success', message: 'Resume updated successfully!' });
        setEditingId(null);
      } else {
        await api.post('/resumes', form);
        setFeedback({ type: 'success', message: 'Resume added successfully!' });
      }
      setForm({ name: '', description: '', fileUrl: '' });
      load();
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      setFeedback({ type: 'error', message: 'Something went wrong. Try again!' });
    }
  };

  const deleteResume = async (id) => {
    try {
      await api.delete(`/resumes/${id}`);
      setFeedback({ type: 'success', message: 'Resume deleted' });
      setDeleteConfirm(null);
      load();
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to delete resume' });
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const editResume = (resume) => {
    setForm(resume);
    setEditingId(resume.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', description: '', fileUrl: '' });
  };

  return (
<div className="container max-w-7xl mx-auto">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;600;700;800;900&display=swap');

        * {
          font-family: 'Urbanist', sans-serif;
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

        @keyframes slide-down {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
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

        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
          }
          50% { 
            box-shadow: 0 0 40px rgba(16, 185, 129, 0.6);
          }
        }

        .main-container {
          padding: 24px;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          animation: float-up 0.6s ease-out;
        }

        .header-content h1 {
          font-size: 40px;
          font-weight: 900;
          color: #ffffff;
          margin-bottom: 12px;
        }

        .header-content p {
          font-size: 16px;
          color: rgba(148, 163, 184, 0.8);
          line-height: 1.6;
        }

        .gradient-accent {
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .form-card {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          margin-bottom: 40px;
          animation: float-up 0.6s ease-out 0.1s backwards;
        }
.resume-layout {
  display: grid;
  grid-template-columns: 55% 45%;
  gap: 24px;
  align-items: start;
}

.form-card {
  position: sticky;
  top: 100px;
  margin-bottom: 0;
}

.resumes-grid {
  max-height: 80vh;
  overflow-y: auto;
  padding-right: 8px;
}
        .form-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }

        .form-header-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          border-radius: 14px;
          color: white;
        }

        .form-header-icon svg {
          width: 28px;
          height: 28px;
        }

        .form-header-title {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          font-size: 15px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 10px;
          display: block;
        }

        .form-input,
        .form-textarea {
          width: 100%;
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

        .form-textarea {
          resize: vertical;
          min-height: 120px;
          line-height: 1.6;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: rgba(16, 185, 129, 0.6);
          background: rgba(16, 185, 129, 0.08);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
          color: rgba(148, 163, 184, 0.5);
        }

        .form-hint {
          font-size: 13px;
          color: rgba(148, 163, 184, 0.6);
          margin-top: 8px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 32px;
        }

        .btn-primary {
          flex: 1;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: 1px solid rgba(16, 185, 129, 0.6);
          color: white;
          padding: 14px 24px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          min-height: 52px;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(16, 185, 129, 0.4);
          border-color: rgba(16, 185, 129, 1);
        }

        .btn-secondary {
          flex: 1;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.3);
          color: rgba(255, 255, 255, 0.85);
          padding: 14px 24px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          min-height: 52px;
        }

        .btn-secondary:hover {
          border-color: rgba(148, 163, 184, 0.5);
          background: rgba(148, 163, 184, 0.08);
          color: rgba(255, 255, 255, 0.95);
        }

        .btn-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(16, 185, 129, 0.1);
          color: #86efac;
        }

        .btn-icon:hover {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .btn-icon.danger {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
        }

        .btn-icon.danger:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #fecaca;
        }

        .btn-icon svg {
          width: 18px;
          height: 18px;
        }

        .resumes-grid {
          display: grid;
          gap: 24px;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          animation: float-up 0.6s ease-out 0.2s backwards;
        }

        .resume-card {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 28px;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: scale-pop 0.4s ease-out backwards;
        }

        .resume-card:nth-child(1) { animation-delay: 0.3s; }
        .resume-card:nth-child(2) { animation-delay: 0.35s; }
        .resume-card:nth-child(3) { animation-delay: 0.4s; }
        .resume-card:nth-child(4) { animation-delay: 0.45s; }
        .resume-card:nth-child(5) { animation-delay: 0.5s; }
        .resume-card:nth-child(6) { animation-delay: 0.55s; }

        .resume-card:hover {
          transform: translateY(-8px);
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.2);
        }

        .resume-card-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }

        .resume-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          border-radius: 10px;
          color: white;
          flex-shrink: 0;
        }

        .resume-icon svg {
          width: 20px;
          height: 20px;
        }

        .resume-title {
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 4px;
          word-break: break-word;
        }

        .resume-description {
          font-size: 14px;
          color: rgba(148, 163, 184, 0.7);
          line-height: 1.6;
          margin-bottom: 16px;
          min-height: 40px;
        }

        .resume-url {
          font-size: 13px;
          color: rgba(16, 185, 129, 0.8);
          word-break: break-all;
          margin-bottom: 16px;
          padding: 10px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 8px;
          border-left: 3px solid rgba(16, 185, 129, 0.4);
          font-family: monospace;
        }

        .resume-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .resume-meta {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(16, 185, 129, 0.1);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: rgba(148, 163, 184, 0.6);
        }

        .meta-item svg {
          width: 14px;
          height: 14px;
          color: rgba(16, 185, 129, 0.6);
        }

        .empty-state {
          grid-column: 1 / -1;
          border: 2px dashed rgba(16, 185, 129, 0.2);
          border-radius: 16px;
          padding: 60px 40px;
          text-align: center;
          animation: float-up 0.6s ease-out 0.2s backwards;
        }

        .empty-state-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 16px;
          margin: 0 auto 24px;
          color: rgba(16, 185, 129, 0.4);
        }

        .empty-state-icon svg {
          width: 36px;
          height: 36px;
        }

        .empty-state-text {
          font-size: 16px;
          color: rgba(148, 163, 184, 0.6);
          margin-bottom: 8px;
        }

        .empty-state-hint {
          font-size: 14px;
          color: rgba(148, 163, 184, 0.5);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          animation: float-up 0.3s ease-out;
        }

        .modal-content {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 16px;
          padding: 32px;
          max-width: 400px;
          width: 90%;
          animation: slide-down 0.3s ease-out;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 16px;
        }

        .modal-text {
          font-size: 15px;
          color: rgba(148, 163, 184, 0.8);
          margin-bottom: 28px;
          line-height: 1.6;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .modal-btn {
          flex: 1;
          padding: 12px 16px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          border: none;
          transition: all 0.3s ease;
          min-height: 44px;
        }

        .modal-btn-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border: 1px solid rgba(239, 68, 68, 0.6);
          color: white;
        }

        .modal-btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3);
        }

        .modal-btn-cancel {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.3);
          color: rgba(255, 255, 255, 0.85);
        }

        .modal-btn-cancel:hover {
          background: rgba(148, 163, 184, 0.08);
          border-color: rgba(148, 163, 184, 0.5);
        }

        .feedback {
          position: fixed;
          top: 24px;
          right: 24px;
          padding: 16px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 60;
          animation: slide-down 0.4s ease-out;
          backdrop-filter: blur(10px);
          border: 1px solid;
        }

        .feedback.success {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
          color: #86efac;
        }

        .feedback.error {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        .feedback svg {
          width: 18px;
          height: 18px;
        }

        @media (max-width: 768px) {
          .header-content h1 {
            font-size: 32px;
          }

          .form-card {
            padding: 28px;
          }

          .resumes-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .modal-content {
            width: 95%;
          }
        }
      `}</style>

      <div className="relative z-10 min-h-screen main-container">
        {/* Header */}
        <div className="header-top">
          <div className="header-content">
            <h1>
              Resume <span className="gradient-accent">Versions</span>
            </h1>
            <p>Keep every tailored version organized. Track which resume you sent to each company.</p>
          </div>
        </div>

        <div className="resume-layout">

        {/* Add/Edit Form */}
        <div className="form-card">
          <div className="form-header">
            <div className="form-header-icon">
              {editingId ? <Edit2 /> : <Plus />}
            </div>
            <h2 className="form-header-title">
              {editingId ? 'Edit Resume' : 'Add New Resume Version'}
            </h2>
          </div>

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Resume Name *</label>
              <input
                required
                type="text"
                placeholder="e.g., Backend Focus v3, AWS Specialist, Full-Stack"
                className="form-input"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
              <p className="form-hint">Give it a name you'll remember when applying</p>
            </div>

            <div className="form-group">
              <label className="form-label">Resume Link</label>
              <input
                type="url"
                placeholder="Google Drive, Notion, PDF link, or portfolio URL"
                className="form-input"
                value={form.fileUrl}
                onChange={(event) => setForm({ ...form, fileUrl: event.target.value })}
              />
              <p className="form-hint">Make sure the link is shareable</p>
            </div>

            <div className="form-group">
              <label className="form-label">What's Different?</label>
              <textarea
                placeholder="e.g., Added AWS projects, removed Flutter, emphasizing Java Spring Boot..."
                className="form-textarea"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
              <p className="form-hint">Notes to help you remember why this version exists</p>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                <CheckCircle />
                {editingId ? 'Save Changes' : 'Add Resume'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="btn-secondary">
                  <X />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Resumes Grid */}
        <div className="resumes-grid">
          {resumes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileText />
              </div>
              <p className="empty-state-text">No resume versions yet</p>
              <p className="empty-state-hint">Create tailored resumes for different roles and keep them here</p>
            </div>
          ) : (
            resumes.map((resume) => (
              <div key={resume.id} className="resume-card">
                <div className="resume-card-header">
                  <div className="resume-icon">
                    <FileText />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="resume-title">{resume.name}</p>
                  </div>
                </div>

                {resume.description && (
                  <p className="resume-description">{resume.description}</p>
                )}

                {resume.fileUrl && (
                  <div className="resume-url" title={resume.fileUrl}>
                    📎 {resume.fileUrl.substring(0, 50)}
                    {resume.fileUrl.length > 50 ? '...' : ''}
                  </div>
                )}

                <div className="resume-actions">
{resume.fileUrl && (
  <>
    <button
      onClick={() => copyToClipboard(resume.fileUrl, resume.id)}
      className="btn-icon"
      title="Copy link"
    >
      {copiedId === resume.id ? <CheckCircle /> : <Copy />}
    </button>

    <a
      href={resume.fileUrl}
      target="_blank"
      rel="noreferrer"
      className="btn-icon"
      title="Open link"
    >
      <ExternalLink />
    </a>
  </>
)}
                  <button
                    onClick={() => editResume(resume)}
                    className="btn-icon"
                    title="Edit resume"
                  >
                    <Edit2 />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(resume.id)}
                    className="btn-icon danger"
                    title="Delete resume"
                  >
                    <Trash2 />
                  </button>
                </div>

                <div className="resume-meta">
                  <div className="meta-item">
                    <Clock />
                    Created recently
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Delete This Resume?</h3>
            <p className="modal-text">
              You're about to delete this resume version. You can always add it back later.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => deleteResume(deleteConfirm)}
                className="modal-btn modal-btn-danger"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="modal-btn modal-btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div className={`feedback ${feedback.type}`}>
          {feedback.type === 'success' ? <CheckCircle /> : <AlertCircle />}
          {feedback.message}
        </div>
      )}
    </div>
  );
}