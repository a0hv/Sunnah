import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Amiri } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';

const thmanyahSans = localFont({
  src: [
    {
      path: '../../public/fonts/thmanyah-sans-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/thmanyah-sans-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/thmanyah-sans-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/thmanyah-sans-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/thmanyah-sans-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
});

const thmanyahDisplay = localFont({
  src: [
    {
      path: '../../public/fonts/thmanyah-serif-display-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/thmanyah-serif-display-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/thmanyah-serif-display-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/thmanyah-serif-display-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/thmanyah-serif-display-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-display',
  display: 'swap',
});

const thmanyahText = localFont({
  src: [
    {
      path: '../../public/fonts/thmanyah-serif-text-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/thmanyah-serif-text-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/thmanyah-serif-text-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/thmanyah-serif-text-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/thmanyah-serif-text-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-text',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-hadith',
  display: 'swap',
});

const uthmanic = localFont({
  src: [
    {
      path: '../../public/fonts/uthmanic-hafs-v20.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-quran',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'منصة السنة | الحديث النبوي ورياض الصالحين والأذكار',
  description: 'منصة السنة النبوية الشاملة: رياض الصالحين للإمام النووي كاملًا، حصن المسلم، الأربعون النووية، السيرة النبوية، ومتتبع يومك وليلتك.',
  keywords: ['منصة السنة', 'رياض الصالحين', 'النووي', 'حصن المسلم', 'الأحاديث الصحيحة', 'الأربعون النووية', 'السيرة النبوية', 'أذكار اليوم والليلة'],
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
      className={`${thmanyahSans.variable} ${thmanyahDisplay.variable} ${thmanyahText.variable} ${amiri.variable} ${uthmanic.variable}`}
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
