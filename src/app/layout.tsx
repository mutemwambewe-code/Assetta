import type { Metadata } from 'next';
import './globals.css';
import { ClientProviders } from '@/components/providers/client-providers';
import { AppLogo } from '@/components/layout/app-logo';

export const metadata: Metadata = {
  title: 'Assetta',
  description: 'Where your assets thrive, because we make them better.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#183D7A" />
      </head>
      <body className="font-body antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
