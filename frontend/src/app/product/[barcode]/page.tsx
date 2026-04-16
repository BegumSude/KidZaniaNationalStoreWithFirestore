"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import kidzaniaLogo from '../../../../../images/KidZaniaLogo.png';

interface Product {
    id: string;
    productCode: string;
    name: string;
    stockAmount: number;
    barcode: string;
    price: number;
    imageUrl: string;
    category: string;
    origin?: string;
    description?: string;
    lastPriceChange?: string;
}

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        const [year, month, day] = dateString.split('-');
        return `${day}.${month}.${year}`;
    } catch {
        return dateString;
    }
};

export default function ProductDynamicPage() {
    const params = useParams();
    const router = useRouter();
    const barcode = params.barcode as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            if (!barcode) return;
            try {
                const q = query(collection(db, 'Products'), where('Barkod', '==', barcode));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    setError('Bu ürün bulunamadı veya satışı durdurulmuş olabilir.');
                    setLoading(false);
                    return;
                }

                const docSnap = querySnapshot.docs[0];
                const data = docSnap.data();

                setProduct({
                    id: docSnap.id,
                    productCode: data['Malzeme Kodu'] || '',
                    name: data['Malzeme Açıklaması'] || 'İsimsiz Ürün',
                    stockAmount: Number(data['Stok Miktarı']) || 0,
                    barcode: String(data['Barkod'] || ''),
                    price: Number(data['SonSatis']) || 0,
                    imageUrl: data['imageUrl'] || '',
                    category: data['Category'] || '',
                    origin: data['origin'] || '',
                    description: data['description'] || '',
                    lastPriceChange: data['lastPriceChange'] || '',
                });
            } catch (err) {
                console.error(err);
                setError('Ürün bilgileri alınırken bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [barcode]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <span className="relative flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#AB0033]/40 opacity-75" />
                    <span className="relative inline-flex h-4 w-4 rounded-full bg-[#AB0033]" />
                </span>
                <p className="text-gray-400 mt-4 text-[10px] tracking-[0.2em] uppercase font-bold">KidZania | Yükleniyor</p>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[#AB0033]/10 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-[#AB0033]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-2">Eyvah, bir sorun var!</h1>
                <p className="text-gray-400 mb-8">{error || 'Maalesef aradığınız ürün bulunamadı.'}</p>
                <button
                    onClick={() => router.push('/')}
                    className="bg-[#AB0033] hover:bg-[#F18B22] text-white px-8 py-3.5 rounded-full font-bold text-sm tracking-wide transition-all duration-300 shadow-sm hover:shadow-md"
                >
                    Tüm Mağazaya Dön
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center font-sans">
            {/* Sticky Navbar */}
            <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#AB0033] transition-colors duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        Mağaza
                    </button>
                    <div className="relative h-9 w-32">
                        <Image
                            src={kidzaniaLogo}
                            alt="KidZania logo"
                            priority
                            fill
                            className="object-contain"
                        />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#AB0033] hidden sm:inline">
                        NATIONAL STORE
                    </span>
                </div>
            </header>

            <main className="w-full max-w-xl flex-1 px-4 sm:px-6 pb-20 pt-6 flex flex-col">
                {/* Product Image */}
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-card flex items-center justify-center group">
                    {product.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex flex-col items-center text-gray-300">
                            <svg className="w-16 h-16 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs uppercase tracking-widest font-bold text-gray-300">Görsel Yok</span>
                        </div>
                    )}

                </div>

                {/* Details Card */}
                <div className="mt-6 bg-white border border-gray-100 rounded-2xl shadow-card p-6 sm:p-8">
                    {/* Name + Price */}
                    <div className="flex justify-between items-start gap-4 mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 leading-tight">
                            {product.name}
                        </h1>
                        <div className="shrink-0 text-right pt-1">
                            <span className="text-2xl sm:text-3xl font-black text-[#AB0033] tabular-nums tracking-tight">
                                {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                <span className="text-base font-bold text-[#AB0033]/60 ml-1">TL</span>
                            </span>
                        </div>
                    </div>

                    {/* Info Grid — Displaying only Production Place and Last Price Change */}
                    <div className="grid grid-cols-2 gap-y-5 gap-x-4 pt-5 border-t border-gray-100">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Üretim Yeri</span>
                            <span className="text-sm font-bold text-gray-800">{product.origin || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Son Fiyat Değişimi</span>
                            <span className="text-sm font-bold text-gray-800">{formatDate(product.lastPriceChange)}</span>
                        </div>
                    </div>

                    {/* KDV Note */}
                    <div className="mt-6 pt-5 border-t border-gray-100 text-center sm:text-left">
                        <p className="text-sm text-gray-500 font-medium italic">ℹ️ Fiyatlara KDV dahildir.</p>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-10 text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                        Daha fazlasını keşfet
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="group inline-flex items-center justify-center gap-2.5 bg-[#AB0033] hover:bg-[#F18B22] text-white px-8 py-4 rounded-full font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                    >
                        Tüm Ürünleri İncele
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                    <div className="mt-10 text-[10px] font-medium text-gray-300 tracking-widest uppercase">
                        © {new Date().getFullYear()} KidZania National Store
                    </div>
                </div>
            </main>
        </div>
    );
}
