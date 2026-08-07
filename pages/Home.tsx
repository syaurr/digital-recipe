import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import Layout from '../components/Layout';
import { getGoogleDriveImageUrl } from '../utils/imageUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Resep {
  id: string;
  nama: string;
  kategori_id: string | null;
  kategori: { nama: string } | null;  // joined dari tabel kategori
  deskripsi: string | null;
  foto_url: string;
  created_at: string;
}

type SortOption = 'terbaru' | 'terlama' | 'az' | 'za';

// ─── Web Speech API type augmentation ────────────────────────────────────────

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ─── Icon Components ──────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const MicIcon = ({ active }: { active: boolean }) => (
  <svg
    width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#cd5b19' : 'currentColor'} strokeWidth="2.5" strokeLinecap="round"
    style={{ transition: 'stroke 0.3s ease' }}
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.35s ease' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="glass-card rounded-[32px] overflow-hidden animate-pulse">
    <div className="h-[220px] bg-gradient-to-br from-gray-200 to-gray-100 rounded-[24px] m-3" />
    <div className="p-6 pt-3 space-y-3">
      <div className="h-4 bg-gray-200 rounded-full w-3/4" />
      <div className="h-3 bg-gray-100 rounded-full w-full" />
      <div className="h-3 bg-gray-100 rounded-full w-2/3" />
    </div>
  </div>
);

// ─── Recipe Card ─────────────────────────────────────────────────────────────

interface RecipeCardProps {
  resep: Resep;
  index: number;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ resep, index }) => {
  const delay = Math.min(index, 11);
  const staggerClass = `slide-up-${delay + 1}`;

  return (
    <Link
      to={`/resep/${resep.id}`}
      className={`float-card glass-card rounded-[32px] overflow-hidden flex flex-col h-full group ${staggerClass}`}
      style={{ textDecoration: 'none' }}
    >
      {/* Gambar */}
      <div className="relative h-[220px] overflow-hidden m-3 rounded-[22px] bg-gray-100 shadow-inner shrink-0">
        <img
          src={getGoogleDriveImageUrl(resep.foto_url)}
          alt={resep.nama}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

        {/* Kategori Badge */}
        <div className="absolute top-3 right-3">
          <span
            style={{
              background: 'rgba(205,91,25,0.9)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            className="text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest italic shadow-lg"
          >
            {typeof resep.kategori === 'object' && resep.kategori
              ? resep.kategori.nama
              : 'MENU'}
          </span>
        </div>
      </div>

      {/* Konten */}
      <div className="p-6 pt-2 flex-grow flex flex-col">
        <h3 className="text-xl font-black text-balista-primary uppercase tracking-tight mb-2 leading-tight group-hover:text-balista-secondary transition-colors duration-300 italic">
          {resep.nama}
        </h3>
        <p className="text-balista-primary/50 text-[11px] font-medium leading-relaxed mb-6 line-clamp-2">
          {resep.deskripsi || 'SOP Menu Balista Sushi & Tea.'}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-balista-primary/8">
          <span className="text-[9px] font-black text-balista-primary/30 uppercase tracking-widest italic">
            Resep Balista
          </span>
          <div className="flex items-center gap-1.5 text-balista-secondary font-black text-[10px] uppercase tracking-tight transition-all duration-300 group-hover:gap-2.5">
            Buka
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ─── Group Accordion ─────────────────────────────────────────────────────────

interface GroupAccordionProps {
  kategori: string;
  recipes: Resep[];
  defaultOpen?: boolean;
}

const GroupAccordion: React.FC<GroupAccordionProps> = ({ kategori, recipes, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mb-8 animate-slide-up">
      {/* Header Accordion */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 w-full text-left mb-4 group"
      >
        <div
          className="flex items-center gap-3 flex-1 glass rounded-2xl px-5 py-3.5 transition-all duration-300
                     hover:shadow-md hover:bg-white/60"
        >
          <div className="w-2 h-2 rounded-full bg-balista-secondary shadow-sm shadow-balista-secondary/50 shrink-0" />
          <span className="font-black text-balista-primary uppercase tracking-wider text-sm italic flex-1">
            {kategori}
          </span>
          <span className="text-[10px] font-bold text-balista-primary/40 uppercase tracking-widest mr-2">
            {recipes.length} resep
          </span>
          <span className="text-balista-primary/40 group-hover:text-balista-secondary transition-colors duration-300">
            <ChevronIcon open={open} />
          </span>
        </div>
      </button>

      {/* Konten Accordion dengan animasi CSS */}
      <div
        ref={contentRef}
        className="accordion-content"
        style={{
          maxHeight: open ? `${(contentRef.current?.scrollHeight || 9999) + 200}px` : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-2">
          {recipes.map((resep, i) => (
            <RecipeCard key={resep.id} resep={resep} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Home Component ──────────────────────────────────────────────────────

const Home = () => {
  const [recipes, setRecipes] = useState<Resep[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('terbaru');
  const [groupByKategori, setGroupByKategori] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const [categories, setCategories] = useState<string[]>(['Semua']);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'terbaru', label: 'Terbaru' },
    { value: 'terlama', label: 'Terlama' },
    { value: 'az',      label: 'A → Z' },
    { value: 'za',      label: 'Z → A' },
  ];

  useEffect(() => {
    fetchRecipes();
    fetchCategories();
  }, []);

  // Ambil daftar kategori dari DB secara dinamis
  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from('kategori')
        .select('nama')
        .order('nama', { ascending: true });
      if (data) {
        setCategories(['Semua', ...data.map((c: any) => c.nama)]);
      }
    } catch {
      // fallback: biarkan categories default ['Semua']
    }
  };

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      // JOIN ke tabel kategori agar nama kategori selalu tersedia
      const { data, error } = await supabase
        .from('resep')
        .select('*, kategori(nama)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (err) {
      console.error('Gagal memuat resep:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Voice Search ────────────────────────────────────────────────────────────
  const startVoiceSearch = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Browser Anda tidak mendukung Voice Search. Gunakan Chrome atau Edge.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as SpeechRecognitionResultList)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join('');

      // Bersihkan kata "cari" atau "resep" dari awal kalimat
      const cleaned = transcript
        .replace(/^(cari resep|cari|resep)\s*/i, '')
        .trim();

      setSearchQuery(cleaned);
      searchInputRef.current?.focus();
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isListening]);

  // ── Sorting & Filtering ─────────────────────────────────────────────────────
  const processedRecipes = React.useMemo((): Resep[] => {
    // Helper: ambil nama kategori dari join
    const getKatNama = (r: Resep) =>
      (r.kategori && typeof r.kategori === 'object' ? r.kategori.nama : null) || '';

    let result = recipes
      // Filter hanya yang ada foto
      .filter(r => r.foto_url && r.foto_url !== 'NULL' && r.foto_url.trim() !== '')
      // Filter kategori
      .filter(r => {
        if (filter === 'Semua') return true;
        return getKatNama(r).toLowerCase().trim() === filter.toLowerCase().trim();
      })
      // Filter search query (nama atau kategori)
      .filter(r => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (r.nama || '').toLowerCase().includes(q) ||
          getKatNama(r).toLowerCase().includes(q) ||
          (r.deskripsi || '').toLowerCase().includes(q)
        );
      });

    // Sorting
    switch (sortBy) {
      case 'az':
        result.sort((a, b) => (a.nama || '').localeCompare(b.nama || '', 'id'));
        break;
      case 'za':
        result.sort((a, b) => (b.nama || '').localeCompare(a.nama || '', 'id'));
        break;
      case 'terbaru':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'terlama':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
    }

    return result;
  }, [recipes, filter, searchQuery, sortBy]);

  // Group by kategori
  const groupedRecipes = React.useMemo(() => {
    const groups: Record<string, Resep[]> = {};
    processedRecipes.forEach(r => {
      // Gunakan nama dari join, bukan field string lama
      const key =
        (r.kategori && typeof r.kategori === 'object' ? r.kategori.nama : null)
        || 'Lainnya';
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  }, [processedRecipes]);

  const kategoriKeys = Object.keys(groupedRecipes).sort();

  return (
    <Layout title="Galeri Resep Balista">
      <div className="pb-24 text-left font-sans">

        {/* ─── TOOLBAR UTAMA ─── */}
        <div className="mb-8 space-y-4 animate-slide-up">

          {/* Row 1: Search + Sort + Group */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">

            {/* Search Bar Animasi Expand */}
            <div
              className="relative flex-1 min-w-0"
              style={{
                transition: 'flex 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                flex: searchFocused ? '2' : '1',
              }}
            >
              {/* Icon Search */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-balista-primary/40 pointer-events-none z-10">
                <SearchIcon />
              </div>

              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder={isListening ? '🎙 Mendengarkan...' : 'Cari nama menu atau bahan...'}
                className="input-glow glass-card w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm font-medium text-balista-primary
                           placeholder:text-balista-primary/30 outline-none transition-all duration-300
                           border border-transparent focus:border-balista-secondary/30"
              />

              {/* Mic Button */}
              <button
                onClick={startVoiceSearch}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-300 ${
                  isListening
                    ? 'bg-balista-secondary/15 animate-pulse'
                    : 'hover:bg-balista-secondary/10 text-balista-primary/40 hover:text-balista-secondary'
                }`}
                title="Voice Search"
                aria-label={isListening ? 'Berhenti mendengar' : 'Mulai voice search'}
              >
                <MicIcon active={isListening} />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="glass-card appearance-none pl-4 pr-10 py-3.5 rounded-2xl text-xs font-bold text-balista-primary
                           uppercase tracking-widest outline-none cursor-pointer
                           transition-all duration-300 hover:shadow-md border border-transparent w-full md:w-auto"
                style={{ minWidth: 130 }}
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value} style={{ background: '#f1d9a5', fontFamily: 'Inter, sans-serif' }}>
                    ↕ {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-balista-primary/40">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            {/* Toggle Group */}
            <button
              onClick={() => setGroupByKategori(g => !g)}
              className={`shrink-0 flex items-center gap-2 px-5 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest
                         transition-all duration-300 btn-glow ${
                           groupByKategori
                             ? 'bg-balista-primary text-balista-accent shadow-lg shadow-balista-primary/25'
                             : 'glass-card text-balista-primary hover:shadow-md'
                         }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              {groupByKategori ? 'Grouped' : 'Group'}
            </button>
          </div>

          {/* Row 2: Filter Kategori Chips */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest
                           transition-all duration-300 btn-glow ${
                             filter === cat
                               ? 'bg-balista-secondary text-white shadow-lg shadow-balista-secondary/30 -translate-y-0.5'
                               : 'glass-card text-balista-primary/60 hover:text-balista-secondary hover:shadow-md hover:-translate-y-0.5'
                           }`}
              >
                {cat}
              </button>
            ))}

            {/* Info count */}
            {!loading && (
              <div className="ml-auto flex items-center">
                <span className="text-[10px] font-bold text-balista-primary/35 uppercase tracking-widest">
                  {processedRecipes.length} menu
                  {searchQuery && ` · "${searchQuery}"`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ─── KONTEN RESEP ─── */}
        {loading ? (
          /* Skeleton Loading */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <SkeletonCard key={n} />)}
          </div>
        ) : processedRecipes.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
            <div
              className="w-20 h-20 rounded-3xl mb-6 flex items-center justify-center glass animate-float"
              style={{ boxShadow: '0 16px 40px rgba(3,63,63,0.1)' }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(3,63,63,0.35)" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
            <p className="text-balista-primary/40 font-black uppercase tracking-[0.2em] mb-2 italic text-sm">
              {searchQuery ? `Tidak ada resep untuk "${searchQuery}"` : 'Belum ada menu untuk kategori ini'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-balista-secondary text-xs font-bold uppercase tracking-widest hover:underline"
              >
                Hapus pencarian →
              </button>
            )}
          </div>
        ) : groupByKategori ? (
          /* ── Mode Group by Kategori (Accordion) ── */
          <div>
            {kategoriKeys.map((kat, i) => (
              <GroupAccordion
                key={kat}
                kategori={kat}
                recipes={groupedRecipes[kat]}
                defaultOpen={i === 0}
              />
            ))}
          </div>
        ) : (
          /* ── Mode Grid Biasa ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processedRecipes.map((resep, i) => (
              <RecipeCard key={resep.id} resep={resep} index={i} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Home;