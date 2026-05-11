// Dedup Engine - 三层去重
// Layer 1: SHA256 Hash
// Layer 2: Semantic Similarity (cosine)
// Layer 3: Cross-platform aggregation
import { createHash } from 'crypto';
import { RawSignal } from '../scanners/base';
import { ParsedSignal } from '../parsers';
import { logger } from '../../logger';

export interface DedupResult {
  isDuplicate: boolean;
  existingId?: string;
  confidence: number;
  layer: number; // 1|2|3
}

export class DedupEngine {
  // Layer 1: 精确哈希去重
  generateContentHash(title: string, source: string, summary: string): string {
    const content = `${title}|${source}|${summary}`.toLowerCase().trim().replace(/\s+/g, ' ');
    return createHash('sha256').update(content).digest('hex');
  }

  async layer1(existing: string[], signal: RawSignal): Promise<DedupResult> {
    const hash = this.generateContentHash(signal.title, signal.source, signal.summary);
    const isDuplicate = existing.includes(hash);
    return { isDuplicate, confidence: isDuplicate ? 1.0 : 0, layer: 1 };
  }

  // Layer 2: 语义相似度（使用简单 Jaccard 相似度作为无API方案）
  // 生产环境替换为 OpenAI Embedding API
  async layer2(existingTitles: string[], signal: RawSignal): Promise<DedupResult> {
    const words = new Set(this.tokenize(signal.title));
    let maxSimilarity = 0;
    let bestMatch = '';

    for (const title of existingTitles) {
      const sim = this.jaccardSimilarity(words, new Set(this.tokenize(title)));
      if (sim > maxSimilarity) {
        maxSimilarity = sim;
        bestMatch = title;
      }
    }

    return {
      isDuplicate: maxSimilarity >= 0.85,
      existingId: maxSimilarity >= 0.85 ? bestMatch : undefined,
      confidence: maxSimilarity,
      layer: 2,
    };
  }

  // Layer 3: 跨平台事件聚合
  async layer3(
    existingSignals: { title: string; source: string; url?: string }[],
    signal: RawSignal
  ): Promise<DedupResult> {
    // 检查是否同一事件出现在多个平台
    const titleLower = signal.title.toLowerCase();
    const keyTerms = this.extractKeyTerms(titleLower);

    for (const existing of existingSignals) {
      const existingLower = existing.title.toLowerCase();
      const existingTerms = this.extractKeyTerms(existingLower);

      // 如果两个信号来自不同平台但提到同一个产品/公司
      if (existing.source !== signal.source) {
        const overlap = keyTerms.filter(t => existingTerms.includes(t));
        if (overlap.length >= 2) {
          return {
            isDuplicate: true,
            existingId: existing.title,
            confidence: 0.7 + (overlap.length / Math.max(keyTerms.length, existingTerms.length)) * 0.3,
            layer: 3,
          };
        }
      }
    }

    return { isDuplicate: false, confidence: 0, layer: 3 };
  }

  // 全流程去重
  async dedup(
    existingHashes: string[],
    existingTitles: string[],
    existingSignals: { title: string; source: string; url?: string }[],
    signal: RawSignal
  ): Promise<DedupResult> {
    // Layer 1: 快速哈希
    const l1 = await this.layer1(existingHashes, signal);
    if (l1.isDuplicate) {
      logger.debug({ msg: 'Dedup L1 hit', title: signal.title });
      return l1;
    }

    // Layer 2: 语义
    const l2 = await this.layer2(existingTitles, signal);
    if (l2.isDuplicate && l2.confidence >= 0.9) {
      logger.debug({ msg: 'Dedup L2 hit', title: signal.title, confidence: l2.confidence });
      return l2;
    }

    // Layer 3: 跨平台
    const l3 = await this.layer3(existingSignals, signal);
    if (l3.isDuplicate) {
      logger.debug({ msg: 'Dedup L3 hit (cross-platform)', title: signal.title, source: signal.source });
      return l3;
    }

    return { isDuplicate: false, confidence: 0, layer: 1 };
  }

  // ===== 工具方法 =====

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  private jaccardSimilarity(a: Set<string>, b: Set<string>): number {
    const intersection = new Set([...a].filter(x => b.has(x)));
    const union = new Set([...a, ...b]);
    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  private extractKeyTerms(text: string): string[] {
    // 提取产品/公司名、技术名词
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'and', 'or', 'this', 'that', 'from', 'by', 'its', 'has', 'have', 'been', 'new', 'best', 'top']);
    return text.split(/\s+/).filter(t => t.length > 2 && !stopWords.has(t));
  }
}
