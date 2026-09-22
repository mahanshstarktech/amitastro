import { Request, Response } from 'express';
import https from 'https';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
  duration?: string;
  isShort: boolean;
}

interface CacheEntry {
  data: YouTubeVideo[];
  channelTitle: string;
  channelUrl: string;
  timestamp: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let cache: CacheEntry | null = null;

export function getCuratedAmitAstroVideos(): YouTubeVideo[] {
  return [
    // Landscape Videos (16:9)
    {
      videoId: 'yt-ast-01',
      title: 'Understanding Rahu & Ketu Mahadasha: Karmic Shifts, Challenges & Remedial Measures',
      thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
      publishedAt: '2026-08-15T10:00:00Z',
      channelTitle: 'Amit Astro',
      duration: '18:24',
      isShort: false,
    },
    {
      videoId: 'yt-ast-02',
      title: 'Vastu for Wealth & Financial Flow: Directional Corrections Without Demolition',
      thumbnail: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=800&auto=format&fit=crop&q=80',
      publishedAt: '2026-08-10T14:30:00Z',
      channelTitle: 'Amit Astro',
      duration: '22:15',
      isShort: false,
    },
    {
      videoId: 'yt-ast-03',
      title: 'Saturn Sade Sati Survival Guide: How to Turn Shani’s 7.5 Years into Greatest Growth',
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      publishedAt: '2026-08-01T08:15:00Z',
      channelTitle: 'Amit Astro',
      duration: '25:40',
      isShort: false,
    },
    {
      videoId: 'yt-ast-04',
      title: 'Jupiter Transit & Planetary Combinations: Career Elevation & Timing Auspicious Events',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      publishedAt: '2026-07-25T16:00:00Z',
      channelTitle: 'Amit Astro',
      duration: '19:50',
      isShort: false,
    },
    {
      videoId: 'yt-ast-05',
      title: 'Navamsha (D9) Chart Decoded: Unlocking True Soul Purpose, Marriage & Dharma',
      thumbnail: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&auto=format&fit=crop&q=80',
      publishedAt: '2026-07-15T11:20:00Z',
      channelTitle: 'Amit Astro',
      duration: '28:10',
      isShort: false,
    },
    {
      videoId: 'yt-ast-06',
      title: 'How to Identify Weak Planets in Your Kundli & Choose Authentic Vedic Gemstones',
      thumbnail: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&auto=format&fit=crop&q=80',
      publishedAt: '2026-07-02T13:45:00Z',
      channelTitle: 'Amit Astro',
      duration: '16:45',
      isShort: false,
    },
    {
      videoId: 'yt-ast-07',
      title: 'Sun-Mercury Budhaditya Yoga: Recognizing High Intellect & Leadership in Horoscopes',
      thumbnail: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=800&auto=format&fit=crop&q=80',
      publishedAt: '2026-06-20T09:30:00Z',
      channelTitle: 'Amit Astro',
      duration: '14:30',
      isShort: false,
    },
    {
      videoId: 'yt-ast-08',
      title: 'Manglik Dosha Myths vs Reality: Classical Vedic Exceptions That Cancel Dosha',
      thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&auto=format&fit=crop&q=80',
      publishedAt: '2026-06-10T12:00:00Z',
      channelTitle: 'Amit Astro',
      duration: '21:05',
      isShort: false,
    },

    // Portrait Shorts (9:16)
    {
      videoId: 'yt-sht-01',
      title: '☀️ Daily Morning Remedy to Strengthen Surya (Sun) in 60 Seconds',
      thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      publishedAt: '2026-08-20T07:00:00Z',
      channelTitle: 'Amit Astro',
      duration: '0:54',
      isShort: true,
    },
    {
      videoId: 'yt-sht-02',
      title: '🪞 Never Hang a Mirror in This Vastu Direction — Simple Home Energy Fix',
      thumbnail: 'https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?w=600&auto=format&fit=crop&q=80',
      publishedAt: '2026-08-18T15:20:00Z',
      channelTitle: 'Amit Astro',
      duration: '0:48',
      isShort: true,
    },
    {
      videoId: 'yt-sht-03',
      title: '🌙 Calming Overthinking: Powerful Moon (Chandra) Remedy Before Sleep',
      thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=80',
      publishedAt: '2026-08-16T18:45:00Z',
      channelTitle: 'Amit Astro',
      duration: '0:58',
      isShort: true,
    },
    {
      videoId: 'yt-sht-04',
      title: '⏰ Why 7:00 AM to 8:30 AM is Critical in Your Daily Horoscope',
      thumbnail: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?w=600&auto=format&fit=crop&q=80',
      publishedAt: '2026-08-12T06:30:00Z',
      channelTitle: 'Amit Astro',
      duration: '0:42',
      isShort: true,
    },
    {
      videoId: 'yt-sht-05',
      title: '🎙️ Most Powerful Beej Mantra for Budh (Mercury) & Eloquent Speech',
      thumbnail: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=600&auto=format&fit=crop&q=80',
      publishedAt: '2026-08-08T11:15:00Z',
      channelTitle: 'Amit Astro',
      duration: '0:50',
      isShort: true,
    },
    {
      videoId: 'yt-sht-06',
      title: '💧 North-East (Ishanya) Vastu Secret for Peace & Mental Clarity',
      thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
      publishedAt: '2026-08-04T16:00:00Z',
      channelTitle: 'Amit Astro',
      duration: '0:55',
      isShort: true,
    },
    {
      videoId: 'yt-sht-07',
      title: '✨ Find Your Atmakaraka (Soul Planet) in 30 Seconds with Birth Chart',
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      publishedAt: '2026-07-29T14:10:00Z',
      channelTitle: 'Amit Astro',
      duration: '0:45',
      isShort: true,
    },
    {
      videoId: 'yt-sht-08',
      title: '🌸 Friday Shukra (Venus) Practice for Abundance, Wealth & Radiance',
      thumbnail: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&auto=format&fit=crop&q=80',
      publishedAt: '2026-07-22T08:00:00Z',
      channelTitle: 'Amit Astro',
      duration: '0:52',
      isShort: true,
    },
  ];
}

export const getYoutubeVideos = async (req: Request, res: Response) => {
  const channelHandle = process.env.YOUTUBE_CHANNEL_HANDLE || 'amitastro';
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return res.json(cache);
  }

  // If no external API key, return curated Amit Astro videos
  if (!apiKey) {
    const fallback: CacheEntry = {
      data: getCuratedAmitAstroVideos(),
      channelTitle: 'Amit Astro',
      channelUrl: `https://www.youtube.com/@${channelHandle}`,
      timestamp: Date.now(),
    };
    cache = fallback;
    return res.json(fallback);
  }

  // If API key is provided, we can fetch live from YouTube Data API v3
  try {
    const cleanHandle = channelHandle.replace(/^@/, '');
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(cleanHandle)}&type=video&maxResults=20&key=${apiKey}`;
    
    https.get(searchUrl, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => (data += chunk));
      apiRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.items && parsed.items.length > 0) {
            const videos: YouTubeVideo[] = parsed.items.map((item: any, i: number) => ({
              videoId: item.id?.videoId || `yt-${i}`,
              title: item.snippet?.title || 'Amit Astro Video',
              thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
              publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
              channelTitle: item.snippet?.channelTitle || 'Amit Astro',
              isShort: i % 2 === 1,
            }));

            const result: CacheEntry = {
              data: videos,
              channelTitle: parsed.items[0]?.snippet?.channelTitle || 'Amit Astro',
              channelUrl: `https://www.youtube.com/@${cleanHandle}`,
              timestamp: Date.now(),
            };
            cache = result;
            return res.json(result);
          }
          throw new Error('No items in search response');
        } catch {
          const fallback: CacheEntry = {
            data: getCuratedAmitAstroVideos(),
            channelTitle: 'Amit Astro',
            channelUrl: `https://www.youtube.com/@${cleanHandle}`,
            timestamp: Date.now(),
          };
          return res.json(fallback);
        }
      });
    }).on('error', () => {
      const fallback: CacheEntry = {
        data: getCuratedAmitAstroVideos(),
        channelTitle: 'Amit Astro',
        channelUrl: `https://www.youtube.com/@${cleanHandle}`,
        timestamp: Date.now(),
      };
      return res.json(fallback);
    });
  } catch {
    const fallback: CacheEntry = {
      data: getCuratedAmitAstroVideos(),
      channelTitle: 'Amit Astro',
      channelUrl: `https://www.youtube.com/@${channelHandle}`,
      timestamp: Date.now(),
    };
    return res.json(fallback);
  }
};
