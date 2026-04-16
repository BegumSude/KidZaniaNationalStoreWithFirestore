"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; // Limit width to prevent heavy base64 strings backing up Firestore
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    // Compress to JPEG with 0.6 quality for minimal size string
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    resolve(dataUrl);
                } else {
                    resolve(event.target?.result as string); // Fallback if no context
                }
            };
            img.onerror = () => reject(new Error("Görsel yüklenemedi."));
        };
        reader.onerror = () => reject(new Error("Dosya okunamadı."));
    });
};

interface AdminProduct {
    id: string;
    barcode: string;
    name: string;
    stockAmount: number;
    price: number;
    imageUrl: string;
    category: string;
    origin: string;
    visible: boolean;
    lastPriceChange: string;
}

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        const [year, month, day] = dateString.split('-');
        if (!year || !month || !day) return dateString;
        return `${day}.${month}.${year}`;
    } catch {
        return dateString;
    }
};

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

    const [isPrinting, setIsPrinting] = useState(false);
    const [selectedForPrint, setSelectedForPrint] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        barcode: '',
        name: '',
        stockAmount: 0 as number | string,
        price: 0 as number | string,
        imageUrl: '',
        category: 'Oyuncak',
        origin: '',
        lastPriceChange: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState('');

    useEffect(() => {
        if (!authLoading) {
            const isAdmin = sessionStorage.getItem('isAdmin');
            // If there's no Firebase user OR they haven't passed the second admin login
            if (!user || !isAdmin) {
                router.push('/admin/login');
            }
        }
    }, [user, authLoading, router]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'Products'));
            const loadedProducts = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    barcode: String(data['Barkod'] || ''),
                    name: data['Malzeme Açıklaması'] || 'İsimsiz Ürün',
                    stockAmount: Number(data['Stok Miktarı']) || 0,
                    price: Number(data['SonSatis']) || 0,
                    imageUrl: data['imageUrl'] || '',
                    category: data['Category'] || 'Diğer',
                    origin: data['origin'] || '',
                    visible: data['visible'] !== false,
                    lastPriceChange: data['lastPriceChange'] || '',
                };
            });
            setProducts(loadedProducts);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchProducts();
        }
    }, [user]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        const lowerSearch = searchTerm.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(lowerSearch) ||
            p.barcode.toLowerCase().includes(lowerSearch)
        );
    }, [products, searchTerm]);

    const handleOpenModal = (product?: AdminProduct) => {
        setImageFile(null);
        setModalError('');
        if (product) {
            setEditingProduct(product);
            setFormData({
                barcode: product.barcode,
                name: product.name,
                stockAmount: product.stockAmount,
                price: product.price,
                imageUrl: product.imageUrl,
                category: product.category || 'Kategori 1',
                origin: product.origin || '',
                lastPriceChange: product.lastPriceChange || ''
            });
        } else {
            setEditingProduct(null);
            setFormData({
                barcode: '',
                name: '',
                stockAmount: 0,
                price: 0,
                imageUrl: '',
                category: 'Kategori 1',
                origin: '',
                lastPriceChange: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setImageFile(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setModalError('');

        try {
            let finalImageUrl = formData.imageUrl;

            if (imageFile) {
                // Compress image to Base64 locally instead of uploading to Firebase Storage
                // This bypasses any Storage Bucket billing/setup requirements
                finalImageUrl = await compressImage(imageFile);
            }

            const payload = {
                'Barkod': formData.barcode,
                'Malzeme Açıklaması': formData.name,
                'Stok Miktarı': Number(formData.stockAmount) || 0,
                'SonSatis': Number(formData.price) || 0,
                'imageUrl': finalImageUrl,
                'Category': formData.category,
                'origin': formData.origin,
                'lastPriceChange': formData.lastPriceChange,
            };

            const dbPromise = editingProduct
                ? updateDoc(doc(db, 'Products', editingProduct.id), payload)
                : addDoc(collection(db, 'Products'), payload);

            const dbTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Veritabanı kaydı zaman aşımına uğradı.")), 10000));

            await Promise.race([dbPromise, dbTimeout]);

            setIsModalOpen(false);
            fetchProducts();
        } catch (error: any) {
            console.error("Error saving product:", error);
            setModalError(error.message || "Kaydedilirken bilinmeyen bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
            try {
                await deleteDoc(doc(db, 'Products', id));
                setProducts(products.filter(p => p.id !== id));
            } catch (error) {
                console.error("Error deleting product:", error);
                alert("Ürün silinirken bir hata oluştu.");
            }
        }
    };

    const toggleVisible = async (product: AdminProduct) => {
        const newVisible = !product.visible;
        try {
            await updateDoc(doc(db, 'Products', product.id), { visible: newVisible });
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, visible: newVisible } : p));
        } catch (error) {
            console.error('Görünürlük güncellenemedi:', error);
            alert('Görünürlük güncellenemedi.');
        }
    };

    const toggleSelectForPrint = (id: string) => {
        setSelectedForPrint(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllForPrint = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedForPrint(filteredProducts.map(p => p.id));
        } else {
            setSelectedForPrint([]);
        }
    };

    if (authLoading || (!user && loading)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <span className="text-gray-400 font-medium tracking-wide">Yükleniyor...</span>
            </div>
        );
    }

    if (!user) return null; // router.push handles redirect in useEffect

    if (isPrinting) {
        return (
            <div className="bg-white min-h-screen text-black">
                <style dangerouslySetInnerHTML={{ __html: "@page { size: A4 portrait; margin: 15mm; } body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } @media print { svg, img, canvas { max-width: 100% !important; display: block; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }" }} />
                <div className="print:hidden p-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-4">
                        <h2 className="font-bold text-lg text-gray-900">QR Kod Çıktı Önizlemesi</h2>
                        <span className="text-sm text-gray-400">{selectedForPrint.length} etiket seçili</span>
                    </div>
                    <div className="space-x-3">
                        <button onClick={() => setIsPrinting(false)} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">İptal</button>
                        <button onClick={() => window.print()} className="px-5 py-2 bg-[#AB0033] hover:bg-[#F18B22] text-white rounded-xl font-semibold text-sm transition-all duration-300">Sayfayı Yazdır</button>
                    </div>
                </div>
                <div className="block p-4 print:p-0">
                    {products.filter(p => selectedForPrint.includes(p.id)).map(product => (
                        <div key={product.id} className="inline-flex flex-col items-center justify-start print:border-none box-border m-2 print:m-1 pt-2" style={{ width: '4cm', height: '6cm', overflow: 'hidden', pageBreakInside: 'avoid', border: '1px dashed #ccc', verticalAlign: 'top', padding: '1mm' }}>
                            <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : 'https://nationalstore.vercel.app'}/product/${product.barcode}`} style={{ width: '3cm', height: '3cm' }} fgColor="#000000" bgColor="#FFFFFF" level="H" />
                            <div className="flex flex-col items-center w-full mt-2 gap-0.5 px-0.5">
                                <span className="font-bold text-center text-black leading-[1.1]" style={{ fontSize: '10px' }}>{product.name}</span>
                                <span className="text-center text-gray-500 font-bold uppercase" style={{ fontSize: '8px', letterSpacing: '0.05em' }}>Barkod: {product.barcode}</span>
                                <div className="w-full h-px bg-gray-100 my-1" />
                                <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-center text-gray-600 font-bold uppercase" style={{ fontSize: '7px' }}>Üretim Yeri: {product.origin || '-'}</span>
                                    <span className="text-center text-gray-600 font-bold uppercase" style={{ fontSize: '7px' }}>Fiyat Değişimi: {formatDate(product.lastPriceChange)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-gray-900">
            <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm px-6 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/')} className="text-sm font-medium text-gray-500 hover:text-[#AB0033] flex items-center gap-1.5 transition-colors duration-200">
                        ← Mağazaya Dön
                    </button>
                    <div className="h-5 w-px bg-gray-200" />
                    <h1 className="text-base font-bold text-[#AB0033] uppercase tracking-wide">Admin Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 hidden sm:inline">{user.email}</span>
                    <button
                        onClick={() => {
                            auth.signOut();
                            sessionStorage.removeItem('isAdmin');
                            router.push('/admin/login');
                        }}
                        className="text-xs bg-[#AB0033]/10 text-[#AB0033] px-3 py-1.5 rounded-xl hover:bg-[#AB0033] hover:text-white font-bold tracking-wide transition-all duration-300"
                    >
                        Çıkış Yap
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
                    <div className="relative w-full sm:max-w-md">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Ürün adı veya barkod ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#AB0033]/20 focus:border-[#AB0033] sm:text-sm outline-none transition-all duration-200"
                        />
                    </div>
                    <div className="flex sm:w-auto w-full gap-3">
                        <button
                            onClick={() => {
                                if (selectedForPrint.length === 0) {
                                    alert("Lütfen yazdırmak için tablodan en az bir ürün seçin.");
                                    return;
                                }
                                setIsPrinting(true);
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0v2.796c0 1.171.95 2.122 2.122 2.122h6.256c1.171 0 2.122-.95 2.122-2.122V9.456z" /></svg>
                            QR Etiket ({selectedForPrint.length})
                        </button>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#AB0033] hover:bg-[#F18B22] text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all duration-300 active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Yeni Ürün
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64 text-gray-400 font-medium">Ürünler Yükleniyor...</div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-[#AB0033]">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 accent-white cursor-pointer"
                                                onChange={handleSelectAllForPrint}
                                                checked={filteredProducts.length > 0 && selectedForPrint.length === filteredProducts.length}
                                            />
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-widest">Görünürlük</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-widest">Görsel</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-widest">Kategori</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-widest">Ürün Adı</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-widest">Barkod</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-widest">Üretim Yeri</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-widest">Son Fiyat Değişimi</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-widest">Stok</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-widest">Fiyat</th>
                                        <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-widest">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id} className={product.stockAmount <= 0 ? 'bg-red-50/40 hover:bg-red-50 transition-colors' : 'hover:bg-gray-50/80 transition-colors'}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 accent-[#AB0033] cursor-pointer"
                                                    checked={selectedForPrint.includes(product.id)}
                                                    onChange={() => toggleSelectForPrint(product.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleVisible(product)}
                                                        title={product.visible ? 'Mağazada görünüyor — gizlemek için tıkla' : 'Gizli — göstermek için tıkla'}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${product.visible ? 'bg-emerald-500' : 'bg-gray-200'
                                                            }`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${product.visible ? 'translate-x-6' : 'translate-x-1'
                                                            }`} />
                                                    </button>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${product.visible ? 'text-emerald-600' : 'text-gray-400'
                                                        }`}>
                                                        {product.visible ? 'Görünür' : 'Gizli'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {product.imageUrl ? (
                                                    <img src={product.imageUrl} alt={product.name} className="h-12 w-12 rounded-lg object-cover border border-gray-100 bg-white" />
                                                ) : (
                                                    <div className="h-12 w-12 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                                                        <span className="text-[9px] text-gray-300 font-medium uppercase text-center leading-tight tracking-wider">No<br />Img</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-xs font-bold uppercase tracking-wider text-[#AB0033] bg-[#AB0033]/10 inline-flex px-2.5 py-1 rounded-full">{product.category}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-400 font-mono">{product.barcode || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-400">{product.origin || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-400">{formatDate(product.lastPriceChange)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold ${product.stockAmount <= 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {product.stockAmount}
                                                    </span>
                                                    {product.stockAmount <= 0 && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-500 border border-red-100">STOK YOK</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#AB0033] font-bold">
                                                {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleOpenModal(product)} className="p-2 text-[#AB0033] hover:bg-[#AB0033]/10 rounded-lg transition-colors duration-200" title="Düzenle">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2.695 14.763l-1.262 3.152a.5.5 0 00.65.65l3.151-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg>
                                                    </button>
                                                    <button onClick={() => handleDelete(product.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors duration-200" title="Sil">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-12 text-center text-gray-400 font-medium">Aradığınız kriterlere uygun ürün bulunamadı.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h2 className="text-lg font-bold text-gray-900">{editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        {modalError && (
                            <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm text-center">
                                {modalError}
                            </div>
                        )}
                        <div className="p-6 overflow-y-auto bg-gray-50/50">
                            <form id="product-form" onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Ürün Adı</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#AB0033]/20 focus:border-[#AB0033] focus:outline-none transition-all bg-white text-sm" placeholder="Ürün adını girin..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Barkod</label>
                                    <input type="text" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#AB0033]/20 focus:border-[#AB0033] focus:outline-none transition-all bg-white text-sm" placeholder="869012... vb" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Stok (Adet)</label>
                                        <input required type="number" min="0" value={formData.stockAmount} onChange={e => setFormData({ ...formData, stockAmount: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#AB0033]/20 focus:border-[#AB0033] focus:outline-none transition-all bg-white text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Fiyat (TL)</label>
                                        <input required type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#AB0033]/20 focus:border-[#AB0033] focus:outline-none transition-all bg-white text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Görsel (Bilgisayardan Yükle)</label>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setImageFile(e.target.files[0]);
                                                    setFormData({ ...formData, imageUrl: '' });
                                                }
                                            }}
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#AB0033]/10 file:text-[#AB0033] hover:file:bg-[#AB0033]/20 transition-colors bg-white border border-gray-200 rounded-xl outline-none shadow-sm"
                                        />
                                        {formData.imageUrl && !imageFile && (
                                            <div className="flex items-center gap-2 mt-1 px-1">
                                                <img src={formData.imageUrl} className="h-10 w-10 rounded-lg object-cover border border-gray-100" alt="Current image" />
                                                <span className="text-xs text-emerald-600 font-medium">Mevcut görsel yüklü.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="hidden">
                                    <input type="url" placeholder="https://..." value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none bg-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Kategori</label>
                                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#AB0033]/20 focus:border-[#AB0033] focus:outline-none transition-all bg-white text-sm">
                                        <option value="Oyuncak">Oyuncak</option>
                                        <option value="Tekstil Giyim">Tekstil Giyim</option>
                                        <option value="Aksesuar">Aksesuar</option>
                                        <option value="Kutu Oyunları">Kutu Oyunları</option>
                                        <option value="Hediyelik">Hediyelik</option>
                                        <option value="Kitap">Kitap</option>
                                        <option value="Kırtasiye">Kırtasiye</option>
                                        <option value="Hobi Malzemeleri/Eğlence">Hobi Malzemeleri/Eğlence</option>
                                        <option value="Gıda">Gıda</option>
                                        <option value="Çocuk Kozmetik">Çocuk Kozmetik</option>
                                        <option value="Diğer">Diğer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Üretim Yeri</label>
                                    <input type="text" value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#AB0033]/20 focus:border-[#AB0033] focus:outline-none transition-all bg-white text-sm" placeholder="Türkiye, Çin vb." />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Son Fiyat Değişimi</label>
                                    <input type="date" value={formData.lastPriceChange} onChange={e => setFormData({ ...formData, lastPriceChange: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#AB0033]/20 focus:border-[#AB0033] focus:outline-none transition-all bg-white text-sm" />
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-5 bg-white border-t border-gray-100 flex items-center justify-end gap-3">
                            <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                İptal
                            </button>
                            <button type="submit" form="product-form" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-white bg-[#AB0033] hover:bg-[#F18B22] rounded-xl disabled:opacity-50 flex items-center gap-2 transition-all duration-300 active:scale-95">
                                {isSubmitting && <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                {editingProduct ? 'Güncelle' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
