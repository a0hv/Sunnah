import type { Metadata } from 'next';
import { Amiri } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { FloatingAssistant } from '@/components/FloatingAssistant';

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-hadith',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'منصة السنة',
  description: 'منصة السنة النبوية الشاملة: الأربعون النووية للإمام النووي، حصن المسلم، السيرة النبوية، قسم تثبّت، ومتتبع سنن اليوم والليلة.',
  keywords: ['منصة السنة', 'الحديث النبوي', 'الأربعون النووية', 'النووي', 'حصن المسلم', 'السيرة النبوية', 'تثبت', 'الأحاديث الصحيحة', 'أذكار اليوم والليلة'],
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
            <Navbar />
            <div className="flex-1 pb-20 md:pb-0 overflow-x-hidden w-full max-w-full">
              {children}
            </div>
            <Footer />
            <MobileBottomNav />
            <FloatingAssistant />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
