'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Flame,
  Award,
  Filter,
  Check,
  Clock,
  Compass,
  ChevronLeft,
  Share2,
} from 'lucide-react';
import dailySunnahRaw from '@/data/daily-sunnah.json';

interface StationItem {
  id: string;
  order: number;
  title: string;
  timeOfDay: string;
  period: string;
  description: string;
  sunnahActions: string[];
  hadithQuote: string;
  priority: 'رئيسية' | 'مؤكدة' | 'مستحبة' | string;
  hisnCategoryIds: number[];
  hisnCategoryTitle: string;
  searchTopic?: string;
  searchQuery?: string;
}

interface DailySunnahData {
  meta: {
    title: string;
    description: string;
    version: string;
  };
  stations: StationItem[];
}

const data = dailySunnahRaw as unknown as DailySunnahData;
const STATIONS: StationItem[] = data.stations || [];

function getTodayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getFormattedArabicDate(): string {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  } catch {
    return getTodayKey();
  }
}

export function DailyTrackerClient() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'night'>('all');
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [streakCount, setStreakCount] = useState<number>(1);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const today = getTodayKey();

    try {
      const raw = localStorage.getItem('daily_sunnah_tracker_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === today) {
          setCompletedIds(parsed.completed || []);
          setStreakCount(parsed.streak || 1);
        } else {
          // Check streak continuity: did user complete yesterday?
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

          const wasYesterday = parsed.date === yesterdayKey;
          const nextStreak = wasYesterday && (parsed.completed?.length || 0) >= 6 ? (parsed.streak || 1) + 1 : 1;

          setCompletedIds([]);
          setStreakCount(nextStreak);
          localStorage.setItem(
            'daily_sunnah_tracker_data',
            JSON.stringify({ date: today, completed: [], streak: nextStreak })
          );
        }
      } else {
        localStorage.setItem(
          'daily_sunnah_tracker_data',
          JSON.stringify({ date: today, completed: [], streak: 1 })
        );
      }
    } catch {
      // LocalStorage error handled gracefully
    }
  }, []);

  // Save changes to localStorage
  const saveProgress = useCallback(
    (newCompleted: string[]) => {
      setCompletedIds(newCompleted);
      const today = getTodayKey();
      try {
        localStorage.setItem(
          'daily_sunnah_tracker_data',
          JSON.stringify({
            date: today,
            completed: newCompleted,
            streak: streakCount,
          })
        );
      } catch {
        // ignore
      }
    },
    [streakCount]
  );

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast((cur) => (cur === msg ? null : cur));
    }, 2500);
  };

  // Toggle station completion
  const toggleStation = (id: string) => {
    const isDone = completedIds.includes(id);
    const updated = isDone
      ? completedIds.filter((item) => item !== id)
      : [...completedIds, id];

    saveProgress(updated);

    if (!isDone) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }
      showToast('تقبل الله منك وأحيا بك سنّة نبيه ﷺ');
    }
  };

  // Reset today
  const handleReset = () => {
    if (confirm('هل ترغب بإعادة تصفير متتبع اليوم؟')) {
      saveProgress([]);
      showToast('تمت إعادة ضبط متتبع اليوم');
    }
  };

  // Filtered stations
  const filteredStations = useMemo(() => {
    return STATIONS.filter((item) => {
      // Completion filter
      const isDone = completedIds.includes(item.id);
      if (filter === 'pending' && isDone) return false;
      if (filter === 'completed' && !isDone) return false;

      // Period filter
      if (periodFilter !== 'all' && item.period !== 'all-day' && item.period !== periodFilter) {
        return false;
      }

      return true;
    });
  }, [completedIds, filter, periodFilter]);

  const totalCount = STATIONS.length;
  const completedCount = completedIds.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-8 text-start">
      {/* Toast */}
      {feedbackToast && (
        <div className="fixed bottom-20 md:bottom-8 start-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Hero Stats Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-b from-surface-light to-emerald-brand/5 dark:from-surface-dark dark:to-emerald-brand-dark/10 border border-emerald-brand/20 dark:border-emerald-brand-dark/30 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-light dark:text-muted-dark font-sans">
              <Calendar className="w-3.5 h-3.5 text-emerald-brand" />
              <span>{isMounted ? getFormattedArabicDate() : 'اليوم الحالي'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
              محطات يومك وليلتك مع هدي النبوة
            </h2>
            <p className="text-xs text-muted-light dark:text-muted-dark max-w-xl leading-relaxed">
              ١٢ محطة مرتبة زمنياً، كل محطة مربوطة بأبوابها المعتمدة في «حصن المسلم» ومحرك البحث في السنة.
            </p>
          </div>

          {/* Streak & Reset */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300">
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
              <div className="flex flex-col text-start">
                <span className="font-bold text-xs">{streakCount} يوم متواصل</span>
                <span className="text-[10px] text-muted-light dark:text-muted-dark">أيام الاستمرار</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              title="إعادة تصفير اليوم"
              className="p-2.5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-rose-500 hover:border-rose-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-800 dark:text-slate-200">
              إنجاز اليوم: {completedCount} من أصل {totalCount} محطة
            </span>
            <span className="font-mono text-emerald-brand dark:text-emerald-brand-dark">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-brand to-teal-500 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-subtle-light/70 dark:border-subtle-dark/70">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-emerald-brand text-white shadow-2xs font-semibold'
                  : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light'
              }`}
            >
              الكل ({totalCount})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-emerald-brand text-white shadow-2xs font-semibold'
                  : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light'
              }`}
            >
              المتبقية ({totalCount - completedCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-emerald-brand text-white shadow-2xs font-semibold'
                  : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light'
              }`}
            >
              المكتملة ({completedCount})
            </button>
          </div>

          {/* Time of day quick filters */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-muted-light dark:text-muted-dark me-1">الوقت:</span>
            {[
              { id: 'all', label: 'كافة الأوقات' },
              { id: 'morning', label: 'الصباح' },
              { id: 'afternoon', label: 'الظهيرة' },
              { id: 'evening', label: 'المساء' },
              { id: 'night', label: 'الليل' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodFilter(p.id as any)}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  periodFilter === p.id
                    ? 'bg-black/10 dark:bg-white/10 text-charcoal-light dark:text-charcoal-dark font-bold'
                    : 'text-muted-light dark:text-muted-dark hover:text-charcoal-light'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stations List */}
      <div className="space-y-4">
        {filteredStations.map((station) => {
          const isDone = completedIds.includes(station.id);
          const primaryHisnCat = station.hisnCategoryIds[0];

          return (
            <div
              key={station.id}
              className={`p-5 sm:p-6 rounded-3xl border transition-all duration-200 ${
                isDone
                  ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-surface-light dark:bg-surface-dark border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/40 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Station Checkbox + Title */}
                <div className="flex items-start gap-3.5 flex-1">
                  <button
                    onClick={() => toggleStation(station.id)}
                    className={`shrink-0 mt-1 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                      isDone
                        ? 'bg-emerald-brand border-emerald-brand text-white shadow-2xs scale-105'
                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-brand text-transparent'
                    }`}
                    aria-label={`تحديد ${station.title}`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 text-emerald-brand dark:text-emerald-brand-dark text-xs font-bold flex items-center justify-center font-sans">
                        {station.order}
                      </span>
                      <h3
                        className={`font-display font-bold text-lg sm:text-xl ${
                          isDone
                            ? 'line-through text-muted-light dark:text-muted-dark'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {station.title}
                      </h3>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark">
                        {station.timeOfDay}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          station.priority === 'رئيسية'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                            : station.priority === 'مؤكدة'
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {station.priority}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-charcoal-light dark:text-charcoal-dark leading-relaxed">
                      {station.description}
                    </p>

                    {/* Sunnah Practical Actions */}
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-muted-light dark:text-muted-dark block mb-1">
                        من هدي النبي ﷺ في هذه المحطة:
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-muted-light dark:text-muted-dark">
                        {station.sunnahActions.map((act, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-brand shrink-0 mt-1.5" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Hadith Quote */}
                    {station.hadithQuote && (
                      <div className="p-3.5 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light/70 dark:border-subtle-dark/70 text-xs sm:text-sm font-hadith text-slate-800 dark:text-slate-200 leading-[2.85]">
                        {station.hadithQuote}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Hisn al-Muslim + Search */}
              <div className="mt-4 pt-3 border-t border-subtle-light/70 dark:border-subtle-dark/70 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Link to Hisn al-Muslim Category */}
                  {primaryHisnCat && (
                    <Link
                      href={`/adhkar?cat=${primaryHisnCat}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-brand/10 dark:bg-emerald-brand-dark/15 border border-emerald-brand/20 dark:border-emerald-brand-dark/30 text-emerald-brand dark:text-emerald-brand-dark hover:bg-emerald-brand/20 text-xs font-semibold transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>أذكارها في حصن المسلم: {station.hisnCategoryTitle}</span>
                      <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                    </Link>
                  )}

                  {/* Link to Dorar Hadith Search */}
                  {station.searchQuery && (
                    <a
                      href={`https://dorar.net/hadith/search?q=${encodeURIComponent(station.searchQuery)}&st=w`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/50 text-charcoal-light dark:text-charcoal-dark text-xs font-medium transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-muted-light dark:text-muted-dark" />
                      <span>تخريج الحديث: {station.searchTopic || station.searchQuery}</span>
                    </a>
                  )}
                </div>

                <button
                  onClick={() => toggleStation(station.id)}
                  className={`text-xs font-bold transition-colors ${
                    isDone
                      ? 'text-emerald-brand dark:text-emerald-brand-dark'
                      : 'text-muted-light dark:text-muted-dark hover:text-charcoal-light'
                  }`}
                >
                  {isDone ? '✓ تم إنجازها اليوم' : 'تعليم كمكتملة'}
                </button>
              </div>
            </div>
          );
        })}

        {filteredStations.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-3">
            <Award className="w-12 h-12 text-emerald-brand mx-auto opacity-70" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              لا توجد محطات في هذا الفلتر
            </h3>
            <p className="text-xs text-muted-light dark:text-muted-dark">
              يمكنك تغيير خيارات العرض للاطلاع على بقية محطات اليوم.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
