import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ef4444',
};

export const metadata: Metadata = {
  title: "Chili Cook-Off Voting System",
  description: "Vote for your favorite chili at the UIF Chili Cook-Off 2025",
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chili Cook-Off',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Chili Cook-Off Voting',
    title: 'Chili Cook-Off Voting System',
    description: 'Vote for your favorite chili at the UIF Chili Cook-Off 2025',
  },
  twitter: {
    card: 'summary',
    title: 'Chili Cook-Off Voting System',
    description: 'Vote for your favorite chili at the UIF Chili Cook-Off 2025',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Only register service worker in production (not on localhost)
            if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                  .then((reg) => console.log('Service Worker registered'))
                  .catch((err) => console.log('Service Worker registration failed:', err));
              });
            }
          `
        }} />
      </body>
    </html>
  );
}
