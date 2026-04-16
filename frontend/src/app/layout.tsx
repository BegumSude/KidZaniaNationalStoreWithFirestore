import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'KidZania | National Store',
    description: 'National Store Web App for KidZania.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="tr">
            <body className={`${inter.className} antialiased bg-white text-gray-900`}>
                <AuthProvider>
                    <main className="min-h-screen flex flex-col">
                        {children}
                    </main>
                </AuthProvider>
            </body>
        </html>
    );
}
