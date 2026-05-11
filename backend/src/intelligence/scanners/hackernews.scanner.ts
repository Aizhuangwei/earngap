// Hacker News Scanner
import { BaseScanner, ScannerConfig, RawSignal } from './base';
import { logger } from '../../logger';

interface HNItem {
  id: number;
  title: string;
  url?: string;
  score: number;
  descendants: number;
  by: string;
  time: number;
  type: string;
}

export class HackerNewsScanner extends BaseScanner {
  readonly config: ScannerConfig = {
    name: 'hackernews',
    source: 'HACKER_NEWS',
    enabled: true,
    intervalMs: 3600000,
    maxRetries: 3,
    rateLimitPerMinute: 30,
  };

  private readonly API_BASE = 'https://hacker-news.firebaseio.com/v0';

  async fetch(): Promise<RawSignal[]> {
    // 获取首页 top stories
    const topStoriesResp = await fetch(`${this.API_BASE}/topstories.json`);
    if (!topStoriesResp.ok) throw new Error(`HN API returned ${topStoriesResp.status}`);
    const topIds: number[] = await topStoriesResp.json();

    // 只取前30条
    const batch = topIds.slice(0, 30);

    // 并发获取详情
    const items = await Promise.all(
      batch.map(id =>
        fetch(`${this.API_BASE}/item/${id}.json`)
          .then(r => r.json() as Promise<HNItem>)
          .catch(() => null)
      )
    );

    const signals: RawSignal[] = [];
    for (const item of items) {
      if (!item || item.type !== 'story') continue;

      signals.push(this.normalizeSignal({
        externalId: `hn-${item.id}`,
        title: item.title,
        summary: item.title,
        url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
        author: item.by,
        tags: ['hacker-news', 'tech'],
        metrics: {
          upvotes: item.score,
          comments: item.descendants,
          score: item.score,
        },
        createdAt: new Date(item.time * 1000),
      }));
    }

    logger.info({ msg: 'HN scan complete', signalsFound: signals.length });
    return signals;
  }
}
