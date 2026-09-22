import React, { useState, useEffect } from 'react';
import { Sparkles, Search, ArrowRight, Clock, Tag } from 'lucide-react';
import { apiRequest } from '../../utils/api';

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
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>(categorySlug || 'all');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  const categoryPills = [
    { name: 'All Topics', slug: 'all' },
    { name: 'Kundli & Horoscope', slug: 'kundli' },
    { name: 'Vastu Shastra', slug: 'vastu' },
    { name: 'Planetary Transits', slug: 'transits' },
    { name: 'Vedic Philosophy', slug: 'vedic' },
    { name: 'Gemstones', slug: 'gemstones' },
    { name: 'Numerology', slug: 'numerology' }
  ];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96 }}>
      {/* Blog Hero Header */}
      <section style={{ backgroundColor: '#F5F5F7', padding: '64px 0 48px', borderBottom: '1px solid #E5E5EA' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="apple-badge-gold">Authentic Astrological Library</span>
          <h1 className="text-display" style={{ fontSize: 42, marginTop: 10, marginBottom: 12 }}>
            The Amit Astro Chronicle
          </h1>
          <p className="text-body-large" style={{ maxWidth: 640, margin: '0 auto 28px' }}>
            In-depth Vedic Jyotish essays, Vastu Shastra principles, planetary transits, and remedial gemmology written directly by <strong>Amit</strong>.
          </p>

          {/* Search bar */}
          <div style={{ maxWidth: 460, margin: '0 auto', position: 'relative' }}>
            <Search size={18} color="#A1A1A6" style={{ position: 'absolute', left: 16, top: 14 }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic, transit, or question..."
              className="apple-input"
              style={{ paddingLeft: 46, borderRadius: 9999 }}
            />
          </div>
        </div>
      </section>

      {/* Category Pills Filter */}
      <div style={{ borderBottom: '1px solid #E5E5EA', backgroundColor: '#FFFFFF', position: 'sticky', top: 58, zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '14px 24px' }}>
          {categoryPills.map((cp) => {
            const active = selectedCat === cp.slug;
            return (
              <button
                key={cp.slug}
                onClick={() => setSelectedCat(cp.slug)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '8px 16px',
                  borderRadius: 9999,
                  border: active ? '1px solid #3A3A6E' : '1px solid #E5E5EA',
                  backgroundColor: active ? '#3A3A6E' : '#F5F5F7',
                  color: active ? '#FFFFFF' : '#1D1D1F',
                  fontSize: 13.5,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cp.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="container" style={{ marginTop: 44 }}>
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
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <h3 style={{ fontSize: 20, color: '#1D1D1F', marginBottom: 8 }}>No articles found</h3>
            <p style={{ color: '#6E6E73', fontSize: 15 }}>Try clearing your search query or choosing another category.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 28 }}>
            {posts.map((post) => (
              <div
                key={post.id}
                className="apple-card"
                style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                onClick={() => onNavigate(`/blog/post/${post.slug}`)}
              >
                <img
                  src={post.hero_image_url}
                  alt={post.title}
                  style={{ width: '100%', height: 210, objectFit: 'cover' }}
                />
                <div style={{ padding: '24px 22px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span className="apple-badge-gold" style={{ fontSize: 11.5 }}>
                        {post.category_name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#86868B' }}>
                        <Clock size={13} /> {post.reading_time_min} min read
                      </div>
                    </div>
                    <h2 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F', marginBottom: 10, lineHeight: 1.35 }}>
                      {post.title}
                    </h2>
                    <p style={{ fontSize: 14, color: '#6E6E73', lineHeight: 1.5, marginBottom: 16 }}>
                      {post.excerpt}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E5EA', paddingTop: 14, marginTop: 8 }}>
                    <div style={{ fontSize: 12.5, color: '#1D1D1F', fontWeight: 500 }}>
                      By Amit
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#3A3A6E', fontSize: 13, fontWeight: 600 }}>
                      Read Article <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
