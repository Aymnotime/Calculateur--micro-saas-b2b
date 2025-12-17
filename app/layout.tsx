import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from './(components)/layout/Navbar';
import Footer from './(components)/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ProfitEngine – Calculateur & Insights',
  description: "Maîtrisez vos marges e-commerce avec un calculateur en temps réel et des ressources claires.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="bg-gray-50">
      <body className={`${inter.className} text-gray-900 min-h-screen flex flex-col`}>
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
