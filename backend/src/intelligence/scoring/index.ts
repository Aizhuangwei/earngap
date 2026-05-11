// Scoring Engine - 七维评分系统
// 每个维度独立函数，可配置权重，可回测

export interface DimensionConfig {
  name: string;
  weight: number;   // 总和=100
  maxScore: number;  // 通常20
}

export interface DimensionScore {
  label: string;
  score: number;
  maxScore: number;
  weight: number;
}

export interface OpportunityScore {
  finalScore: number;       // 0-100
  dimensions: DimensionScore[];
  conviction: number;        // 确定性 0-100%
  scarcity: number;          // 稀缺度 0-100%
}

// ===== 维度权重配置 =====
export const DEFAULT_DIMENSIONS: DimensionConfig[] = [
  { name: 'Signal Strength', weight: 20, maxScore: 20 },
  { name: 'Growth Velocity', weight: 15, maxScore: 20 },
  { name: 'Information Gap', weight: 20, maxScore: 20 },
  { name: 'Monetization Potential', weight: 15, maxScore: 20 },
  { name: 'Execution Difficulty', weight: 10, maxScore: 20 },
  { name: 'Time Window', weight: 10, maxScore: 20 },
  { name: 'Risk Factor', weight: 10, maxScore: 20 },
];

export interface ScoringInput {
  signalStrength: number;     // 0-100
  growthVelocity: number;     // 0-100
  heatScore: number;          // 0-100
  tags: string[];
  source: string;
  age: number;                // 小时
  title: string;
  summary: string;
}

export class ScoringEngine {
  private dimensions: DimensionConfig[];

  constructor(dimensions: DimensionConfig[] = DEFAULT_DIMENSIONS) {
    this.dimensions = dimensions;
  }

  // 主评分入口
  score(input: ScoringInput): OpportunityScore {
    const dimensions = this.dimensions.map(d => {
      const score = this.scoreDimension(d.name, input);
      return {
        label: d.name,
        score: Math.round(score * 10) / 10,
        maxScore: d.maxScore,
        weight: d.weight,
      };
    });

    // 加权总分（归一化到100）
    const totalWeighted = dimensions.reduce((sum, d) => sum + (d.score / d.maxScore) * d.weight, 0);
    const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
    const finalScore = Math.round((totalWeighted / totalWeight) * 100);

    // 确定性：基于信号强度和热度的置信度
    const conviction = this.calcConviction(input);
    const scarcity = this.calcScarcity(input);

    return { finalScore, dimensions, conviction, scarcity };
  }

  // ===== 各维度评分函数 =====

  private scoreDimension(name: string, input: ScoringInput): number {
    switch (name) {
      case 'Signal Strength':
        return this.scoreSignalStrength(input);
      case 'Growth Velocity':
        return this.scoreGrowthVelocity(input);
      case 'Information Gap':
        return this.scoreInformationGap(input);
      case 'Monetization Potential':
        return this.scoreMonetization(input);
      case 'Execution Difficulty':
        return this.scoreExecution(input);
      case 'Time Window':
        return this.scoreTimeWindow(input);
      case 'Risk Factor':
        return this.scoreRiskFactor(input);
      default:
        return 10;
    }
  }

  // 1. 信号强度 (0-20)
  private scoreSignalStrength(input: ScoringInput): number {
    const { signalStrength, heatScore } = input;
    // 信号强度越高分越高
    const raw = (signalStrength * 0.6 + heatScore * 0.4) / 5; // 转换到0-20
    return Math.min(20, Math.round(raw * 10) / 10);
  }

  // 2. 增长速率 (0-20)
  private scoreGrowthVelocity(input: ScoringInput): number {
    const { growthVelocity } = input;
    const raw = growthVelocity / 5;
    return Math.min(20, Math.round(raw * 10) / 10);
  }

  // 3. 信息差价值 (0-20)
  private scoreInformationGap(input: ScoringInput): number {
    const { tags, title, summary } = input;
    const text = (title + ' ' + summary).toLowerCase();

    let score = 10; // 基准分

    // 信息差关键词加分
    const gapKeywords = [
      'new', 'launch', 'breakthrough', 'first', 'disrupt', 'revolutionary',
      'early', 'emerging', 'stealth', 'unannounced', 'hidden', 'underrated',
      'arbitrage', 'opportunity', 'gap', 'untapped', 'undervalued',
    ];
    for (const kw of gapKeywords) {
      if (text.includes(kw)) score += 1.5;
    }

    // 新兴领域加分
    const emergingDomains = ['ai agent', 'defi', 'rwa', 'finops', 'autonomous', 'robotics', 'quantum'];
    for (const domain of emergingDomains) {
      if (text.includes(domain)) score += 2;
    }

    return Math.min(20, score);
  }

  // 4. 变现潜力 (0-20)
  private scoreMonetization(input: ScoringInput): number {
    const { tags, title, summary } = input;
    const text = (title + ' ' + summary).toLowerCase();

    let score = 8; // 基准

    // SaaS/工具类变现强
    const monetizable = ['saas', 'api', 'subscription', 'tool', 'platform', 'enterprise', 'b2b', 'plugin', 'chrome'];
    for (const kw of monetizable) {
      if (text.includes(kw)) score += 2;
    }

    // 开源项目变现弱
    if (text.includes('open source') || text.includes('opensource') || text.includes('free')) {
      score -= 3;
    }

    return Math.max(0, Math.min(20, score));
  }

  // 5. 执行难度 (0-20，越高越容易)
  private scoreExecution(input: ScoringInput): number {
    let score = 12; // 基准中等难度

    // 已有人做的容易
    const easyIndicators = ['no-code', 'low-code', 'template', 'plugin', 'api', 'sdk'];
    for (const kw of easyIndicators) {
      if (input.title.toLowerCase().includes(kw)) score += 2;
    }

    // 需要硬件的难
    const hardIndicators = ['hardware', 'robot', 'chip', 'manufactur', 'model training', 'infrastructure'];
    for (const kw of hardIndicators) {
      if (input.title.toLowerCase().includes(kw)) score -= 3;
    }

    return Math.max(0, Math.min(20, score));
  }

  // 6. 时间窗口 (0-20)
  private scoreTimeWindow(input: ScoringInput): number {
    const { age } = input;
    if (age < 6) return 20;     // 6小时内 = 满分窗口
    if (age < 24) return 17;    // 1天内
    if (age < 72) return 13;    // 3天内
    if (age < 168) return 8;    // 1周内
    return 3;                   // 超过1周
  }

  // 7. 风险因子 (0-20，越高越安全)
  private scoreRiskFactor(input: ScoringInput): number {
    let score = 12; // 基准

    const text = (input.title + ' ' + input.summary).toLowerCase();

    const highRisk = ['crypto', 'memecoin', 'speculative', 'unaudited', 'experimental'];
    for (const kw of highRisk) {
      if (text.includes(kw)) score -= 3;
    }

    const lowRisk = ['enterprise', 'regulated', 'compliant', 'backed', 'funded', 'revenue', 'profitable'];
    for (const kw of lowRisk) {
      if (text.includes(kw)) score += 2;
    }

    return Math.max(0, Math.min(20, score));
  }

  // ===== 高级指标 =====

  private calcConviction(input: ScoringInput): number {
    // 确定性：信号越强、越新，确定性越高
    const base = Math.min(60, input.signalStrength * 0.6);
    const ageBonus = Math.max(0, 30 - input.age / 2);
    return Math.min(95, Math.round(base + ageBonus));
  }

  private calcScarcity(input: ScoringInput): number {
    // 稀缺度：信息差价值越大、来源越少，越稀缺
    const base = 20;
    const gapBonus = Math.min(40, input.heatScore * 0.4);
    return Math.min(90, Math.round(base + gapBonus));
  }
}
