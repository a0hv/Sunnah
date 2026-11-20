'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, X } from 'lucide-react';
import { SunnahAssistant } from './SunnahAssistant';

export function FloatingAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // إغلاق النافذة عند الضغط على Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // إخفاء الزر العائم تلقائياً في الصفحة الرئيسية لأن المساعد مدمج فيها بالفعل
  if (pathname === '/') {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed end-5 bottom-20 md:bottom-6 z-40">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-brand text-white shadow-md hover:bg-emerald-brand/90 transition-colors duration-200 border border-white/20 ${
            isOpen ? 'ring-2 ring-emerald-brand/40 ring-offset-2' : ''
          }`}
          aria-label="فتح المساعد الذكي"
        >
          {isOpen ? (
            <X className="w-5 h-5 text-white" strokeWidth={1.6} />
          ) : (
            <Sparkles className="w-5 h-5 text-gold-accent" strokeWidth={1.6} />
          )}
          <span className="font-display font-medium text-xs sm:text-sm hidden sm:inline">
            {isOpen ? 'إغلاق المساعد' : 'الباحث في السنة'}
          </span>
        </button>
      </div>

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-200"
          />

          {/* Modal Container */}
          <div className="fixed inset-x-3 bottom-20 md:bottom-22 md:start-auto md:end-6 z-50 md:w-[460px] max-w-[95vw] animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="shadow-xl rounded-2xl overflow-hidden border border-subtle-light/80 dark:border-subtle-dark/80">
              <SunnahAssistant compact onClose={() => setIsOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
