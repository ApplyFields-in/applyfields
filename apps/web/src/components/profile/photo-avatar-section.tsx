'use client';

import React, { useState } from 'react';
import {
  User,
  Camera,
  X,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type { UserProfile } from '@applyfields/types';
import { PixelAvatar, PIXEL_AVATARS } from '@/components/pixel-avatars';
import { apiPut } from '@/lib/api';
import { showAppToast } from '@/components/toast-notification-provider';

interface PhotoAvatarSectionProps {
  profile: UserProfile | null;
  onProfileUpdate: (updated: UserProfile) => void;
}

export function PhotoAvatarSection({
  profile,
  onProfileUpdate,
}: PhotoAvatarSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentAvatar = profile?.avatar_url || 'pixel-scholar';

  const handleSelectAvatar = async (avatarId: string) => {
    setSaving(true);
    setError(null);

    const res = await apiPut<UserProfile>('/me/profile', {
      avatar_url: avatarId,
    });
    setSaving(false);

    if (res.error || !res.data) {
      setError(res.error || 'Failed to update avatar.');
    } else {
      onProfileUpdate(res.data);
      setShowModal(false);
      showAppToast('Avatar updated successfully!');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-changed'));
      }
    }
  };

  return (
    <section id="photo-avatar-section" className="rounded-3xl border border-[#c4d2e3] bg-white p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <div className="size-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-1 flex items-center justify-center shadow-md">
              <PixelAvatar avatarId={currentAvatar} size={72} />
            </div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="absolute -bottom-1 -right-1 size-7 rounded-full bg-[#082046] text-white flex items-center justify-center shadow hover:bg-slate-800 transition-colors"
              title="Change Avatar"
            >
              <Camera className="size-3.5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Profile Avatar & Identification
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0E7BF4] border border-blue-200">
                Pixel Character
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Your candidate avatar is displayed on your candidate portfolio card and exam verification slips.
            </p>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Camera className="size-3.5" />
            <span>Choose Persona</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Persona Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-[#0E7BF4]" />
                <h3 className="text-base font-bold text-slate-900">
                  Select Your Pixel Persona
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-3">
              Choose an official ApplyFields scholar persona to represent your application profile.
            </p>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-1">
              {PIXEL_AVATARS.map((av) => {
                const isSelected = currentAvatar === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => handleSelectAvatar(av.id)}
                    disabled={saving}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                      isSelected
                        ? 'border-[#0E7BF4] bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <PixelAvatar avatarId={av.id} size={56} />
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">
                      {av.name}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-[#0E7BF4] flex items-center gap-0.5">
                        <Check className="size-3" /> Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
