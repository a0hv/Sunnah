import type { Metadata } from 'next';
import { Amiri } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'الباحث في السنة | المرجع الشامل للسنة النبوية',
  description: 'الباحث في السنة — المرجع الرقمي الشامل: الأحاديث الصحيحة وشروحها، العقيدة النبوية، السيرة ومواقف النبي ﷺ، أذكار حصن المسلم، والأربعون النووية مع متتبع سنن اليوم والليلة.',
  keywords: ['الباحث في السنة', 'السنة النبوية', 'الحديث النبوي', 'العقيدة النبوية', 'الأربعون النووية', 'النووي', 'حصن المسلم', 'السيرة النبوية', 'الأحاديث الصحيحة', 'أذكار اليوم والليلة', 'صحيح الحديث'],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={amiri.variable}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && systemDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-paper-light text-charcoal-light dark:bg-paper-dark dark:text-charcoal-dark antialiased font-sans selection:bg-emerald-brand selection:text-white transition-colors overflow-x-hidden w-full max-w-full">
        <ThemeProvider>
          <div className="flex flex-col min-h-screen overflow-x-hidden w-full max-w-full">
            <PreviewBanner />
            <Navbar />
            <div className="flex-1 pb-8 sm:pb-12 md:pb-14 overflow-x-hidden w-full max-w-full">
              {children}
            </div>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
