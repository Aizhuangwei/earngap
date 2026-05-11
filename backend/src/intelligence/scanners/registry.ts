// Scanner Registry - 管理所有 Scanner
import { BaseScanner, ScannerConfig, ScannerHealth, RawSignal } from './base';
import { GitHubScanner } from './github.scanner';
import { HackerNewsScanner } from './hackernews.scanner';
import { RedditScanner } from './reddit.scanner';
import { logger } from '../../logger';

export type ScannerName = 'github' | 'hackernews' | 'reddit' | 'twitter' | 'producthunt' | 'indiehackers' | 'coingecko';

class ScannerRegistry {
  private scanners: Map<string, BaseScanner> = new Map();

  constructor() {
    this.register(new GitHubScanner());
    this.register(new HackerNewsScanner());
    this.register(new RedditScanner());
    // 后续添加：Twitter, ProductHunt, IndieHackers, CoinGecko
  }

  private register(scanner: BaseScanner): void {
    this.scanners.set(scanner.config.name, scanner);
    logger.info({ msg: 'Scanner registered', name: scanner.config.name, source: scanner.config.source });
  }

  get(name: string): BaseScanner | undefined {
    return this.scanners.get(name);
  }

  getAll(): BaseScanner[] {
    return Array.from(this.scanners.values());
  }

  getEnabled(): BaseScanner[] {
    return this.getAll().filter(s => s.config.enabled);
  }

  async scanAll(): Promise<RawSignal[]> {
    const enabled = this.getEnabled();
    logger.info({ msg: 'Starting scan all', count: enabled.length });

    const results = await Promise.allSettled(
      enabled.map(scanner =>
        scanner.execute().catch(err => {
          logger.error({ msg: 'Scanner failed', name: scanner.config.name, error: err.message });
          return [] as RawSignal[];
        })
      )
    );

    const allSignals: RawSignal[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allSignals.push(...result.value);
      }
    }

    logger.info({ msg: 'Scan all completed', totalSignals: allSignals.length });
    return allSignals;
  }

  async healthCheckAll(): Promise<Record<string, ScannerHealth>> {
    const results: Record<string, ScannerHealth> = {};
    for (const [name, scanner] of this.scanners) {
      results[name] = await scanner.healthCheck();
    }
    return results;
  }
}

export const scannerRegistry = new ScannerRegistry();
