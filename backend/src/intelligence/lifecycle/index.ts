// Lifecycle Engine - 机会生命周期识别
// EARLY → EXPANDING → PEAK → SATURATED → DECLINING → DEAD

export enum LifecycleStage {
  EARLY = 'EARLY',
  EXPANDING = 'EXPANDING',
  PEAK = 'PEAK',
  SATURATED = 'SATURATED',
  DECLINING = 'DECLINING',
  DEAD = 'DEAD',
}

export interface LifecycleInput {
  score: number;
  growthVelocity: number;   // 0-100
  age: number;              // 小时
  totalSignals: number;     // 跨平台信号数
  trendMomentum: number;    // -100 to 100
  competitorCount: number;  // 估计竞争数
}

export interface LifecycleResult {
  stage: LifecycleStage;
  confidence: number;
  reason: string;
  nextStage?: LifecycleStage;
  estimatedDaysLeft?: number;
}

export class LifecycleEngine {
  determine(input: LifecycleInput): LifecycleResult {
    const { score, growthVelocity, age, totalSignals, trendMomentum, competitorCount } = input;

    // DEAD: 长时间无增长
    if (age > 720 && growthVelocity < 5 && trendMomentum < -50) {
      return { stage: LifecycleStage.DEAD, confidence: 0.85, reason: 'No growth for >30 days, negative momentum' };
    }

    // DECLINING: 热度下降
    if (age > 336 && trendMomentum < -20 && growthVelocity < 10) {
      return { stage: LifecycleStage.DECLINING, confidence: 0.75, reason: 'Declining momentum over 2 weeks' };
    }

    // SATURATED: 竞争多、增长慢
    if (competitorCount > 20 && growthVelocity < 15 && age > 168) {
      return { stage: LifecycleStage.SATURATED, confidence: 0.7, reason: 'High competition, slowing growth' };
    }

    // PEAK: 热度最高
    if (score >= 75 && totalSignals >= 3 && growthVelocity >= 50) {
      return {
        stage: LifecycleStage.PEAK,
        confidence: 0.8,
        reason: 'Peak attention across multiple platforms',
        nextStage: LifecycleStage.SATURATED,
        estimatedDaysLeft: 14,
      };
    }

    // EXPANDING: 快速增长
    if (growthVelocity >= 25 && totalSignals >= 2 && age < 168) {
      return {
        stage: LifecycleStage.EXPANDING,
        confidence: 0.75,
        reason: 'Growing rapidly across sources',
        nextStage: LifecycleStage.PEAK,
        estimatedDaysLeft: 30,
      };
    }

    // EARLY: 默认
    return {
      stage: LifecycleStage.EARLY,
      confidence: 0.8,
      reason: 'Early stage opportunity with limited signals',
      nextStage: LifecycleStage.EXPANDING,
      estimatedDaysLeft: 60,
    };
  }

  // 判断是否需要迁移
  shouldTransition(current: LifecycleStage, input: LifecycleInput): boolean {
    const result = this.determine(input);
    return result.stage !== current;
  }

  // 获取下一阶段
  getNextStage(stage: LifecycleStage): LifecycleStage | null {
    const order = [
      LifecycleStage.EARLY,
      LifecycleStage.EXPANDING,
      LifecycleStage.PEAK,
      LifecycleStage.SATURATED,
      LifecycleStage.DECLINING,
      LifecycleStage.DEAD,
    ];
    const idx = order.indexOf(stage);
    if (idx >= 0 && idx < order.length - 1) return order[idx + 1];
    return null;
  }
}
