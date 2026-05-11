// Opportunity Classifier - 自动多标签分类
export type Category =
  | 'AI' | 'SaaS' | 'FINANCE' | 'CRYPTO' | 'AUTOMATION'
  | 'INFRA' | 'AGENT' | 'CODING' | 'VIDEO' | 'SEO'
  | 'ROBOTICS' | 'HARDWARE' | 'SOCIAL' | 'EDUCATION' | 'HEALTH';

export interface ClassificationResult {
  primary: Category;
  secondary: Category[];
  confidence: number;
  allScores: Record<string, number>;
}

// 关键词 → 分类映射
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  AI: ['ai', 'artificial intelligence', 'llm', 'gpt', 'model', 'neural', 'deep learning', 'machine learning', 'transformer'],
  SAAS: ['saas', 'subscription', 'enterprise', 'b2b', 'platform', 'cloud', 'dashboard', 'analytics'],
  FINANCE: ['finance', 'fintech', 'banking', 'payment', 'insurtech', 'compliance', 'trading', 'invest'],
  CRYPTO: ['crypto', 'blockchain', 'defi', 'token', 'web3', 'nft', 'bitcoin', 'ethereum', 'solana', 'rwa'],
  AUTOMATION: ['automation', 'workflow', 'pipeline', 'ci/cd', 'devops', 'no-code', 'low-code'],
  INFRA: ['infrastructure', 'database', 'cache', 'serverless', 'kubernetes', 'docker', 'cloud', 'network'],
  AGENT: ['agent', 'autonomous', 'copilot', 'assistant', 'bot', 'cowork', 'multi-agent'],
  CODING: ['coding', 'programming', 'ide', 'editor', 'debug', 'code review', 'developer tools'],
  VIDEO: ['video', 'generation', 'editing', 'streaming', 'media', 'content creation', 'pixelle'],
  SEO: ['seo', 'search engine', 'traffic', 'ranking', 'content marketing'],
  ROBOTICS: ['robot', 'drone', 'automation hardware', 'sensor', 'iot'],
  HARDWARE: ['hardware', 'chip', 'semiconductor', 'gpu', 'processor', 'device'],
  SOCIAL: ['social', 'community', 'network', 'messaging', 'discord'],
  EDUCATION: ['education', 'learning', 'course', 'tutorial', 'training'],
  HEALTH: ['health', 'medical', 'healthcare', 'wellness', 'biotech'],
};

export class ClassifierEngine {
  classify(title: string, summary: string, tags: string[]): ClassificationResult {
    const text = (title + ' ' + summary + ' ' + tags.join(' ')).toLowerCase();
    const scores: Record<string, number> = {};

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) {
          // 标题匹配权重更高
          if (title.toLowerCase().includes(kw)) score += 3;
          else score += 1;
        }
      }
      if (score > 0) scores[category] = score;
    }

    // 排序取 top 分类
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primary = (sorted[0]?.[0] || 'AI') as Category;
    const secondary = sorted.slice(1, 4).map(s => s[0] as Category);

    // 置信度
    const totalScore = sorted.reduce((s, [, v]) => s + v, 0);
    const confidence = totalScore > 0 ? Math.min(0.95, sorted[0]?.[1] / totalScore) : 0.3;

    return { primary, secondary, confidence: Math.round(confidence * 100) / 100, allScores: scores };
  }
}
