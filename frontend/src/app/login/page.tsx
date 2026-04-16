"use client";

import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/');
        } catch (err: any) {
            setError("Geçersiz e-posta veya şifre. Lütfen tekrar deneyin.");
            console.error("Login Error:", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="h-14 w-14 rounded-2xl bg-[#AB0033] flex items-center justify-center shadow-lg mb-4">
                        <span className="text-white font-bold text-xl">NS</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">National Store</h1>
                    <p className="text-sm text-gray-400 mt-1 tracking-wide">Kullanıcı Girişi</p>
                </div>

                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
                    {error && (
                        <div className="mb-5 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5" htmlFor="email">
                                E-Posta
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ornek@mail.com"
                                autoComplete="email"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#AB0033] focus:ring-2 focus:ring-[#AB0033]/20 transition-all duration-200"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5" htmlFor="password">
                                Şifre
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#AB0033] focus:ring-2 focus:ring-[#AB0033]/20 transition-all duration-200 pr-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#AB0033] transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-[#AB0033] hover:bg-[#F18B22] text-white font-bold tracking-wide py-3 rounded-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] shadow-sm hover:shadow-md"
                        >
                            {loading ? 'Giriş Yapılıyor...' : 'GİRİŞ YAP'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
