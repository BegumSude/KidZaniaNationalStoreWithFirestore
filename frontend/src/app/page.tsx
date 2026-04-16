"use client";

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import kidzaniaLogo from '../../../images/KidZaniaLogo.png';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Product {
    id: string;
    productCode: string;
    name: string;
    type: string;
    stockAmount: number;
    warehouseNo: string;
    warehouse: string;
    unit: string;
    barcode: string;
    price: number;
    imageUrl: string;
    category: string;
    stockStatus: 'In Stock' | 'Out of Stock';
    description?: string;
    origin?: string;
    visible: boolean;
    lastPriceChange?: string;
}

const mapFirestoreDataToProduct = (id: string, data: any): Product => {
    const stockAmount = Number(data['Stok Miktarı']) || 0;
    return {
        id,
        productCode: data['Malzeme Kodu'] || '',
        name: data['Malzeme Açıklaması'] || 'İsimsiz Ürün',
        type: data['Malzeme Türü'] || '',
        stockAmount,
        warehouseNo: String(data['Ambar No'] || ''),
        warehouse: data['Ambar'] || '',
        unit: data['Birim'] || '',
        barcode: String(data['Barkod'] || ''),
        price: Number(data['SonSatis']) || 0,
        imageUrl: data['imageUrl'] || '',
        category: data['Category'] || 'Diğer',
        stockStatus: stockAmount > 0 ? 'In Stock' : 'Out of Stock',
        description: data['description'] || '',
        origin: data['origin'] || '',
        visible: data['visible'] !== false,
        lastPriceChange: data['lastPriceChange'] || '',
    };
};

type SortOption = 'name-asc' | 'price-asc' | 'price-desc';

const formatPrice = (price?: number) => {
    if (price === undefined || price === null || isNaN(price)) return '-';
    return `${price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
};

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        const [year, month, day] = dateString.split('-');
        return `${day}.${month}.${year}`;
    } catch {
        return dateString;
    }
};

const truncate = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}…`;
};

const getPaginationRange = (currentPage: number, totalPages: number) => {
    const delta = 2;
    const range: number[] = [];

    for (
        let i = Math.max(2, currentPage - delta);
        i <= Math.min(totalPages - 1, currentPage + delta);
        i++
    ) {
        range.push(i);
    }

    if (currentPage - delta > 2) range.unshift(-1);
    if (currentPage + delta < totalPages - 1) range.push(-1);

    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);

    return range;
};

export default function CatalogPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<SortOption>('name-asc');
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 12;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'Products'));
                const mappedProducts = querySnapshot.docs.map((doc) =>
                    mapFirestoreDataToProduct(doc.id, doc.data())
                );
                setProducts(mappedProducts);
            } catch (err: any) {
                console.error(err);
                setError(`Failed to load products from Firestore: ${err.message || String(err)}`);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const categories = [
        'all',
        'Oyuncak',
        'Tekstil Giyim',
        'Aksesuar',
        'Kutu Oyunları',
        'Hediyelik',
        'Kitap',
        'Kırtasiye',
        'Hobi Malzemeleri/Eğlence',
        'Gıda',
        'Çocuk Kozmetik',
        'Diğer',
    ];

    const filteredAndSorted = useMemo(() => {
        let result = [...products].filter(p => p.visible);  // only show visible products
        if (selectedCategory !== 'all') result = result.filter((p) => p.category === selectedCategory);
        if (search.trim()) {
            const term = search.toLowerCase();
            result = result.filter((p) => {
                const fields = [p.name, p.description ?? '', p.origin ?? ''];
                return fields.some((field) => field.toLowerCase().includes(term));
            });
        }
        if (sortBy === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortBy === 'price-asc') result.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
        else if (sortBy === 'price-desc') result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        return result;
    }, [products, search, selectedCategory, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / itemsPerPage));

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSorted.slice(start, start + itemsPerPage);
    }, [filteredAndSorted, currentPage]);

    const handleCategoryChange = (value: string) => { setSelectedCategory(value); setCurrentPage(1); };
    const handleSearchChange = (value: string) => { setSearch(value); setCurrentPage(1); };
    const handleSortChange = (value: SortOption) => { setSortBy(value); setCurrentPage(1); };

    return (
        <div className="min-h-screen bg-white text-gray-900">
            {/* Navbar */}
            <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative h-12 w-40 shrink-0">
                            <Image
                                src={kidzaniaLogo}
                                alt="KidZania logo"
                                priority
                                className="h-full w-full object-contain"
                            />
                        </div>
                        <div className="hidden sm:block h-6 w-px bg-gray-200" />
                        <h1 className="hidden sm:block text-sm font-semibold tracking-wide text-[#AB0033] uppercase">
                            NATIONAL STORE
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 font-medium">
                            <span className="font-bold text-gray-900">{filteredAndSorted.length}</span> ürün
                        </span>
                        {user && (
                            <>
                                <span className="text-xs text-gray-400 hidden sm:inline">{user.email}</span>
                                <button
                                    onClick={async () => { await auth.signOut(); sessionStorage.removeItem('isAdmin'); router.push('/login'); }}
                                    className="text-xs font-medium text-[#AB0033] hover:text-[#F18B22] transition-colors duration-200 underline underline-offset-2"
                                >
                                    Çıkış Yap
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => { const isAdmin = sessionStorage.getItem('isAdmin'); router.push(isAdmin ? '/admin' : '/admin/login'); }}
                            className="h-9 w-9 flex items-center justify-center rounded-full bg-[#AB0033] text-white hover:bg-[#F18B22] transition-all duration-300 shadow-sm"
                            title="Admin Panel"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Bar */}
                <div className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#AB0033] mb-1">KidZania</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Tüm Ürünler</h2>
                </div>

                {/* Filters */}
                <section className="mb-8 bg-gray-50 rounded-2xl border border-gray-100 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="w-full sm:max-w-sm">
                            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Ara</label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                                        <circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Ürün adı, barkod, menşei..."
                                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#AB0033] focus:outline-none focus:ring-2 focus:ring-[#AB0033]/20 transition-all duration-200"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 sm:w-96">
                            <div className="w-full sm:w-1/2">
                                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Sırala</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#AB0033] focus:outline-none focus:ring-2 focus:ring-[#AB0033]/20 transition-all duration-200"
                                >
                                    <option value="name-asc">Ad (A → Z)</option>
                                    <option value="price-asc">Fiyat (düşük → yüksek)</option>
                                    <option value="price-desc">Fiyat (yüksek → düşük)</option>
                                </select>
                            </div>
                            <div className="w-full sm:w-1/2">
                                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Kategoriler</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => handleCategoryChange(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#AB0033] focus:outline-none focus:ring-2 focus:ring-[#AB0033]/20 transition-all duration-200"
                                >
                                    {categories.map((category) => (
                                        <option key={category} value={category}>
                                            {category === 'all' ? 'Tüm Kategoriler' : category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Product Grid */}
                <section className="flex-1">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="flex items-center gap-3 text-gray-400">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#AB0033]/40" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#AB0033]" />
                                </span>
                                <span className="text-sm font-medium">Ürünler yükleniyor...</span>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    ) : filteredAndSorted.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 text-center">
                            <p className="text-sm font-semibold text-gray-500">Eşleşen ürün bulunamadı</p>
                            <p className="mt-1 text-xs text-gray-400">Filtrelerinizi temizlemeyi veya arama teriminizi değiştirmeyi deneyin.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {paginatedProducts.map((product) => (
                                    <article
                                        key={product.id}
                                        className="group flex flex-col overflow-hidden rounded-xl bg-white border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                                        onClick={() => setSelectedProduct(product)}
                                    >
                                        <div className="relative overflow-hidden bg-gray-50">
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                                />
                                            ) : (
                                                <div className="flex h-44 w-full items-center justify-center bg-gray-50">
                                                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-300">Görsel Yok</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-1 flex-col gap-3 p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="space-y-1 flex-1 min-w-0">
                                                    <h2 className="line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-[#AB0033] transition-colors">{product.name}</h2>
                                                    <div className="flex flex-col gap-0.5 mt-1">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Üretim Yeri:</span>
                                                            <span className="text-[10px] font-semibold text-gray-600 uppercase">{product.origin || '-'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Fiyat Değ:</span>
                                                            <span className="text-[10px] font-semibold text-gray-600 uppercase">{formatDate(product.lastPriceChange)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-black text-[#AB0033] shrink-0">{formatPrice(product.price)}</p>
                                            </div>

                                            {product.description && (
                                                <p className="text-xs leading-relaxed text-gray-500">{truncate(product.description, 100)}</p>
                                            )}

                                            <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                                                <p className="text-[10px] text-gray-400 font-medium italic">KDV dahildir.</p>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }}
                                                    className="inline-flex items-center gap-1 rounded-full bg-[#AB0033]/10 hover:bg-[#AB0033] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#AB0033] hover:text-white transition-all duration-300"
                                                >
                                                    Detay ↗
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="mt-10 flex items-center justify-center">
                                    <nav className="isolate inline-flex -space-x-px rounded-xl overflow-hidden border border-gray-200 shadow-sm" aria-label="Pagination">
                                        <button
                                            type="button"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            className="relative inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                            </svg>
                                        </button>
                                        {getPaginationRange(currentPage, totalPages).map((page, index) => {
                                            if (page === -1) return (
                                                <span key={`e-${index}`} className="inline-flex items-center px-4 py-2.5 text-sm text-gray-400 bg-white border-x border-gray-200">...</span>
                                            );
                                            const isActive = page === currentPage;
                                            return (
                                                <button
                                                    key={page}
                                                    type="button"
                                                    onClick={() => setCurrentPage(page as number)}
                                                    className={`relative inline-flex items-center px-4 py-2.5 text-sm font-semibold border-x border-gray-200 transition-all duration-200 ${isActive ? 'bg-[#AB0033] text-white z-10' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            className="relative inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </button>
                                    </nav>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>

            {/* Product Detail Modal */}
            {selectedProduct && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm"
                    onClick={() => setSelectedProduct(null)}
                >
                    <div
                        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedProduct(null)}
                            className="absolute right-3 top-3 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors text-xl font-light"
                        >
                            ×
                        </button>

                        {selectedProduct.imageUrl && (
                            <div className="relative h-64 w-full overflow-hidden rounded-t-2xl">
                                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="h-full w-full object-cover" />
                            </div>
                        )}

                        <div className="p-6 pt-10">
                            <div className="flex flex-col gap-4">
                                {/* Name + Price */}
                                <div className="flex justify-between items-start gap-4">
                                    <h2 className="text-xl font-bold text-gray-900 leading-tight">{selectedProduct.name}</h2>
                                    <p className="text-xl font-black text-[#AB0033] shrink-0">{formatPrice(selectedProduct.price)}</p>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-4 pt-5 border-t border-gray-100">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Üretim Yeri</span>
                                        <span className="text-sm font-bold text-gray-800">{selectedProduct.origin || '-'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Son Fiyat Değişimi</span>
                                        <span className="text-sm font-bold text-gray-800">{formatDate(selectedProduct.lastPriceChange)}</span>
                                    </div>
                                </div>

                                {/* KDV Note */}
                                <div className="mt-2 pt-4 border-t border-gray-100 italic">
                                    <p className="text-xs text-gray-500 font-medium">ℹ️ Fiyatlara KDV dahildir.</p>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => setSelectedProduct(null)}
                                    className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-200"
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
