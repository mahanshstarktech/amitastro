import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Share2, MessageCircle, Copy, Check, ArrowLeft, ArrowRight, Sparkles, BookOpen, Globe } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';

interface BlogPostPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenBooking: () => void;
}

export const BlogPostPage: React.FC<BlogPostPageProps> = ({
  slug,
  onNavigate,
  onOpenBooking
}) => {
  const { showToast } = useNotification();
  const { language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [readLang, setReadLang] = useState<'en' | 'hi'>(language === 'hi' ? 'hi' : 'en');


  useEffect(() => {
    setIsLoading(true);
    apiRequest<{ post: any; author: any; related: any[] }>(`/blog/posts/${slug}`)
      .then((res) => {
        setData(res);
        if (language === 'hi' && res?.post?.content_markdown_hi && res?.post?.title_hi) {
          setReadLang('hi');
        } else {
          setReadLang('en');
        }
      })
      .catch((err) => {
        showToast(err.message, 'error');
      })
      .finally(() => setIsLoading(false));
  }, [slug, showToast, language]);

  useEffect(() => {
    if (data?.post) {
      const hasHi = Boolean(data.post.content_markdown_hi && data.post.title_hi);
      if (language === 'hi' && hasHi) {
        setReadLang('hi');
      } else if (language === 'en') {
        setReadLang('en');
      }
    }
  }, [language, data]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    showToast(readLang === 'hi' ? 'आलेख लिंक क्लिपबोर्ड पर कॉपी हो गया' : 'Article link copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const titleToShare = readLang === 'hi' && data?.post?.title_hi ? data.post.title_hi : data?.post?.title;
    const shareIntro = readLang === 'hi' 
      ? `अमित जी द्वारा लिखित यह वैदिक ज्योतिषीय आलेख आपके लिए उपयोगी रहेगा: "${titleToShare}"`
      : `Thought you might appreciate this Vedic essay by Amit: "${titleToShare}"`;
    const text = encodeURIComponent(`${shareIntro}\n${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '80px 24px', maxWidth: 840 }}>
        <div className="skeleton" style={{ width: '30%', height: 20, marginBottom: 20 }} />
        <div className="skeleton" style={{ width: '90%', height: 48, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: '100%', height: 360, marginBottom: 30 }} />
      </div>
    );
  }

  if (!data || !data.post) {
    return (
      <div className="container" style={{ padding: '100px 24px', textAlign: 'center' }}>
        <h2>Article Not Found</h2>
        <button onClick={() => onNavigate('/blog')} className="apple-btn-secondary" style={{ marginTop: 20 }}>
          <ArrowLeft size={16} /> Return to Blog
        </button>
      </div>
    );
  }

  const { post, author, related } = data;
  const hasHindi = Boolean(post.content_markdown_hi && post.title_hi);
  const activeTitle = readLang === 'hi' && post.title_hi ? post.title_hi : post.title;
  const activeExcerpt = readLang === 'hi' && post.excerpt_hi ? post.excerpt_hi : post.excerpt;
  const activeContent = readLang === 'hi' && post.content_markdown_hi ? post.content_markdown_hi : post.content_markdown;

  // Simple Markdown renderer helper for headings, blockquotes, lists, and bold text
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return <h1 key={idx} className="text-h1" style={{ margin: '28px 0 14px' }}>{trimmed.replace('# ', '')}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={idx} className="text-h2" style={{ margin: '24px 0 12px', fontSize: 24 }}>{trimmed.replace('## ', '')}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx} className="text-h3" style={{ margin: '20px 0 10px', fontSize: 20 }}>{trimmed.replace('### ', '')}</h3>;
      }
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote
            key={idx}
            style={{
              borderLeft: '3px solid #C9A24B',
              paddingLeft: 18,
              margin: '20px 0',
              fontStyle: 'italic',
              color: '#3A3A6E',
              fontSize: 17,
              lineHeight: 1.6
            }}
          >
            {trimmed.replace('> ', '')}
          </blockquote>
        );
      }
      if (trimmed.startsWith('- ')) {
        return (
          <li key={idx} style={{ marginLeft: 20, marginBottom: 6, fontSize: 16.5, color: '#1D1D1F', lineHeight: 1.6 }}>
            {trimmed.replace('- ', '')}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={idx} style={{ height: 12 }} />;
      }
      return (
        <p key={idx} style={{ fontSize: 16.5, color: '#1D1D1F', lineHeight: 1.7, marginBottom: 12 }}>
          {trimmed}
        </p>
      );
    });
  };

  return (
    <article style={{ minHeight: '100vh', paddingBottom: 96 }}>
      {/* Top Breadcrumb & Share */}
      <div style={{ backgroundColor: '#F5F5F7', borderBottom: '1px solid #E5E5EA', padding: '14px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => onNavigate('/blog')}
            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, color: '#6E6E73', cursor: 'pointer', fontSize: 13.5 }}
          >
            <ArrowLeft size={15} /> {readLang === 'hi' ? 'सभी आलेख' : 'All Articles'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleShareWhatsApp}
              className="apple-btn-secondary"
              style={{ padding: '6px 12px', fontSize: 12.5, color: '#2FA84F', borderColor: '#2FA84F' }}
            >
              <MessageCircle size={14} /> WhatsApp
            </button>
            <button
              onClick={handleCopyLink}
              className="apple-btn-secondary"
              style={{ padding: '6px 12px', fontSize: 12.5 }}
            >
              {copied ? <Check size={14} color="#2FA84F" /> : <Copy size={14} />} {copied ? (readLang === 'hi' ? 'कॉपी हुआ' : 'Copied') : (readLang === 'hi' ? 'लिंक कॉपी करें' : 'Copy Link')}
            </button>
          </div>
        </div>
      </div>

      {/* Article Header */}
      <div className="container" style={{ maxWidth: 840, paddingTop: 48, paddingBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="apple-badge-gold">{post.category_name}</span>
            <span className="apple-badge-primary">
              <Clock size={12} /> {post.reading_time_min} {readLang === 'hi' ? 'मिनट पठन' : 'Min Read'}
            </span>
          </div>

          {/* Bilingual Switcher if Hindi is available */}
          {hasHindi ? (
            <div style={{ display: 'inline-flex', padding: 3, backgroundColor: '#F5F5F7', borderRadius: 10, border: '1px solid #E5E5EA' }}>
              <button
                type="button"
                onClick={() => setReadLang('en')}
                style={{
                  padding: '5px 14px',
                  fontSize: 12.5,
                  fontWeight: readLang === 'en' ? 600 : 500,
                  backgroundColor: readLang === 'en' ? '#FFFFFF' : 'transparent',
                  color: readLang === 'en' ? '#1D1D1F' : '#6E6E73',
                  borderRadius: 7,
                  border: 'none',
                  boxShadow: readLang === 'en' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer'
                }}
              >
                🇬🇧 English
              </button>
              <button
                type="button"
                onClick={() => setReadLang('hi')}
                style={{
                  padding: '5px 14px',
                  fontSize: 12.5,
                  fontWeight: readLang === 'hi' ? 600 : 500,
                  backgroundColor: readLang === 'hi' ? '#FFFFFF' : 'transparent',
                  color: readLang === 'hi' ? '#1D1D1F' : '#6E6E73',
                  borderRadius: 7,
                  border: 'none',
                  boxShadow: readLang === 'hi' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer'
                }}
              >
                🇮🇳 हिंदी संस्करण
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#8E8E93', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Globe size={13} /> {readLang === 'hi' ? 'अंग्रेजी संस्करण (हिंदी अनुवाद शीघ्र)' : 'English Edition'}
            </div>
          )}
        </div>

        {/* Notice if Hindi was requested globally but not yet available on this specific post */}
        {readLang === 'hi' && !hasHindi && (
          <div style={{ backgroundColor: '#FFF9E6', border: '1px solid #FFE58F', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13.5, color: '#874D00', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>यह आलेख वर्तमान में केवल अंग्रेजी में उपलब्ध है। हिंदी अनुवाद शीघ्र ही प्रकाशित किया जाएगा।</span>
            <button
              onClick={() => setReadLang('en')}
              className="apple-btn-secondary"
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              Switch to English
            </button>
          </div>
        )}

        <h1 className="text-display" style={{ fontSize: 38, marginBottom: 18, lineHeight: 1.2 }}>
          {activeTitle}
        </h1>

        <p className="text-body-large" style={{ fontSize: 19, color: '#6E6E73', lineHeight: 1.6, marginBottom: 28 }}>
          {activeExcerpt}
        </p>

        {/* Author Strip (Section 5) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            backgroundColor: '#F5F5F7',
            borderRadius: 16,
            border: '1px solid #E5E5EA',
            marginBottom: 36
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: '#3A3A6E',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 16
              }}
            >
              AS
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#1D1D1F' }}>
                {readLang === 'hi' ? 'अमित' : author.name}
              </div>
              <div style={{ fontSize: 12.5, color: '#6E6E73' }}>
                {readLang === 'hi' 
                  ? 'वैदिक ज्योतिषाचार्य एवं वास्तु सलाहकार · 15+ वर्षों का अनुभव'
                  : `${author.title} · ${author.experience}`}
              </div>
            </div>
          </div>

          <button
            onClick={onOpenBooking}
            className="apple-btn-primary"
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            {readLang === 'hi' ? 'परामर्श बुक करें' : 'Book Consultation'}
          </button>
        </div>

        {/* Hero Image */}
        <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 40, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <img
            src={post.hero_image_url}
            alt={activeTitle}
            style={{ width: '100%', maxHeight: 440, objectFit: 'cover' }}
          />
        </div>

        {/* Article Body Content */}
        <div style={{ fontSize: 17, color: '#1D1D1F' }}>
          {renderMarkdown(activeContent)}
        </div>

        {/* Persistent Book Consultation Bottom Banner (Section 5) */}
        <div
          className="apple-card"
          style={{
            marginTop: 56,
            padding: '36px 32px',
            backgroundColor: 'linear-gradient(135deg, #FBFBFD, #F5F5F7)',
            border: '1px solid #C9A24B',
            borderRadius: 20,
            textAlign: 'center'
          }}
        >
          <Sparkles size={24} color="#C9A24B" style={{ marginBottom: 10 }} />
          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1D1D1F', marginBottom: 8 }}>
            {readLang === 'hi' ? 'क्या आपको व्यक्तिगत ज्योतिषीय मार्गदर्शन चाहिए?' : 'Need Personalized Astrological Clarity?'}
          </h3>
          <p style={{ fontSize: 15, color: '#6E6E73', maxWidth: 540, margin: '0 auto 20px', lineHeight: 1.5 }}>
            {readLang === 'hi'
              ? 'प्रत्येक जन्म कुंडली अंगूठे के निशान की भांति विशिष्ट होती है। अपनी महादशा, गोचर और प्रामाणिक वैदिक उपायों के लिए अमित जी से सीधे जुड़ें।'
              : 'Every birth chart is as unique as a fingerprint. Discuss your specific Mahadasha and receive sattvic remedies directly from Amit.'}
          </p>
          <button
            onClick={onOpenBooking}
            className="apple-btn-gold"
            style={{ padding: '12px 28px', fontSize: 15 }}
          >
            {readLang === 'hi' ? '1-ऑन-1 व्यक्तिगत परामर्श बुक करें' : 'Book a 1-on-1 Consultation'}
          </button>
        </div>

        {/* Related Posts Rail */}
        {related && related.length > 0 && (
          <div style={{ marginTop: 64, borderTop: '1px solid #E5E5EA', paddingTop: 40 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1D1D1F', marginBottom: 24 }}>
              {readLang === 'hi' ? 'संबंधित वैदिक आलेख' : 'Related Vedic Articles'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              {related.map((rel: any) => {
                const relTitle = readLang === 'hi' && rel.title_hi ? rel.title_hi : rel.title;
                const relExcerpt = readLang === 'hi' && rel.excerpt_hi ? rel.excerpt_hi : rel.excerpt;
                return (
                  <div
                    key={rel.id}
                    className="apple-card"
                    style={{ padding: 18, cursor: 'pointer' }}
                    onClick={() => onNavigate(`/blog/post/${rel.slug}`)}
                  >
                    <img
                      src={rel.hero_image_url}
                      alt={relTitle}
                      style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }}
                    />
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: '#1D1D1F', marginBottom: 6, lineHeight: 1.3 }}>
                      {relTitle}
                    </h4>
                    {relExcerpt && (
                      <p style={{ fontSize: 12.5, color: '#6E6E73', lineHeight: 1.4, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {relExcerpt}
                      </p>
                    )}
                    <div style={{ fontSize: 12, color: '#86868B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{rel.reading_time_min} {readLang === 'hi' ? 'मिनट पठन' : 'min read'}</span>
                      {rel.title_hi && <span style={{ color: '#C9A24B', fontWeight: 600, fontSize: 11 }}>🌐 हिंदी + EN</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
