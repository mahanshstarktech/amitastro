import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import { getAll, getOne, runQuery } from '../db/database';
import { generateBilingualArticle, translateArticleContent, generateArtworkUrl } from '../services/geminiService';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await getAll<any>('SELECT * FROM categories ORDER BY name ASC');
    // Nest subcategories
    const topLevel = categories.filter(c => !c.parent_id);
    const result = topLevel.map(cat => ({
      ...cat,
      subcategories: categories.filter(c => c.parent_id === cat.id)
    }));
    return res.json({ categories: result, flat: categories });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getPosts = async (req: Request, res: Response) => {
  try {
    const { category, tag, search, featured, limit } = req.query;
    let sql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM blog_posts p
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_published = 1
    `;
    const params: any[] = [];

    if (category) {
      sql += ' AND (c.slug = ? OR c.parent_id IN (SELECT id FROM categories WHERE slug = ?))';
      params.push(category, category);
    }
    if (featured === 'true') {
      sql += ' AND p.is_featured = 1';
    }
    if (search) {
      sql += ' AND (p.title LIKE ? OR p.excerpt LIKE ? OR p.content_markdown LIKE ? OR p.title_hi LIKE ? OR p.content_markdown_hi LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY p.published_at DESC';

    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit as string, 10));
    }

    const posts = await getAll<any>(sql, params);
    const parsed = posts.map(p => ({
      ...p,
      tags: JSON.parse(p.tags_json || '[]')
    }));

    return res.json({ posts: parsed });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getPostBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const post = await getOne<any>(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM blog_posts p
      JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ?
    `, [slug]);

    if (!post) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Get related posts
    const related = await getAll<any>(`
      SELECT id, slug, title, title_hi, excerpt, excerpt_hi, hero_image_url, reading_time_min, published_at
      FROM blog_posts
      WHERE category_id = ? AND id != ? AND is_published = 1
      ORDER BY published_at DESC
      LIMIT 3
    `, [post.category_id, post.id]);

    return res.json({
      post: {
        ...post,
        tags: JSON.parse(post.tags_json || '[]')
      },
      author: {
        name: 'Amit',
        title: 'Vedic Astrologer & Vastu Consultant',
        experience: '15+ Years Experience',
        bio: 'Practicing classical Parashari Jyotish, Vastu Shastra, and remedial gems. Trusted advisor across India and internationally.'
      },
      related
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const adminCreatePost = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      titleHi,
      slug,
      excerpt,
      excerptHi,
      contentMarkdown,
      contentMarkdownHi,
      categoryId,
      tags,
      heroImageUrl,
      readingTimeMin,
      isFeatured,
      isPublished,
      metaTitle,
      metaDescription
    } = req.body;

    if (!title || !contentMarkdown || !categoryId) {
      return res.status(400).json({ error: 'Title, content, and category are required' });
    }

    const postId = `post-${uuidv4().substring(0, 8)}`;
    const postSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${Math.floor(Math.random() * 1000)}`;

    await runQuery(`
      INSERT INTO blog_posts (
        id, slug, title, title_hi, excerpt, excerpt_hi, content_markdown, content_markdown_hi,
        category_id, tags_json, hero_image_url, reading_time_min, is_featured, is_published, meta_title, meta_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      postId,
      postSlug,
      title,
      titleHi || null,
      excerpt || '',
      excerptHi || null,
      contentMarkdown,
      contentMarkdownHi || null,
      categoryId,
      JSON.stringify(tags || []),
      heroImageUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      readingTimeMin || 5,
      isFeatured ? 1 : 0,
      isPublished !== undefined ? (isPublished ? 1 : 0) : 1,
      metaTitle || title,
      metaDescription || excerpt || ''
    ]);

    const created = await getOne<any>('SELECT * FROM blog_posts WHERE id = ?', [postId]);
    return res.status(201).json({ success: true, post: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const adminUpdatePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      titleHi,
      slug,
      excerpt,
      excerptHi,
      contentMarkdown,
      contentMarkdownHi,
      categoryId,
      tags,
      heroImageUrl,
      readingTimeMin,
      isFeatured,
      isPublished,
      metaTitle,
      metaDescription
    } = req.body;

    const existing = await getOne<any>('SELECT * FROM blog_posts WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await runQuery(`
      UPDATE blog_posts SET
        title = COALESCE(?, title),
        title_hi = COALESCE(?, title_hi),
        slug = COALESCE(?, slug),
        excerpt = COALESCE(?, excerpt),
        excerpt_hi = COALESCE(?, excerpt_hi),
        content_markdown = COALESCE(?, content_markdown),
        content_markdown_hi = COALESCE(?, content_markdown_hi),
        category_id = COALESCE(?, category_id),
        tags_json = COALESCE(?, tags_json),
        hero_image_url = COALESCE(?, hero_image_url),
        reading_time_min = COALESCE(?, reading_time_min),
        is_featured = COALESCE(?, is_featured),
        is_published = COALESCE(?, is_published),
        meta_title = COALESCE(?, meta_title),
        meta_description = COALESCE(?, meta_description)
      WHERE id = ?
    `, [
      title !== undefined ? title : null,
      titleHi !== undefined ? titleHi : null,
      slug !== undefined ? slug : null,
      excerpt !== undefined ? excerpt : null,
      excerptHi !== undefined ? excerptHi : null,
      contentMarkdown !== undefined ? contentMarkdown : null,
      contentMarkdownHi !== undefined ? contentMarkdownHi : null,
      categoryId !== undefined ? categoryId : null,
      tags ? JSON.stringify(tags) : null,
      heroImageUrl !== undefined ? heroImageUrl : null,
      readingTimeMin !== undefined ? readingTimeMin : null,
      isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
      isPublished !== undefined ? (isPublished ? 1 : 0) : null,
      metaTitle !== undefined ? metaTitle : null,
      metaDescription !== undefined ? metaDescription : null,
      id
    ]);

    const updated = await getOne<any>('SELECT * FROM blog_posts WHERE id = ?', [id]);
    return res.json({ success: true, post: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const adminDeletePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await runQuery('DELETE FROM blog_posts WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Article deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Generate a complete bilingual article using Gemini AI from a user idea prompt
 */
export const adminGenerateAiArticle = async (req: AuthRequest, res: Response) => {
  try {
    const { idea, tone, length, categoryId } = req.body;
    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide an article idea or topic description' });
    }

    let categoryName = 'Vedic Astrology';
    if (categoryId) {
      const cat = await getOne<any>('SELECT name FROM categories WHERE id = ?', [categoryId]);
      if (cat?.name) categoryName = cat.name;
    }

    const result = await generateBilingualArticle({
      idea: idea.trim(),
      tone,
      length,
      categoryName
    });

    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Error generating AI article:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate article with AI' });
  }
};

/**
 * Translate article content bidirectionally between English and Hindi
 */
export const adminTranslateArticle = async (req: AuthRequest, res: Response) => {
  try {
    const { title, excerpt, contentMarkdown, direction } = req.body;
    if (!contentMarkdown && !title) {
      return res.status(400).json({ error: 'Content or title is required for translation' });
    }

    const translated = await translateArticleContent({
      title: title || '',
      excerpt: excerpt || '',
      contentMarkdown: contentMarkdown || '',
      direction: direction === 'hi-to-en' ? 'hi-to-en' : 'en-to-hi'
    });

    return res.json({ success: true, ...translated });
  } catch (err: any) {
    console.error('Error translating article:', err);
    return res.status(500).json({ error: err.message || 'Translation failed' });
  }
};

/**
 * Generate a fresh AI artwork illustration URL based on prompt
 */
export const adminGenerateArticleImage = async (req: AuthRequest, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Image prompt is required' });
    }
    const imageUrl = generateArtworkUrl(prompt);
    return res.json({ success: true, imageUrl });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
