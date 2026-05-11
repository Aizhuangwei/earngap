// Pipeline Orchestrator - 智能管道编排
// Scanner → Parser → Dedup → Classifier → Scoring → Lifecycle → AI → DB → Alert → Push

import { PrismaClient } from '@prisma/client';
import { scannerRegistry } from '../scanners/registry';
import { SignalParser, ParsedSignal } from '../parsers';
import { DedupEngine } from '../dedup';
import { ClassifierEngine } from '../classifier';
import { ScoringEngine } from '../scoring';
import { LifecycleEngine } from '../lifecycle';
import { AIIntelligenceLayer } from '../ai';
import { AlertEngine } from '../alerts';
import { emitScanUpdate, emitDataRefresh } from '../../socket';
import { CacheService } from '../../cache/cache-service';
import { generateContentHash } from '../scanners/dedup';
import { logger, scanLogger } from '../../logger';

const prisma = new PrismaClient();
const parser = new SignalParser();
const dedup = new DedupEngine();
const classifier = new ClassifierEngine();
const scorer = new ScoringEngine();
const lifecycle = new LifecycleEngine();
const aiLayer = new AIIntelligenceLayer();
const alertEngine = new AlertEngine();

export class IntelligencePipeline {
  private isRunning = false;

  async runFullScan(scanId: string): Promise<void> {
    if (this.isRunning) {
      logger.warn({ msg: 'Pipeline already running, skipping' });
      return;
    }

    this.isRunning = true;

    try {
      await this.updateScanStatus(scanId, 'RUNNING', 0);
      scanLogger.info({ msg: 'Pipeline started', scanId });

      // Step 1: Scan - 采集原始信号
      emitScanUpdate({ scanId, status: 'RUNNING', progress: 10 });
      const rawSignals = await scannerRegistry.scanAll();
      scanLogger.info({ msg: 'Step 1 complete: Scan', count: rawSignals.length });

      // Step 2: Parse - 标准化
      emitScanUpdate({ scanId, status: 'RUNNING', progress: 25 });
      const parsedSignals = parser.parse(rawSignals);
      scanLogger.info({ msg: 'Step 2 complete: Parse', count: parsedSignals.length });

      // Step 3: Dedup - 去重
      emitScanUpdate({ scanId, status: 'RUNNING', progress: 40 });
      const existing = await this.getExistingSignals();
      const uniqueSignals = await this.dedupBatch(parsedSignals, existing);
      scanLogger.info({ msg: 'Step 3 complete: Dedup', unique: uniqueSignals.length, duplicates: parsedSignals.length - uniqueSignals.length });

      // Step 4-7: Classify + Score + Lifecycle + AI
      let newOppCount = 0;
      for (let i = 0; i < uniqueSignals.length; i++) {
        const signal = uniqueSignals[i];
        const progress = 45 + Math.round((i / uniqueSignals.length) * 45);

        emitScanUpdate({ scanId, status: 'RUNNING', progress });

        try {
          await this.processSignal(signal);
          newOppCount++;
        } catch (err) {
          logger.error({ msg: 'Signal processing failed', title: signal.title, error: (err as Error).message });
        }
      }

      // Step 8: Alert - 批量评估提醒
      emitScanUpdate({ scanId, status: 'RUNNING', progress: 92 });
      await this.evaluateAlerts();

      // Step 9: Analytics - 更新分析数据
      emitScanUpdate({ scanId, status: 'RUNNING', progress: 96 });
      await this.refreshAnalytics();

      // Complete
      await this.updateScanStatus(scanId, 'COMPLETED', 100);
      emitScanUpdate({ scanId, status: 'COMPLETED', progress: 100, total: rawSignals.length, new: newOppCount });
      emitDataRefresh('opportunities');

      scanLogger.info({
        msg: 'Pipeline completed',
        scanId,
        totalSignals: rawSignals.length,
        newOpportunities: newOppCount,
      });
    } catch (error) {
      await this.updateScanStatus(scanId, 'FAILED', 0);
      logger.error({ msg: 'Pipeline failed', scanId, error: (error as Error).message });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async processSignal(signal: ParsedSignal): Promise<void> {
    // 4. Classify
    const classification = classifier.classify(signal.title, signal.summary, signal.tags);

    // 5. Score
    const ageHours = (Date.now() - signal.createdAt.getTime()) / 3600000;
    const scoreResult = scorer.score({
      signalStrength: signal.signalStrength,
      growthVelocity: signal.growthVelocity,
      heatScore: signal.heatScore,
      tags: signal.tags,
      source: signal.source,
      age: ageHours,
      title: signal.title,
      summary: signal.summary,
    });

    // 6. Lifecycle
    const lifecycleResult = lifecycle.determine({
      score: scoreResult.finalScore,
      growthVelocity: signal.growthVelocity,
      age: ageHours,
      totalSignals: 1,
      trendMomentum: signal.growthVelocity,
      competitorCount: 3,
    });

    // 7. Save to DB
    const contentHash = generateContentHash(signal.title, signal.source, signal.summary);
    const gapType = this.mapToGapType(classification.primary);

    const opportunity = await prisma.opportunity.create({
      data: {
        title: signal.title,
        summary: signal.summary,
        score: scoreResult.finalScore,
        phase: lifecycleResult.stage as any,
        gapType: gapType as any,
        riskLevel: scoreResult.finalScore >= 70 ? 'LOW' : scoreResult.finalScore >= 50 ? 'MEDIUM' : 'HIGH',
        conviction: scoreResult.conviction,
        scarcity: scoreResult.scarcity,
        growth: signal.growthVelocity,
        difficulty: scoreResult.finalScore >= 70 ? '可落地' : '中等',
        contentHash,
        dimensions: {
          create: scoreResult.dimensions.map(d => ({
            label: d.label,
            score: d.score,
            maxScore: d.maxScore,
            weight: d.weight,
          })),
        },
        scoreHistory: {
          create: { score: scoreResult.finalScore },
        },
      },
    });

    // 8. AI Analysis (async, non-blocking)
    this.runAIAnalysis(opportunity.id, signal, scoreResult, lifecycleResult).catch(err => {
      logger.error({ msg: 'AI analysis failed', oppId: opportunity.id, error: err.message });
    });

    // 9. Alert check
    await alertEngine.evaluate(
      { id: opportunity.id, title: opportunity.title, score: opportunity.score, phase: opportunity.phase },
      true
    );
  }

  private async runAIAnalysis(
    oppId: string,
    signal: ParsedSignal,
    scoreResult: any,
    lifecycleResult: any
  ): Promise<void> {
    const analysis = await aiLayer.analyze({
      title: signal.title,
      summary: signal.summary,
      score: scoreResult.finalScore,
      phase: lifecycleResult.stage,
      gapType: '',
      dimensions: scoreResult.dimensions,
    });

    // 存储 AI 分析结果
    await prisma.aIAnalysis.upsert({
      where: { opportunityId: oppId },
      update: {
        seoTitle: analysis.seoTitle,
        seoDescription: analysis.seoDescription,
        opportunitySummary: analysis.opportunitySummary,
        executionPlan: analysis.executionPlan,
        riskAnalysis: analysis.riskAnalysis,
      },
      create: {
        opportunityId: oppId,
        seoTitle: analysis.seoTitle,
        seoDescription: analysis.seoDescription,
        opportunitySummary: analysis.opportunitySummary,
        executionPlan: analysis.executionPlan,
        riskAnalysis: analysis.riskAnalysis,
      },
    });
  }

  // ===== 辅助方法 =====

  private async getExistingSignals() {
    const existing = await prisma.rawSignal.findMany({
      select: { contentHash: true, title: true, source: true },
      take: 1000,
      orderBy: { createdAt: 'desc' },
    });

    const existingHashes = existing.map(e => e.contentHash);
    const existingTitles = existing.map(e => e.title);
    const existingSignalsForDedup = existing.map(e => ({
      title: e.title,
      source: e.source,
      url: undefined as string | undefined,
    }));

    return { existingHashes, existingTitles, existingSignalsForDedup };
  }

  private async dedupBatch(
    signals: ParsedSignal[],
    existing: { existingHashes: string[]; existingTitles: string[]; existingSignalsForDedup: any[] }
  ): Promise<ParsedSignal[]> {
    const unique: ParsedSignal[] = [];

    for (const signal of signals) {
      const result = await dedup.dedup(
        existing.existingHashes,
        existing.existingTitles,
        existing.existingSignalsForDedup,
        {
          source: signal.source,
          title: signal.title,
          summary: signal.summary,
          url: signal.url,
          externalId: signal.externalId,
          tags: signal.tags,
          metrics: { stars: 0, upvotes: 0, comments: 0, mentions: 0, score: signal.signalStrength },
          createdAt: signal.createdAt,
          author: signal.author,
        }
      );

      if (!result.isDuplicate) {
        unique.push(signal);
        // 更新已存在列表
        existing.existingHashes.push(
          generateContentHash(signal.title, signal.source, signal.summary)
        );
        existing.existingTitles.push(signal.title);
        existing.existingSignalsForDedup.push({
          title: signal.title,
          source: signal.source,
          url: signal.url,
        });
      }
    }

    return unique;
  }

  private async evaluateAlerts(): Promise<void> {
    const highScoreOpps = await prisma.opportunity.findMany({
      where: { isActive: true, isAlerted: false, score: { gte: 70 } },
      take: 20,
    });

    for (const opp of highScoreOpps) {
      await alertEngine.evaluate({
        id: opp.id,
        title: opp.title,
        score: opp.score,
        phase: opp.phase,
      });

      await prisma.opportunity.update({
        where: { id: opp.id },
        data: { isAlerted: true },
      });
    }
  }

  private async refreshAnalytics(): Promise<void> {
    // 清除分析缓存
    await CacheService.del('analytics:dashboard');
    await CacheService.del('stats:dashboard');
    await CacheService.delPattern('opps:*');
  }

  private async updateScanStatus(scanId: string, status: string, progress: number): Promise<void> {
    const data: any = { status };
    if (status === 'COMPLETED' || status === 'FAILED') {
      data.endedAt = new Date();
    }
    await prisma.scanLog.update({ where: { id: scanId }, data });
  }

  private mapToGapType(category: string): string {
    const gapMap: Record<string, string> = {
      AI: 'KNOWLEDGE_GAP',
      SAAS: 'PLATFORM_GAP',
      FINANCE: 'REGULATORY_GAP',
      CRYPTO: 'TIME_GAP',
      AUTOMATION: 'RESOURCE_GAP',
      INFRA: 'PLATFORM_GAP',
      AGENT: 'KNOWLEDGE_GAP',
      CODING: 'TOOL_GAP',
      VIDEO: 'TECHNOLOGY_GAP',
      SEO: 'KNOWLEDGE_GAP',
      ROBOTICS: 'HARDWARE_GAP',
    };
    return gapMap[category] || 'TIME_GAP';
  }
}

export const pipeline = new IntelligencePipeline();
