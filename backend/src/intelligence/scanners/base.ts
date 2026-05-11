// Scanner Base - 所有 Scanner 的基类接口
export interface ScannerConfig {
  name: string;
  source: string;
  enabled: boolean;
  intervalMs: number;
  maxRetries: number;
  rateLimitPerMinute: number;
}

export interface RawSignal {
  source: string;
  externalId?: string;
  title: string;
  summary: string;
  url?: string;
  author?: string;
  tags?: string[];
  metrics?: {
    stars?: number;
    upvotes?: number;
    comments?: number;
    mentions?: number;
    score?: number;
  };
  createdAt: Date;
}

export interface ScannerHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  lastRun?: Date;
  lastError?: string;
  signalsFound: number;
  rateLimitRemaining?: number;
}

export abstract class BaseScanner {
  abstract readonly config: ScannerConfig;
  protected retryCount = 0;
  protected consecutiveErrors = 0;

  abstract fetch(): Promise<RawSignal[]>;

  async execute(): Promise<RawSignal[]> {
    try {
      const signals = await this.fetchWithRetry();
      this.consecutiveErrors = 0;
      return signals;
    } catch (error) {
      this.consecutiveErrors++;
      const fallback = await this.fallback();
      if (fallback) return fallback;
      throw error;
    }
  }

  private async fetchWithRetry(): Promise<RawSignal[]> {
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await this.fetch();
      } catch (error) {
        if (attempt === this.config.maxRetries) throw error;
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }
    throw new Error('Max retries exceeded');
  }

  protected async fallback(): Promise<RawSignal[] | null> {
    return null; // 子类可覆盖
  }

  async healthCheck(): Promise<ScannerHealth> {
    return {
      name: this.config.name,
      status: this.consecutiveErrors > 3 ? 'degraded' : 'healthy',
      signalsFound: 0,
      lastError: this.consecutiveErrors > 0 ? `${this.consecutiveErrors} consecutive errors` : undefined,
    };
  }

  protected normalizeSignal(raw: Partial<RawSignal>): RawSignal {
    return {
      source: this.config.source,
      title: raw.title || 'Untitled',
      summary: raw.summary || '',
      url: raw.url,
      author: raw.author,
      tags: raw.tags || [],
      metrics: raw.metrics || {},
      createdAt: raw.createdAt || new Date(),
      externalId: raw.externalId,
    };
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
