import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  ArrowRight, 
  Clock, 
  Tag, 
  PanelLeft, 
  X, 
  Compass, 
  Home, 
  Star, 
  Users, 
  BookOpen, 
  Orbit,
  Globe
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useHeaderActions } from '../../context/HeaderActionsContext';
import { useLanguage } from '../../context/LanguageContext';

interface BlogPageProps {
  categorySlug?: string;
  onNavigate: (path: string) => void;
  onOpenBooking: () => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({
  categorySlug,
  onNavigate,
  onOpenBooking
}) => {
  const { language, setLanguage } = useLanguage();
  const [langFilter, setLangFilter] = useState<'all' | 'en' | 'hi'>('all');

  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>(categorySlug || 'all');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    apiRequest('/blog/categories')
      .then((res) => setCategories(res.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    let url = '/blog/posts?';
    if (selectedCat && selectedCat !== 'all') {
      url += `category=${selectedCat}&`;
    }
    if (search) {
      url += `search=${encodeURIComponent(search)}&`;
    }

    apiRequest<{ posts: any[] }>(url)
      .then((res) => {
        setPosts(res.posts || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [selectedCat, search]);

  const { setHeaderActions } = useHeaderActions();

  const categoryPills = [
    { name: 'All Topics', slug: 'all', icon: BookOpen },
    { name: 'Kundli & Horoscope', slug: 'kundli', icon: Compass },
    { name: 'Vastu Shastra', slug: 'vastu', icon: Home },
    { name: 'Planetary Transits', slug: 'transits', icon: Orbit },
    { name: 'Vedic Philosophy', slug: 'vedic', icon: Sparkles },
    { name: 'Gemstones', slug: 'gemstones', icon: Star },
    { name: 'Numerology', slug: 'numerology', icon: Users }
  ];

  const activeCategory = categoryPills.find((c) => c.slug === selectedCat) || categoryPills[0];

  const handleSelectCategory = (slug: string) => {
    setSelectedCat(slug);
  };

  // Register Apple top navigation actions (Search & Categories curtain)
  useEffect(() => {
    setHeaderActions({
      optionsTitle: 'Article Topics',
      options: categoryPills.map((cp) => ({
        id: cp.slug,
        label: cp.name,
        icon: cp.icon
      })),
      activeOptionId: selectedCat,
      onSelectOption: (slug) => handleSelectCategory(slug),
      hasSearch: true,
      searchPlaceholder: 'Search essays, transits, remedies...',
      searchQuery: search,
      onSearchChange: (q) => setSearch(q)
    });

    return () => {
      setHeaderActions(null);
    };
  }, [selectedCat, search]);

  const filteredPosts = posts.filter((post) => {
    if (langFilter === 'hi') {
      return Boolean(post.title_hi && post.content_markdown_hi);
    }
    if (langFilter === 'en') {
      return Boolean(post.title && post.content_markdown);
    }
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96, backgroundColor: '#FAFAFC' }}>
      {/* Blog Hero Header */}
      <section style={{ backgroundColor: '#F5F5F7', padding: '52px 0 38px', borderBottom: '1px solid #E5E5EA' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="apple-badge-gold">Authentic Astrological Library</span>
          <h1 className="text-display" style={{ fontSize: 38, marginTop: 10, marginBottom: 12 }}>
            The Amit Astro Chronicle
          </h1>
          <p className="text-body-large" style={{ maxWidth: 640, margin: '0 auto 24px', color: '#6E6E73', fontSize: 16 }}>
            In-depth Vedic Jyotish essays, Vastu Shastra principles, planetary transits, and remedial gemmology written directly by <strong>Amit</strong>.
          </p>

          {/* Search bar (Desktop only - Mobile uses top nav search) */}
          <div className="desktop-only-search" style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
            <Search size={18} color="#86868B" style={{ position: 'absolute', left: 16, top: 13 }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search essays, planetary transits, remedies..."
              className="apple-input"
              style={{ paddingLeft: 46, borderRadius: 9999, backgroundColor: '#FFFFFF', fontSize: 14 }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: 13,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#86868B',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Bilingual Language Switcher Pills */}
          <div style={{ display: 'inline-flex', padding: 3, backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E5EA', marginTop: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <button
              type="button"
              onClick={() => setLangFilter('all')}
              style={{
                padding: '5px 14px',
                fontSize: 12.5,
                fontWeight: langFilter === 'all' ? 600 : 500,
                backgroundColor: langFilter === 'all' ? '#3A3A6E' : 'transparent',
                color: langFilter === 'all' ? '#FFFFFF' : '#6E6E73',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🌐 All Editions ({posts.length})
            </button>
            <button
              type="button"
              onClick={() => setLangFilter('en')}
              style={{
                padding: '5px 14px',
                fontSize: 12.5,
                fontWeight: langFilter === 'en' ? 600 : 500,
                backgroundColor: langFilter === 'en' ? '#3A3A6E' : 'transparent',
                color: langFilter === 'en' ? '#FFFFFF' : '#6E6E73',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🇬🇧 English
            </button>
            <button
              type="button"
              onClick={() => setLangFilter('hi')}
              style={{
                padding: '5px 14px',
                fontSize: 12.5,
                fontWeight: langFilter === 'hi' ? 600 : 500,
                backgroundColor: langFilter === 'hi' ? '#3A3A6E' : 'transparent',
                color: langFilter === 'hi' ? '#FFFFFF' : '#6E6E73',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🇮🇳 हिंदी (Hindi)
            </button>
          </div>
        </div>
      </section>

      {/* Main Layout Container (Desktop Sidebar + Posts) */}
      <div className="container" style={{ maxWidth: 1360, marginTop: 32 }}>
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
          {/* Desktop Left Sidebar */}
          <aside
            style={{
              width: sidebarCollapsed ? 72 : 280,
              flexShrink: 0,
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E5EA',
              borderRadius: 20,
              padding: sidebarCollapsed ? '16px 10px' : '20px 16px',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
              position: 'sticky',
              top: 76,
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="blog-desktop-sidebar"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid #E5E5EA'
              }}
            >
              {!sidebarCollapsed && (
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1D1D1F', letterSpacing: '-0.01em' }}>
                  Topics & Categories
                </span>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 8,
                  color: '#3A3A6E',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background 0.15s ease'
                }}
                title={sidebarCollapsed ? 'Expand categories' : 'Collapse categories'}
                aria-label={sidebarCollapsed ? 'Expand categories' : 'Collapse categories'}
              >
                <PanelLeft size={19} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {categoryPills.map((cp) => {
                const IconComp = cp.icon;
                const active = selectedCat === cp.slug;
                return (
                  <button
                    key={cp.slug}
                    onClick={() => handleSelectCategory(cp.slug)}
                    className={`sidebar-nav-item ${active ? 'active' : ''}`}
                    title={sidebarCollapsed ? cp.name : undefined}
                    style={{
                      justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                      padding: sidebarCollapsed ? '12px' : '10px 12px'
                    }}
                  >
                    <div className="sidebar-nav-item-content">
                      <IconComp size={18} color={active ? '#3A3A6E' : '#6E6E73'} />
                      {!sidebarCollapsed && <span>{cp.name}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Posts Main Content */}
          <main style={{ flex: 1, minWidth: 0 }}>
            {/* Filter Status Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontSize: 14, color: '#6E6E73' }}>
                Showing articles for <strong style={{ color: '#1D1D1F' }}>{activeCategory.name}</strong>
                {search && <> matching "<strong style={{ color: '#1D1D1F' }}>{search}</strong>"</>}
                {langFilter !== 'all' && (
                  <span style={{ marginLeft: 8, fontSize: 12, padding: '2px 8px', borderRadius: 6, backgroundColor: '#F0F0F5', color: '#3A3A6E', fontWeight: 600 }}>
                    {langFilter === 'hi' ? '🇮🇳 Hindi Only' : '🇬🇧 English Only'}
                  </span>
                )}
              </div>

              {!isLoading && (
                <div style={{ fontSize: 13, color: '#86868B' }}>
                  {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}
                </div>
              )}
            </div>

            {isLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="apple-card" style={{ height: 380, padding: 20 }}>
                    <div className="skeleton" style={{ width: '100%', height: 180, marginBottom: 16 }} />
                    <div className="skeleton" style={{ width: '40%', height: 16, marginBottom: 12 }} />
                    <div className="skeleton" style={{ width: '90%', height: 24, marginBottom: 8 }} />
                    <div className="skeleton" style={{ width: '70%', height: 24 }} />
                  </div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div 
                className="apple-card"
                style={{ textAlign: 'center', padding: '80px 24px', backgroundColor: '#FFFFFF' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#86868B' }}>
                  <Search size={22} />
                </div>
                <h3 style={{ fontSize: 20, color: '#1D1D1F', marginBottom: 8 }}>
                  {language === 'hi' ? 'कोई आलेख नहीं मिला' : 'No articles found'}
                </h3>
                <p style={{ color: '#6E6E73', fontSize: 15, maxWidth: 440, margin: '0 auto 20px' }}>
                  {language === 'hi'
                    ? 'कृपया खोज शब्द बदलें अथवा अन्य विषय चुनें।'
                    : 'Try clearing your search query or selecting another astrological discipline from the categories menu.'}
                </p>
                {(search || selectedCat !== 'all' || langFilter !== 'all') && (
                  <button
                    onClick={() => { setSearch(''); setSelectedCat('all'); setLangFilter('all'); }}
                    className="apple-btn-secondary"
                    style={{ fontSize: 13.5 }}
                  >
                    {language === 'hi' ? 'सभी आलेख देखें' : 'View All Articles'}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                {filteredPosts.map((post) => {
                  const isHiMode = (language === 'hi' || langFilter === 'hi') && Boolean(post.title_hi);
                  const cardTitle = isHiMode ? post.title_hi : post.title;
                  const cardExcerpt = isHiMode ? (post.excerpt_hi || post.excerpt) : post.excerpt;
                  const hasBothLangs = Boolean(post.title_hi && post.title);

                  return (
                    <div
                      key={post.id}
                      className="apple-card"
                      style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                      onClick={() => onNavigate(`/blog/post/${post.slug}`)}
                    >
                      <img
                        src={post.hero_image_url}
                        alt={cardTitle}
                        style={{ width: '100%', height: 210, objectFit: 'cover' }}
                      />
                      <div style={{ padding: '24px 22px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span className="apple-badge-gold" style={{ fontSize: 11.5 }}>
                                {post.category_name}
                              </span>
                              {hasBothLangs && (
                                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, backgroundColor: '#FFF7E6', color: '#D48806', border: '1px solid #FFE58F', fontWeight: 600 }}>
                                  🌐 हिंदी + EN
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#86868B' }}>
                              <Clock size={13} /> {post.reading_time_min} {isHiMode ? 'मिनट पठन' : 'min read'}
                            </div>
                          </div>
                          <h2 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F', marginBottom: 10, lineHeight: 1.35 }}>
                            {cardTitle}
                          </h2>
                          <p style={{ fontSize: 14, color: '#6E6E73', lineHeight: 1.5, marginBottom: 16 }}>
                            {cardExcerpt}
                          </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E5EA', paddingTop: 14, marginTop: 8 }}>
                          <div style={{ fontSize: 12.5, color: '#1D1D1F', fontWeight: 500 }}>
                            {isHiMode ? 'अमित द्वारा' : 'By Amit'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#3A3A6E', fontSize: 13, fontWeight: 600 }}>
                            {isHiMode ? 'आलेख पढ़ें' : 'Read Article'} <ArrowRight size={14} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
      <style>{`
        @media (max-width: 1039px) {
          .desktop-only-search { display: none !important; }
          .blog-desktop-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
};

