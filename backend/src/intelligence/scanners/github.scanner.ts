// GitHub Trending Scanner
import { BaseScanner, ScannerConfig, RawSignal } from './base';
import { logger } from '../../logger';

export class GitHubScanner extends BaseScanner {
  readonly config: ScannerConfig = {
    name: 'github',
    source: 'GITHUB',
    enabled: true,
    intervalMs: 3600000, // 1 hour
    maxRetries: 3,
    rateLimitPerMinute: 10,
  };

  async fetch(): Promise<RawSignal[]> {
    // 爬取 GitHub Trending 页面
    const response = await fetch('https://github.com/trending');
    if (!response.ok) throw new Error(`GitHub trending returned ${response.status}`);

    const html = await response.text();
    const signals: RawSignal[] = [];

    // 解析 HTML（生产环境用 cheerio）
    const repoRegex = /<h2[^>]*>.*?href="\/([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g;
    let match;
    let count = 0;

    while ((match = repoRegex.exec(html)) !== null && count < 25) {
      const fullName = match[1];
      const title = match[2].replace(/<[^>]+>/g, '').trim();

      if (!title || !fullName) continue;

      // 提取 stars
      const starMatch = html.slice(match.index).match(/<span[^>]*>\s*([0-9,.KkM]+)\s*stars?\s*<\/span>/);
      const starsStr = starMatch?.[1]?.replace(/,/g, '') || '0';
      const stars = this.parseStarCount(starsStr);

      signals.push(this.normalizeSignal({
        externalId: fullName,
        title: title.trim(),
        summary: `GitHub trending repository: ${fullName}`,
        url: `https://github.com/${fullName}`,
        tags: ['github', 'open-source'],
        metrics: { stars },
        createdAt: new Date(),
      }));
      count++;
    }

    logger.info({ msg: 'GitHub scan complete', signalsFound: signals.length });
    return signals;
  }

  private parseStarCount(s: string): number {
    s = s.trim().toUpperCase();
    if (s.endsWith('K')) return Math.round(parseFloat(s) * 1000);
    if (s.endsWith('M')) return Math.round(parseFloat(s) * 1000000);
    return parseInt(s) || 0;
  }

  protected async fallback(): Promise<RawSignal[] | null> {
    // 后续：从缓存或 RSS 兜底
    return null;
  }
}
