import type { Metadata } from 'next';
import './globals.css';
import { ClientProviders } from '@/components/providers/client-providers';
import { AppLogo } from '@/components/layout/app-logo';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Assetta',
  description: 'Your assets - optimized. Modern property management for Zambian landlords.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isSandbox = process.env.NEXT_PUBLIC_LENCO_IS_SANDBOX === 'true';
  const lencoUrl = isSandbox
    ? "https://sandbox.lenco.co/js/v1/inline.js"
    : "https://pay.lenco.co/js/v1/inline.js";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><path fill=%22%233F51B5%22 d=%22M62.3,77.5l-8.6-20.3h-8.2l-8.4,20.3h-7.3L50,22.5l20.1,55H62.3z M50,33.1L43.1,51h13.8L50,33.1z%22/></svg>" />
        <meta name="theme-color" content="#3F51B5" />
      </head>
      <body className="font-body antialiased">
        <Script src={lencoUrl} strategy="afterInteractive" />
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
