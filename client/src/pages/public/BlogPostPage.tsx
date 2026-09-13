import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Share2, MessageCircle, Copy, Check, ArrowLeft, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';

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
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiRequest<{ post: any; author: any; related: any[] }>(`/blog/posts/${slug}`)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        showToast(err.message, 'error');
      })
      .finally(() => setIsLoading(false));
  }, [slug, showToast]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    showToast('Article link copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Thought you might appreciate this Vedic essay by Amit Soni: "${data?.post?.title}"\n${window.location.href}`);
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
            <ArrowLeft size={15} /> All Articles
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
              {copied ? <Check size={14} color="#2FA84F" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Article Header */}
      <div className="container" style={{ maxWidth: 840, paddingTop: 48, paddingBottom: 32 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <span className="apple-badge-gold">{post.category_name}</span>
          <span className="apple-badge-primary">
            <Clock size={12} /> {post.reading_time_min} Min Read
          </span>
        </div>

        <h1 className="text-display" style={{ fontSize: 38, marginBottom: 18, lineHeight: 1.2 }}>
          {post.title}
        </h1>

        <p className="text-body-large" style={{ fontSize: 19, color: '#6E6E73', lineHeight: 1.6, marginBottom: 28 }}>
          {post.excerpt}
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
                {author.name}
              </div>
              <div style={{ fontSize: 12.5, color: '#6E6E73' }}>
                {author.title} · {author.experience}
              </div>
            </div>
          </div>

          <button
            onClick={onOpenBooking}
            className="apple-btn-primary"
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            Book Consultation
          </button>
        </div>

        {/* Hero Image */}
        <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 40, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <img
            src={post.hero_image_url}
            alt={post.title}
            style={{ width: '100%', maxHeight: 440, objectFit: 'cover' }}
          />
        </div>

        {/* Article Body Content */}
        <div style={{ fontSize: 17, color: '#1D1D1F' }}>
          {renderMarkdown(post.content_markdown)}
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
            Need Personalized Astrological Clarity?
          </h3>
          <p style={{ fontSize: 15, color: '#6E6E73', maxWidth: 540, margin: '0 auto 20px', lineHeight: 1.5 }}>
            Every birth chart is as unique as a fingerprint. Discuss your specific Mahadasha and receive sattvic remedies directly from Amit Soni.
          </p>
          <button
            onClick={onOpenBooking}
            className="apple-btn-gold"
            style={{ padding: '12px 28px', fontSize: 15 }}
          >
            Book a 1-on-1 Consultation
          </button>
        </div>

        {/* Related Posts Rail */}
        {related && related.length > 0 && (
          <div style={{ marginTop: 64, borderTop: '1px solid #E5E5EA', paddingTop: 40 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1D1D1F', marginBottom: 24 }}>
              Related Vedic Articles
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              {related.map((rel: any) => (
                <div
                  key={rel.id}
                  className="apple-card"
                  style={{ padding: 18, cursor: 'pointer' }}
                  onClick={() => onNavigate(`/blog/post/${rel.slug}`)}
                >
                  <img
                    src={rel.hero_image_url}
                    alt={rel.title}
                    style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }}
                  />
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: '#1D1D1F', marginBottom: 6, lineHeight: 1.3 }}>
                    {rel.title}
                  </h4>
                  <div style={{ fontSize: 12, color: '#86868B' }}>
                    {rel.reading_time_min} min read
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
