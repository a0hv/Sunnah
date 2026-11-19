'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
      className={`p-2 rounded-xl border border-subtle-light dark:border-subtle-dark bg-surface-light dark:bg-surface-dark text-muted-light dark:text-muted-dark hover:text-emerald-brand dark:hover:text-emerald-brand-dark hover:border-emerald-brand/40 dark:hover:border-emerald-brand-dark/40 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-brand ${className}`}
    >
      {mounted ? (
        isDark ? (
          <Sun className="w-5 h-5 text-gold-accent-dark transition-transform hover:rotate-45" />
        ) : (
          <Moon className="w-5 h-5 text-emerald-brand transition-transform hover:-rotate-12" />
        )
      ) : (
        <span className="w-5 h-5 block" />
      )}
    </button>
  );
}
