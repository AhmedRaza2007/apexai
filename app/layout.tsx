import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ApexAI — Enterprise AI Business Assistant',
  description:
    'Modern, production-oriented AI Business Assistant for automated drafting, marketing assets, document synthesis, and safeguarded task execution.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0B0F19] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
