// Parser Layer - 标准化所有来源数据
import { RawSignal } from '../scanners/base';

export interface ParsedSignal {
  source: string;
  title: string;
  summary: string;
  url?: string;
  tags: string[];
  signalStrength: number;
  growthVelocity: number;
  heatScore: number;
  metrics: {
    rawScore: number;
    normalizedScore: number;
    velocity: number;
  };
  externalId?: string;
  author?: string;
  createdAt: Date;
}

export class SignalParser {
  parse(rawSignals: RawSignal[]): ParsedSignal[] {
    return rawSignals.map(s => this.parseOne(s));
  }

  private parseOne(signal: RawSignal): ParsedSignal {
    const metrics = this.normalizeMetrics(signal);
    const signalStrength = this.calcSignalStrength(metrics);
    const growthVelocity = this.calcGrowthVelocity(signal, metrics);
    const heatScore = this.calcHeatScore(signalStrength, growthVelocity);

    return {
      source: signal.source,
      title: signal.title,
      summary: signal.summary,
      url: signal.url,
      tags: signal.tags || [],
      signalStrength,
      growthVelocity,
      heatScore,
      metrics,
      externalId: signal.externalId,
      author: signal.author,
      createdAt: signal.createdAt,
    };
  }

  private normalizeMetrics(signal: RawSignal): { rawScore: number; normalizedScore: number; velocity: number } {
    const m = signal.metrics || {};
    const now = Date.now();
    const ageHours = (now - signal.createdAt.getTime()) / 3600000;
    const ageFactor = Math.max(0.1, 1 - ageHours / 72);

    let rawScore = 0;

    switch (signal.source) {
      case 'GITHUB':
        rawScore = (m.stars || 0) * 2 + (m.mentions || 0) * 5;
        break;
      case 'HACKER_NEWS':
        rawScore = (m.upvotes || 0) * 5 + (m.comments || 0) * 3;
        break;
      case 'REDDIT':
        rawScore = (m.upvotes || 0) * 3 + (m.comments || 0) * 2;
        break;
      default:
        rawScore = (m.score || 0) + (m.upvotes || 0) * 2 + (m.mentions || 0);
    }

    rawScore = Math.max(0, rawScore);
    const normalizedScore = Math.min(100, Math.log2(rawScore + 1) * 15);
    const velocity = normalizedScore * ageFactor;

    return {
      rawScore,
      normalizedScore: Math.round(normalizedScore * 10) / 10,
      velocity: Math.round(velocity * 10) / 10,
    };
  }

  private calcSignalStrength(metrics: { normalizedScore: number }): number {
    return Math.min(100, metrics.normalizedScore);
  }

  private calcGrowthVelocity(signal: RawSignal, metrics: { velocity: number }): number {
    return Math.min(100, Math.round(metrics.velocity));
  }

  private calcHeatScore(strength: number, velocity: number): number {
    return Math.min(100, Math.round(strength * 0.6 + velocity * 0.4));
  }
}
