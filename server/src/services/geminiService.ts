/**
 * Gemini AI Service for Amit Astro
 * Powers automatic bilingual article generation, translation, content enhancement, and prompt generation.
 */

const FALLBACK_GEMINI_KEY = 'AIzaSyCMENG2FCAJOnLzgCSUuEVW36YwSu5UwKU';

export function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY || FALLBACK_GEMINI_KEY;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

interface GenerateArticleParams {
  idea: string;
  tone?: string;
  length?: string;
  categoryName?: string;
}

interface GeneratedArticleResult {
  title: string;
  titleHi: string;
  excerpt: string;
  excerptHi: string;
  contentMarkdown: string;
  contentMarkdownHi: string;
  tags: string[];
  readingTimeMin: number;
  suggestedCategorySlug?: string;
  imagePrompt: string;
  generatedImageUrl: string;
}

/**
 * Call Gemini REST API with clean error handling and structured extraction
 */
async function callGemini(prompt: string, systemInstruction?: string, temperature = 0.4): Promise<string> {
  const apiKey = getGeminiApiKey();
  const model = getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents: any[] = [];
  
  const parts: any[] = [{ text: prompt }];
  contents.push({ parts, role: 'user' });

  const body: any = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: 8192
    }
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data: any = await response.json();
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidateText) {
    throw new Error('Gemini returned an empty or invalid response');
  }

  return candidateText;
}

/**
 * Parse JSON safely from Gemini output that might include ```json ``` fences
 */
function extractJsonFromText<T>(text: string): T {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    // If JSON parsing failed, try finding first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const slice = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(slice) as T;
    }
    throw new Error('Could not parse structured JSON from AI response: ' + err);
  }
}

/**
 * Generate a complete bilingual (English + Hindi) article from an idea
 */
export async function generateBilingualArticle(params: GenerateArticleParams): Promise<GeneratedArticleResult> {
  const systemInstruction = `You are a world-class Vedic Astrologer, Vastu expert, and editorial essayist writing for "Amit Astro" (Amit's prestigious classical astrology platform).
Your style is profound, authentic, deeply knowledgeable, compassionate, and empowering. Avoid fatalistic fearmongering; always provide clear, authentic astrological remedies (Upay), gemstones, mantras, charity (Daan), and planetary rationale according to Parashari Jyotish and Brihat Parashara Hora Shastra.
You must return your output ONLY as a valid JSON object matching the requested schema. No conversational filler or external wrapper.`;

  const userPrompt = `
Generate a comprehensive, beautifully written Vedic astrology article based on the following user idea:
Idea: "${params.idea}"
Desired Tone: "${params.tone || 'Classical Vedic Wisdom with Practical Life Guidance'}"
Desired Length: "${params.length || 'Comprehensive (800-1200 words)'}"
Category Hint: "${params.categoryName || 'General Astrology'}"

Return ONLY a raw JSON object with this EXACT structure:
{
  "title": "A captivating, authoritative English headline (e.g. Navigating Saturn in Pisces 2026: Karmic Tests and Astrological Remedies)",
  "titleHi": "हिंदी में आकर्षक, शुद्ध और प्रामाणिक शीर्षक (उदा. मीन राशि में शनि का गोचर 2026: कर्मफल, प्रभाव और सटीक वैदिक उपाय)",
  "excerpt": "A compelling 2-3 sentence English summary summarizing key planetary themes and takeaways.",
  "excerptHi": "2-3 वाक्यों का हिंदी सारांश जो विषय के मुख्य ज्योतिषीय बिंदुओं को संक्षेप में प्रस्तुत करे।",
  "contentMarkdown": "Full English article in rich GitHub-flavored Markdown. Must include: # Title, introduction, ## Astronomical & Astrological Significance, ## Rashis Most Affected / House Placements, ## Classical Astrological Remedies (Mantras, Gemstones, Rudraksha, Charity), > Blockquote for a sacred Sanskrit Shloka or key spiritual insight, and a concluding consultation note.",
  "contentMarkdownHi": "Full Hindi article in rich GitHub-flavored Markdown, written in natural, fluent, and authentic Hindi astrological vocabulary (गोचर, महादशा, कुंडली, भाव, ग्रह शांति, रुद्राक्ष, दान, मंत्र जप). Same rich structure with headings, bullet points, blockquote, and remedies.",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"],
  "readingTimeMin": 5,
  "suggestedCategorySlug": "planetary-transits",
  "imagePrompt": "A highly detailed, cinematic prompt for generating an astrological illustration. Describe celestial planetary alignments, glowing golden sacred mandalas, cosmic nebula, mystical Vedic ambiance, rich gold and indigo hues, 8k, photorealistic, sacred geometry, no text"
}
`;

  const rawJson = await callGemini(userPrompt, systemInstruction, 0.4);
  const parsed = extractJsonFromText<any>(rawJson);

  // Generate image URL from imagePrompt
  const imagePrompt = parsed.imagePrompt || `Vedic astrology cosmic celestial alignment golden mandala ${params.idea}`;
  const seed = Math.floor(Math.random() * 900000) + 100000;
  const cleanImagePrompt = encodeURIComponent(imagePrompt.slice(0, 300));
  const generatedImageUrl = `https://image.pollinations.ai/prompt/${cleanImagePrompt}?width=1200&height=630&seed=${seed}&nologo=true`;

  return {
    title: parsed.title || 'Vedic Astrology Insights',
    titleHi: parsed.titleHi || 'वैदिक ज्योतिष अंतर्दृष्टि',
    excerpt: parsed.excerpt || '',
    excerptHi: parsed.excerptHi || '',
    contentMarkdown: parsed.contentMarkdown || '',
    contentMarkdownHi: parsed.contentMarkdownHi || '',
    tags: Array.isArray(parsed.tags) ? parsed.tags : ['Vedic Astrology', 'Kundli', 'Remedies'],
    readingTimeMin: typeof parsed.readingTimeMin === 'number' ? parsed.readingTimeMin : 5,
    suggestedCategorySlug: parsed.suggestedCategorySlug || 'vedic-astrology',
    imagePrompt,
    generatedImageUrl
  };
}

/**
 * Translate article content bidirectionally (EN <-> HI)
 */
export async function translateArticleContent(params: {
  title: string;
  excerpt: string;
  contentMarkdown: string;
  direction: 'en-to-hi' | 'hi-to-en';
}): Promise<{ title: string; excerpt: string; contentMarkdown: string }> {
  const isEnToHi = params.direction === 'en-to-hi';

  const systemInstruction = `You are a master bilingual editor specializing in Vedic Astrology, Vastu Shastra, and spiritual literature.
Your task is to translate the provided title, excerpt, and Markdown content ${isEnToHi ? 'from English to high-quality authentic Hindi (Devanagari)' : 'from Hindi to fluent, authoritative English'}.
Rules:
1. Preserve ALL Markdown formatting perfectly (headings #, ##, bold **, bullet points -, blockquotes >).
2. For astrology terminology (like Kundli, Dasha, Rashi, Nakshatra, Upay, Graha, Sade Sati, Manglik), use the proper authentic terms.
3. Return ONLY a valid JSON object.`;

  const userPrompt = `
Translate the following content ${isEnToHi ? 'into Hindi' : 'into English'}:

Source Title:
${params.title}

Source Excerpt:
${params.excerpt}

Source Markdown Content:
${params.contentMarkdown}

Return ONLY this JSON structure:
{
  "title": "Translated Title",
  "excerpt": "Translated Excerpt",
  "contentMarkdown": "Translated Full Markdown Content"
}
`;

  const rawJson = await callGemini(userPrompt, systemInstruction, 0.3);
  const parsed = extractJsonFromText<any>(rawJson);

  return {
    title: parsed.title || params.title,
    excerpt: parsed.excerpt || params.excerpt,
    contentMarkdown: parsed.contentMarkdown || params.contentMarkdown
  };
}

/**
 * Generate a new AI image for a given prompt or article title
 */
export function generateArtworkUrl(prompt: string): string {
  const seed = Math.floor(Math.random() * 900000) + 100000;
  const clean = encodeURIComponent(`sacred Vedic cosmic astrology ${prompt}, glowing aura, golden mandala, celestial planets, high resolution 8k cinematic lighting, spiritual mystical artwork`.slice(0, 300));
  return `https://image.pollinations.ai/prompt/${clean}?width=1200&height=630&seed=${seed}&nologo=true`;
}
