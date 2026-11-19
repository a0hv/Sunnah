import type { Metadata } from 'next';
import { Amiri } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-hadith',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'منصة السنة',
  description: 'منصة السنة النبوية الشاملة: رياض الصالحين للإمام النووي كاملًا، حصن المسلم، الأربعون النووية، السيرة النبوية، ومتتبع يومك وليلتك.',
  keywords: ['منصة السنة', 'رياض الصالحين', 'النووي', 'حصن المسلم', 'الأحاديث الصحيحة', 'الأربعون النووية', 'السيرة النبوية', 'أذكار اليوم والليلة'],
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
      <body className="min-h-screen bg-paper-light text-charcoal-light dark:bg-paper-dark dark:text-charcoal-dark antialiased font-sans selection:bg-emerald-brand selection:text-white transition-colors">
        <ThemeProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-1 pb-20 md:pb-0">
              {children}
            </div>
            <Footer />
            <MobileBottomNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
