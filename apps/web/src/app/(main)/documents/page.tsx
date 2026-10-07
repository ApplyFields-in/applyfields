'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Badge, Card } from '@applyfields/ui';
import { apiGet, apiPost, apiDelete, API_URL } from '@/lib/api';
import { convertFileToBase64 } from '@/lib/resume-parser';
import type { ResumeApiResponse, UserResumeDocument } from '@applyfields/types';
import {
  Download,
  FileCheck2,
  FileText,
  FolderLock,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';

export default function DocumentsPage() {
  const [resume, setResume] = useState<UserResumeDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchDocuments() {
      setLoading(true);
      const res = await apiGet<{ resume: UserResumeDocument | null }>('/me/resume');
      if (res?.resume) {
        setResume(res.resume);
      }
      setLoading(false);
    }
    fetchDocuments();
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setMessage(null);

    try {
      const fileBase64 = await convertFileToBase64(file);
      const res = await apiPost<ResumeApiResponse>('/me/resume', {
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        fileBase64,
      });

      if (res.error || !res.data?.success) {
        throw new Error(res.error || 'Failed to save document');
      }

      setResume(res.data.resume);
      setMessage('Resume successfully uploaded, securely stored, and synced with your account!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  }

  async function handleDownload() {
    if (!resume) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(`${API_URL}/me/resume/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resume.file_name || 'Resume.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Could not download file.');
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to remove your saved resume?')) return;
    setIsUploading(true);
    try {
      await apiDelete('/me/resume');
      setResume(null);
      setMessage('Resume removed successfully.');
    } catch {
      setError('Could not remove document.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="grid size-8 place-items-center rounded-xl bg-tea/40 text-sea border border-line">
              <FolderLock className="size-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-teal/70">
              Citizen Document Locker
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-teal">My Saved Documents</h1>
          <p className="text-xs sm:text-sm text-teal/75 mt-1">
            Store and manage your verified certificates, resume, and eligibility documents in one secure vault.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx,.text,image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-10 px-4 rounded-xl bg-teal text-cream font-black text-xs flex items-center gap-2 border-b-2 border-teal/70 shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all disabled:opacity-60"
          >
            <UploadCloud className="size-4" />
            {isUploading ? 'Saving...' : 'Upload Document'}
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-celadon/30 border border-celadon text-teal font-bold text-xs flex items-center gap-2">
          <ShieldCheck className="size-4 text-sea" /> {message}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-coral/15 border border-coral/40 text-coral font-bold text-xs">
          {error}
        </div>
      )}

      {/* Active Resume Card */}
      <div className="space-y-3">
        <h2 className="text-base font-black text-teal flex items-center gap-2">
          <FileText className="size-4 text-sea" /> Primary Resume / Curriculum Vitae
        </h2>

        {loading ? (
          <Card className="p-8 border-2 border-line bg-cream rounded-3xl text-center text-xs text-teal/60 font-bold">
            Checking document vault...
          </Card>
        ) : resume ? (
          <Card className="p-5 sm:p-6 border-2 border-sea/30 bg-cream rounded-3xl shadow-[0_12px_24px_-8px_rgba(2,128,144,0.12),0_3px_0_0_#028090]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid size-14 place-items-center rounded-2xl bg-sea text-cream shadow-xs shrink-0">
                  <FileCheck2 className="size-7 text-cream" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-teal">
                      {resume.file_name || 'Resume.pdf'}
                    </h3>
                    <Badge tone="celadon" className="text-[10px] font-black uppercase">
                      Active On Profile
                    </Badge>
                  </div>
                  <p className="text-xs text-teal/70 mt-1">
                    {resume.size_bytes ? `${Math.round(resume.size_bytes / 1024)} KB • ` : ''}
                    Uploaded on {new Date(resume.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-[11px] font-bold text-sea mt-0.5">
                    ✓ Educational qualifications extracted & synced with your account
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="h-9 px-4 rounded-xl bg-teal text-cream font-bold text-xs flex items-center gap-1.5 hover:bg-teal/90 active:translate-y-0.5 transition-all shadow-xs"
                >
                  <Download className="size-3.5" /> Download
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="h-9 px-3.5 rounded-xl bg-canvas border border-line text-teal font-bold text-xs flex items-center gap-1.5 hover:bg-tea/30 active:translate-y-0.5 transition-all disabled:opacity-60"
                >
                  <RefreshCw className={`size-3.5 ${isUploading ? 'animate-spin' : ''}`} />
                  {isUploading ? 'Updating...' : 'Change Resume'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isUploading}
                  className="h-9 px-3 rounded-xl border border-coral/30 text-coral hover:bg-coral/10 font-bold text-xs flex items-center gap-1.5 active:translate-y-0.5 transition-all"
                  title="Remove saved resume"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-line/60 flex items-center justify-between text-xs">
              <span className="text-teal/70">
                To review or import extracted qualifications, visit your Profile.
              </span>
              <Link
                href="/profile"
                className="font-black text-sea hover:text-teal underline flex items-center gap-1"
              >
                Go to Profile <GraduationCap className="size-3.5" />
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="p-8 border-2 border-line bg-cream rounded-3xl text-center space-y-3">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-tea/40 border border-line">
              <FileText className="size-7 text-sea" />
            </div>
            <div>
              <h3 className="text-base font-bold text-teal">No Resume Uploaded Yet</h3>
              <p className="text-xs text-teal/70 max-w-md mx-auto mt-1">
                Upload your resume (.pdf or .txt) to automatically extract your qualifications and keep your resume safely saved on your account.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-5 rounded-xl bg-sea text-cream font-black text-xs inline-flex items-center gap-2 border-b-2 border-sea/80 shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
            >
              <UploadCloud className="size-4" /> Upload Resume
            </button>
          </Card>
        )}
      </div>

      {/* DigiLocker & Government Document Locker Preview */}
      <Card className="p-6 border-2 border-line bg-canvas rounded-3xl space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-sea" />
          <h3 className="text-sm font-black text-teal">Government & DigiLocker Readiness</h3>
        </div>
        <p className="text-xs text-teal/70">
          Your saved documents are encrypted and kept strictly private. ApplyFields only checks qualifications to match you with recruitment and scholarship eligibility criteria.
        </p>
      </Card>
    </div>
  );
}
