// Reddit Scanner (r/AItools, r/SaaS, r/startups)
import { BaseScanner, ScannerConfig, RawSignal } from './base';
import { logger } from '../../logger';

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    url: string;
    score: number;
    num_comments: number;
    author: string;
    created_utc: number;
    subreddit: string;
    thumbnail: string;
  };
}

export class RedditScanner extends BaseScanner {
  readonly config: ScannerConfig = {
    name: 'reddit',
    source: 'REDDIT',
    enabled: true,
    intervalMs: 3600000,
    maxRetries: 3,
    rateLimitPerMinute: 30,
  };

  private readonly SUBREDDITS = ['AItools', 'SaaS', 'startups', 'artificial'];
  private readonly API_BASE = 'https://www.reddit.com/r';

  async fetch(): Promise<RawSignal[]> {
    const signals: RawSignal[] = [];

    for (const sub of this.SUBREDDITS) {
      try {
        const posts = await this.fetchSubreddit(sub);
        signals.push(...posts);
        await this.sleep(1000); // 礼貌延时
      } catch (error) {
        logger.warn({ msg: `Reddit r/${sub} failed`, error: (error as Error).message });
      }
    }

    logger.info({ msg: 'Reddit scan complete', signalsFound: signals.length });
    return signals;
  }

  private async fetchSubreddit(sub: string): Promise<RawSignal[]> {
    const response = await fetch(`${this.API_BASE}/${sub}/hot.json?limit=10`, {
      headers: { 'User-Agent': 'EarnGap/1.0 (opportunity scanner)' },
    });
    if (!response.ok) throw new Error(`Reddit r/${sub} returned ${response.status}`);

    const data = await response.json();
    const posts: RedditPost[] = data?.data?.children || [];

    return posts.map((post) =>
      this.normalizeSignal({
        externalId: `reddit-${post.data.id}`,
        title: post.data.title,
        summary: post.data.selftext?.slice(0, 500) || post.data.title,
        url: `https://reddit.com${post.data.permalink || `/r/${sub}/comments/${post.data.id}/`}`,
        author: post.data.author,
        tags: ['reddit', sub.toLowerCase()],
        metrics: {
          upvotes: post.data.score,
          comments: post.data.num_comments,
          mentions: post.data.score,
        },
        createdAt: new Date(post.data.created_utc * 1000),
      })
    );
  }
}
