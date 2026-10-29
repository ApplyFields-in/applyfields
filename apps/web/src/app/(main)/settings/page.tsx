'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Globe,
  Bell,
  Palette,
  Filter,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  SunMedium,
  Moon,
  Eye,
  Type,
  Sliders,
  Mail,
  Smartphone,
  MessageSquare,
  ShieldAlert,
  RotateCcw,
  Save,
  Compass,
  FileCheck2,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/i18n/translations';
import { showAppToast } from '@/components/toast-notification-provider';

type SettingsTab = 'language' | 'notifications' | 'display' | 'preferences';
type ReadingTheme = 'default' | 'sepia' | 'high-contrast';
type TextScale = 'normal' | 'medium' | 'large';
type DensityMode = 'comfortable' | 'compact';
type AlertFrequency = 'instant' | 'daily' | 'weekly';

const STATE_OPTIONS = [
  { code: 'ALL', name: 'All India & Central' },
  { code: 'TG', name: 'Telangana (తెలంగాణ)' },
  { code: 'AP', name: 'Andhra Pradesh (ఆంధ్రప్రదేశ్)' },
  { code: 'KA', name: 'Karnataka (ಕರ್ನಾಟಕ)' },
  { code: 'MH', name: 'Maharashtra (महाराष्ट्र)' },
  { code: 'TN', name: 'Tamil Nadu (தமிழ்நாடு)' },
  { code: 'DL', name: 'Delhi (NCR)' },
  { code: 'UP', name: 'Uttar Pradesh (उत्तर प्रदेश)' },
  { code: 'BR', name: 'Bihar (बिहार)' },
  { code: 'RJ', name: 'Rajasthan (राजस्थान)' },
  { code: 'MP', name: 'Madhya Pradesh (मध्य प्रदेश)' },
  { code: 'WB', name: 'West Bengal (পশ্চিমবঙ্গ)' },
];

const QUALIFICATION_OPTIONS = [
  { id: '10th', label: '10th / Secondary School' },
  { id: '12th', label: '12th / Intermediate / PUC' },
  { id: 'diploma', label: 'Polytechnic Diploma / ITI' },
  { id: 'graduate', label: 'Bachelor’s Degree (Graduate)' },
  { id: 'post_graduate', label: 'Master’s Degree (Post Graduate)' },
];

export default function SettingsPage() {
  const { locale, setLocale, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTab>('language');

  // --- Notification Preferences ---
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [frequency, setFrequency] = useState<AlertFrequency>('instant');
  const [quietHours, setQuietHours] = useState(true);
  const [alertTopics, setAlertTopics] = useState({
    deadlines: true,
    admitCard: true,
    results: true,
    scholarships: true,
    assistance: false,
  });

  // --- Display Preferences ---
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('default');
  const [textScale, setTextScale] = useState<TextScale>('normal');
  const [density, setDensity] = useState<DensityMode>('comfortable');

  // --- Opportunity / Filter Preferences ---
  const [preferredState, setPreferredState] = useState('ALL');
  const [focusCategories, setFocusCategories] = useState({
    jobs: true,
    exams: true,
    scholarships: true,
    admissions: false,
  });
  const [preferredQualification, setPreferredQualification] = useState('graduate');

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load display preferences
    const savedTheme = (localStorage.getItem('applyfields_reading_theme') as ReadingTheme) || 'default';
    setReadingTheme(savedTheme);

    const savedScale = (localStorage.getItem('applyfields_text_scale') as TextScale) || 'normal';
    setTextScale(savedScale);

    const savedDensity = (localStorage.getItem('applyfields_density') as DensityMode) || 'comfortable';
    setDensity(savedDensity);

    // Load notification preferences
    const savedNotifs = localStorage.getItem('applyfields_notification_preferences');
    if (savedNotifs) {
      try {
        const parsed = JSON.parse(savedNotifs);
        if (parsed.email !== undefined) setEmailEnabled(parsed.email);
        if (parsed.whatsapp !== undefined) setWhatsappEnabled(parsed.whatsapp);
        if (parsed.push !== undefined) setPushEnabled(parsed.push);
        if (parsed.frequency) setFrequency(parsed.frequency);
        if (parsed.quietHours !== undefined) setQuietHours(parsed.quietHours);
        if (parsed.topics) setAlertTopics(parsed.topics);
      } catch {}
    }

    // Load opportunity preferences
    const savedState = localStorage.getItem('applyfields_pref_state');
    if (savedState) setPreferredState(savedState);

    const savedFocus = localStorage.getItem('applyfields_pref_focus');
    if (savedFocus) {
      try {
        setFocusCategories(JSON.parse(savedFocus));
      } catch {}
    }

    const savedQual = localStorage.getItem('applyfields_pref_qualification');
    if (savedQual) setPreferredQualification(savedQual);
  }, []);

  // Language Change Handler
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLocale(lang);
    showAppToast({
      message: `${t('settings_lang_saved')}: ${lang === 'te' ? 'తెలుగు' : lang === 'hi' ? 'हिन्दी' : 'English'}`,
      type: 'success',
    });
  };

  // Theme Change Handler
  const handleThemeChange = (theme: ReadingTheme) => {
    setReadingTheme(theme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-reading-theme', theme);
      localStorage.setItem('applyfields_reading_theme', theme);
      window.dispatchEvent(new CustomEvent('reading-theme-changed', { detail: theme }));
    }
  };

  // Text Scale Handler
  const handleScaleChange = (scale: TextScale) => {
    setTextScale(scale);
    if (typeof document !== 'undefined') {
      const fontSizeMap = { normal: '16px', medium: '18px', large: '20px' };
      document.documentElement.style.fontSize = fontSizeMap[scale];
      localStorage.setItem('applyfields_text_scale', scale);
      window.dispatchEvent(new CustomEvent('text-scale-changed', { detail: scale }));
    }
  };

  // Density Handler
  const handleDensityChange = (d: DensityMode) => {
    setDensity(d);
    localStorage.setItem('applyfields_density', d);
  };

  // Save all preferences
  const handleSavePreferences = () => {
    if (typeof window !== 'undefined') {
      const notifPrefs = {
        email: emailEnabled,
        whatsapp: whatsappEnabled,
        push: pushEnabled,
        frequency,
        quietHours,
        topics: alertTopics,
      };
      localStorage.setItem('applyfields_notification_preferences', JSON.stringify(notifPrefs));
      localStorage.setItem('applyfields_pref_state', preferredState);
      localStorage.setItem('applyfields_pref_focus', JSON.stringify(focusCategories));
      localStorage.setItem('applyfields_pref_qualification', preferredQualification);
      window.dispatchEvent(new CustomEvent('preferences-changed'));
    }

    showAppToast({
      message: t('settings_saved_success'),
      type: 'success',
    });
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    setLocale('en');
    handleThemeChange('default');
    handleScaleChange('normal');
    handleDensityChange('comfortable');
    setEmailEnabled(true);
    setWhatsappEnabled(true);
    setPushEnabled(false);
    setFrequency('instant');
    setQuietHours(true);
    setAlertTopics({
      deadlines: true,
      admitCard: true,
      results: true,
      scholarships: true,
      assistance: false,
    });
    setPreferredState('ALL');
    setFocusCategories({
      jobs: true,
      exams: true,
      scholarships: true,
      admissions: false,
    });
    setPreferredQualification('graduate');

    if (typeof window !== 'undefined') {
      localStorage.removeItem('applyfields_notification_preferences');
      localStorage.removeItem('applyfields_pref_state');
      localStorage.removeItem('applyfields_pref_focus');
      localStorage.removeItem('applyfields_pref_qualification');
    }

    showAppToast({
      message: 'Preferences restored to factory defaults.',
      type: 'info',
    });
  };

  // Request Push Permission
  const handleRequestPush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser notifications are not supported on this device/browser.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setPushEnabled(true);
      showAppToast({
        message: 'Browser push notifications active!',
        type: 'success',
      });
    } else {
      setPushEnabled(false);
      showAppToast({
        message: 'Push notifications permission was denied or blocked.',
        type: 'remove',
      });
    }
  };

  return (
    <div className="mx-auto max-w-[1360px] space-y-8 px-4 py-8 sm:px-6 lg:px-8 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-white bg-gradient-to-r from-[#F0F4F8] via-[#e5eef8] to-[#edf4fc] p-6 sm:p-8 shadow-clay-card">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-xl bg-[#0e7bf4] text-white shadow-sm">
              <Sliders className="size-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-[#0e7bf4]">
              {t('settings_title')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#082046]">
            {t('settings_title')}
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm font-semibold text-[#435775] leading-relaxed">
            {t('settings_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 rounded-xl border border-[#c4d2e3] bg-white px-4 py-2.5 text-xs font-bold text-[#526987] shadow-sm hover:bg-[#f0f4f8] transition-colors"
          >
            <RotateCcw className="size-3.5" />
            <span>{t('settings_btn_reset')}</span>
          </button>
          <button
            type="button"
            onClick={handleSavePreferences}
            className="flex items-center gap-1.5 rounded-xl bg-[#0e7bf4] px-5 py-2.5 text-xs font-bold text-white shadow-clay-btn-azure hover:bg-[#0c6fdc] transition-all"
          >
            <Save className="size-3.5" />
            <span>{t('settings_btn_save')}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto border-b border-[#c4d2e3] pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('language')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-black transition-all ${
            activeTab === 'language'
              ? 'bg-[#082046] text-white shadow-md'
              : 'bg-white/80 text-[#526987] hover:bg-white hover:text-[#082046]'
          }`}
        >
          <Globe className="size-4 text-[#0e7bf4]" />
          <span>{t('settings_tab_language')}</span>
          <span className="ml-1 rounded-full bg-[#0e7bf4]/20 px-2 py-0.5 text-[10px] font-black uppercase text-[#0e7bf4]">
            {locale.toUpperCase()}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-black transition-all ${
            activeTab === 'notifications'
              ? 'bg-[#082046] text-white shadow-md'
              : 'bg-white/80 text-[#526987] hover:bg-white hover:text-[#082046]'
          }`}
        >
          <Bell className="size-4 text-[#0e7bf4]" />
          <span>{t('settings_tab_notifications')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('display')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-black transition-all ${
            activeTab === 'display'
              ? 'bg-[#082046] text-white shadow-md'
              : 'bg-white/80 text-[#526987] hover:bg-white hover:text-[#082046]'
          }`}
        >
          <Palette className="size-4 text-[#0e7bf4]" />
          <span>{t('settings_tab_display')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-black transition-all ${
            activeTab === 'preferences'
              ? 'bg-[#082046] text-white shadow-md'
              : 'bg-white/80 text-[#526987] hover:bg-white hover:text-[#082046]'
          }`}
        >
          <Filter className="size-4 text-[#0e7bf4]" />
          <span>{t('settings_tab_preferences')}</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: LANGUAGE & LOCALIZATION                                 */}
      {/* ============================================================== */}
      {activeTab === 'language' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white bg-white p-6 sm:p-8 shadow-clay-card space-y-6">
            <div>
              <h2 className="text-lg font-black text-[#082046]">
                {t('settings_lang_title')}
              </h2>
              <p className="mt-1 text-xs text-[#526987]">
                {t('settings_lang_desc')}
              </p>
            </div>

            {/* Language Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = locale === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#0e7bf4] bg-[#edf4fd] shadow-md ring-2 ring-[#0e7bf4]/20'
                        : 'border-[#e2eaf4] bg-[#F8FAFC] hover:border-[#c4d2e3] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-3xl">{lang.flag}</span>
                      {isSelected && (
                        <span className="flex size-6 items-center justify-center rounded-full bg-[#0e7bf4] text-white">
                          <Check className="size-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="text-base font-black text-[#082046]">
                        {lang.nativeName}
                      </p>
                      <p className="text-xs text-[#526987] font-semibold">
                        {lang.name}
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[#0e7bf4]">
                      {lang.code === 'en'
                        ? 'All Opportunities & Law'
                        : lang.code === 'te'
                        ? 'ఆంధ్రప్రదేశ్ & తెలంగాణ'
                        : 'राष्ट्रीय भाषा'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live Translation Preview Box */}
            <div className="rounded-2xl border border-dashed border-[#c4d2e3] bg-[#F8FAFC] p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#0e7bf4]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#082046]">
                  {t('settings_preview_title')}
                </h3>
              </div>

              <div className="rounded-xl border border-white bg-white p-4 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    {t('settings_preview_badge')}
                  </span>
                  <span className="rounded-md bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                    {t('badge_govt_job')}
                  </span>
                </div>
                <h4 className="text-sm font-black text-[#082046]">
                  {t('settings_preview_heading')}
                </h4>
                <p className="text-xs text-[#526987]">
                  {t('settings_preview_desc')}
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <span className="rounded-lg bg-[#0e7bf4] px-3 py-1.5 text-xs font-bold text-white">
                    {t('btn_apply_now')}
                  </span>
                  <span className="rounded-lg border border-[#c4d2e3] px-3 py-1.5 text-xs font-semibold text-[#082046]">
                    {t('btn_save')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: NOTIFICATIONS & ALERTS                                  */}
      {/* ============================================================== */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white bg-white p-6 sm:p-8 shadow-clay-card space-y-6">
            <div>
              <h2 className="text-lg font-black text-[#082046]">
                {t('settings_notif_title')}
              </h2>
              <p className="mt-1 text-xs text-[#526987]">
                {t('settings_notif_desc')}
              </p>
            </div>

            {/* Channels Switchers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Email */}
              <div className="rounded-2xl border border-[#e2eaf4] bg-[#F8FAFC] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-[#0e7bf4]">
                      <Mail className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-[#082046]">{t('settings_notif_email')}</p>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">Verified Email</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailEnabled(!emailEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      emailEnabled ? 'bg-[#0e7bf4]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        emailEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-[#526987] leading-relaxed">
                  {t('settings_notif_email_desc')}
                </p>
              </div>

              {/* WhatsApp & SMS */}
              <div className="rounded-2xl border border-[#e2eaf4] bg-[#F8FAFC] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <Smartphone className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-[#082046]">{t('settings_notif_whatsapp')}</p>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">+91 Mobile Phone</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      whatsappEnabled ? 'bg-[#0e7bf4]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        whatsappEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-[#526987] leading-relaxed">
                  {t('settings_notif_whatsapp_desc')}
                </p>
              </div>

              {/* Push */}
              <div className="rounded-2xl border border-[#e2eaf4] bg-[#F8FAFC] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                      <Bell className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-[#082046]">{t('settings_notif_push')}</p>
                      <span className="text-[10px] text-[#526987] font-bold uppercase">Desktop &amp; Mobile Web</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestPush}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      pushEnabled ? 'bg-[#0e7bf4]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        pushEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-[#526987] leading-relaxed">
                  {t('settings_notif_push_desc')}
                </p>
              </div>
            </div>

            {/* Delivery Frequency */}
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <h3 className="text-sm font-black text-[#082046]">
                {t('settings_notif_freq')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'instant', label: t('settings_notif_instant') },
                  { id: 'daily', label: t('settings_notif_daily') },
                  { id: 'weekly', label: t('settings_notif_weekly') },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFrequency(item.id as AlertFrequency)}
                    className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      frequency === item.id
                        ? 'border-[#0e7bf4] bg-[#edf4fd] text-[#082046] ring-1 ring-[#0e7bf4]'
                        : 'border-[#e2eaf4] bg-[#F8FAFC] text-[#526987] hover:bg-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="border-t border-slate-100 pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-[#082046]">{t('settings_notif_quiet')}</p>
                <p className="text-xs text-[#526987]">{t('settings_notif_quiet_desc')}</p>
              </div>
              <button
                type="button"
                onClick={() => setQuietHours(!quietHours)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  quietHours ? 'bg-[#0e7bf4]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    quietHours ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: DISPLAY & ACCESSIBILITY                                 */}
      {/* ============================================================== */}
      {activeTab === 'display' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white bg-white p-6 sm:p-8 shadow-clay-card space-y-6">
            <div>
              <h2 className="text-lg font-black text-[#082046]">
                {t('settings_display_theme')}
              </h2>
              <p className="mt-1 text-xs text-[#526987]">
                Choose daylight, sepia or high-contrast theme to reduce eye fatigue.
              </p>
            </div>

            {/* Theme cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  id: 'default' as ReadingTheme,
                  label: t('settings_display_clean'),
                  desc: 'Standard daylight interface',
                  icon: SunMedium,
                  cardBg: 'bg-white',
                  textColor: 'text-[#082046]',
                },
                {
                  id: 'sepia' as ReadingTheme,
                  label: t('settings_display_sepia'),
                  desc: 'Warm paper tint for reading comfort',
                  icon: Eye,
                  cardBg: 'bg-[#f4ebd0]',
                  textColor: 'text-[#432c12]',
                },
                {
                  id: 'high-contrast' as ReadingTheme,
                  label: t('settings_display_contrast'),
                  desc: 'Maximum legible night contrast',
                  icon: Moon,
                  cardBg: 'bg-[#08182e]',
                  textColor: 'text-[#ffffff]',
                },
              ].map((thm) => {
                const Icon = thm.icon;
                const isSelected = readingTheme === thm.id;
                return (
                  <button
                    key={thm.id}
                    type="button"
                    onClick={() => handleThemeChange(thm.id)}
                    className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all ${thm.cardBg} ${
                      isSelected
                        ? 'border-[#0e7bf4] shadow-md ring-2 ring-[#0e7bf4]'
                        : 'border-[#c4d2e3] hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon className={`size-5 ${thm.textColor}`} />
                      {isSelected && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-[#0e7bf4] text-white">
                          <Check className="size-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className={`mt-3 text-sm font-black ${thm.textColor}`}>{thm.label}</p>
                    <p className="mt-1 text-[11px] opacity-80 leading-snug">{thm.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Text Scaling */}
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <Type className="size-4 text-[#0e7bf4]" />
                <h3 className="text-sm font-black text-[#082046]">
                  {t('settings_display_font_size')}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'normal' as TextScale, label: t('settings_display_normal'), size: 'text-sm' },
                  { id: 'medium' as TextScale, label: t('settings_display_medium'), size: 'text-base' },
                  { id: 'large' as TextScale, label: t('settings_display_large'), size: 'text-lg' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleScaleChange(s.id)}
                    className={`p-3.5 rounded-xl border text-center font-bold transition-all ${s.size} ${
                      textScale === s.id
                        ? 'border-[#0e7bf4] bg-[#edf4fd] text-[#082046] ring-1 ring-[#0e7bf4]'
                        : 'border-[#e2eaf4] bg-[#F8FAFC] text-[#526987] hover:bg-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Density */}
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <h3 className="text-sm font-black text-[#082046]">
                {t('settings_display_density')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'comfortable' as DensityMode, label: t('settings_display_comfortable'), desc: 'Spacious cards & generous margins' },
                  { id: 'compact' as DensityMode, label: t('settings_display_compact'), desc: 'Condensed table & high-volume scanning' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleDensityChange(d.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      density === d.id
                        ? 'border-[#0e7bf4] bg-[#edf4fd] text-[#082046] ring-1 ring-[#0e7bf4]'
                        : 'border-[#e2eaf4] bg-[#F8FAFC] text-[#526987] hover:bg-white'
                    }`}
                  >
                    <p className="text-xs font-black">{d.label}</p>
                    <p className="text-[11px] text-[#526987] mt-0.5">{d.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: STATE & OPPORTUNITY PREFERENCES                         */}
      {/* ============================================================== */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white bg-white p-6 sm:p-8 shadow-clay-card space-y-6">
            <div>
              <h2 className="text-lg font-black text-[#082046]">
                {t('settings_filter_state')}
              </h2>
              <p className="mt-1 text-xs text-[#526987]">
                {t('settings_filter_state_desc')}
              </p>
            </div>

            {/* State selection pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {STATE_OPTIONS.map((st) => {
                const isSelected = preferredState === st.code;
                return (
                  <button
                    key={st.code}
                    type="button"
                    onClick={() => setPreferredState(st.code)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-[#0e7bf4] bg-[#edf4fd] text-[#082046] ring-1 ring-[#0e7bf4]'
                        : 'border-[#e2eaf4] bg-[#F8FAFC] text-[#526987] hover:bg-white'
                    }`}
                  >
                    <span className="truncate">{st.name}</span>
                    {isSelected && <Check className="size-3 text-[#0e7bf4] shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>

            {/* Default Qualification */}
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-4 text-[#0e7bf4]" />
                <h3 className="text-sm font-black text-[#082046]">
                  {t('settings_filter_education')}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {QUALIFICATION_OPTIONS.map((q) => {
                  const isSelected = preferredQualification === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setPreferredQualification(q.id)}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                        isSelected
                          ? 'border-[#0e7bf4] bg-[#edf4fd] text-[#082046] ring-1 ring-[#0e7bf4]'
                          : 'border-[#e2eaf4] bg-[#F8FAFC] text-[#526987] hover:bg-white'
                      }`}
                    >
                      {q.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Focus categories */}
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <h3 className="text-sm font-black text-[#082046]">
                {t('settings_filter_category')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'jobs', label: t('apply_tab_jobs') },
                  { key: 'exams', label: t('apply_tab_exams') },
                  { key: 'scholarships', label: t('apply_tab_scholarships') },
                  { key: 'admissions', label: t('apply_tab_admissions') },
                ].map((cat) => {
                  const isChecked = (focusCategories as any)[cat.key];
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() =>
                        setFocusCategories((prev) => ({
                          ...prev,
                          [cat.key]: !isChecked,
                        }))
                      }
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all ${
                        isChecked
                          ? 'border-[#0e7bf4] bg-[#edf4fd] text-[#082046] ring-1 ring-[#0e7bf4]'
                          : 'border-[#e2eaf4] bg-[#F8FAFC] text-[#526987] hover:bg-white'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {isChecked && <Check className="size-3 text-[#0e7bf4] shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Save Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-white bg-white/95 backdrop-blur-md px-6 py-4 shadow-clay-card">
        <p className="text-xs text-[#526987] font-semibold">
          {t('settings_subtitle')}
        </p>
        <button
          type="button"
          onClick={handleSavePreferences}
          className="flex items-center gap-2 rounded-xl bg-[#0e7bf4] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-clay-btn-azure hover:bg-[#0c6fdc] transition-all"
        >
          <Save className="size-4" />
          <span>{t('settings_btn_save')}</span>
        </button>
      </div>
    </div>
  );
}
