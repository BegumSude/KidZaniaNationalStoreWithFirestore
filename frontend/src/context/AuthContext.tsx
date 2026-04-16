"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (loading) return;

        const isAuthRoute = pathname === '/login';

        // Handle generic store protection. Admin pages handle their own auth.
        // We removed the protection on '/' so the main catalog is completely public to all customers.
        if (user && isAuthRoute) {
            router.push('/');
        }
    }, [user, loading, pathname, router]);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {/* Show nothing while initial auth state is loading to prevent flash of content */}
            {loading ? (
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <div className="flex items-center gap-3 text-slate-500">
                        <span className="relative flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
                        </span>
                        <span className="text-sm font-medium">Authenticating...</span>
                    </div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
}
