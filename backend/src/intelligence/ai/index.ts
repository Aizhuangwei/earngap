// AI Intelligence Layer - AI自动生成内容
// 使用 OpenClaw API 调用 LLM 生成 SEO标题、摘要、执行建议
import { logger } from '../../logger';
import { CacheService } from '../../cache/cache-service';

export interface AIAnalysisInput {
  title: string;
  summary: string;
  score: number;
  phase: string;
  gapType: string;
  dimensions: { label: string; score: number; maxScore: number }[];
}

export interface AIAnalysisResult {
  seoTitle: string;
  seoDescription: string;
  opportunitySummary: string;
  executionPlan: string[];
  riskAnalysis: string[];
  translated: Record<string, string>; // locale -> translated summary
}

export class AIIntelligenceLayer {
  private readonly OPENCLAW_API_URL = process.env.OPENCLAW_API_URL || 'http://localhost:18789';
  private readonly OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || '';

  async analyze(input: AIAnalysisInput, locale: string = 'en'): Promise<AIAnalysisResult> {
    // 检查缓存
    const cacheKey = `ai:analysis:${this.hashInput(input)}:${locale}`;
    const cached = await CacheService.get<AIAnalysisResult>(cacheKey);
    if (cached) {
      logger.debug({ msg: 'AI analysis cache hit', title: input.title });
      return cached;
    }

    // 构建 prompt
    const prompt = this.buildPrompt(input, locale);

    try {
      // 调用 OpenClaw API 或 LLM
      const result = await this.callLLM(prompt);

      // 缓存结果（24小时）
      await CacheService.set(cacheKey, result, 86400);

      return result;
    } catch (error) {
      logger.error({ msg: 'AI analysis failed', error: (error as Error).message });

      // Fallback: 基于规则的简单生成
      return this.fallbackAnalysis(input);
    }
  }

  private buildPrompt(input: AIAnalysisInput, locale: string): string {
    return `Analyze this business opportunity and provide structured output:

Title: ${input.title}
Summary: ${input.summary}
Score: ${input.score}/100
Phase: ${input.phase}
Gap Type: ${input.gapType}

Dimensions:
${input.dimensions.map(d => `  - ${d.label}: ${d.score}/${d.maxScore}`).join('\n')}

Generate the following in ${locale === 'zh' ? 'Chinese' : 'English'}:
1. SEO-optimized title (max 60 chars)
2. SEO description (max 160 chars)
3. One-sentence opportunity summary
4. Execution plan (4 steps)
5. Risk analysis (2-3 points)`;
  }

  private async callLLM(prompt: string): Promise<AIAnalysisResult> {
    // 调用 OpenClaw Gateway API（或直接调用 DeepSeek/OpenAI）
    // 当前使用 OpenClaw 作为 AI 网关
    const response = await fetch(`${this.OPENCLAW_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.OPENCLAW_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API returned ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';

    return this.parseAIResponse(content);
  }

  private parseAIResponse(content: string): AIAnalysisResult {
    // 简单解析 LLM 输出
    const lines = content.split('\n').filter(l => l.trim());
    return {
      seoTitle: lines[0]?.replace(/^1[.)]\s*/, '') || '',
      seoDescription: lines[1]?.replace(/^2[.)]\s*/, '') || '',
      opportunitySummary: lines[2]?.replace(/^3[.)]\s*/, '') || '',
      executionPlan: lines.slice(3, 7).map(l => l.replace(/^\d+[.)]\s*/, '')).filter(Boolean),
      riskAnalysis: lines.slice(7, 10).map(l => l.replace(/^\d+[.)]\s*/, '')).filter(Boolean),
      translated: {},
    };
  }

  private fallbackAnalysis(input: AIAnalysisInput): AIAnalysisResult {
    const isHighScore = input.score >= 70;
    return {
      seoTitle: input.title,
      seoDescription: `${input.title} - ${input.summary.slice(0, 140)}`,
      opportunitySummary: input.summary,
      executionPlan: isHighScore
        ? ['Market research (1-2 weeks)', 'MVP development (2-4 weeks)', 'Customer testing (4-6 weeks)', 'Official launch (6-8 weeks)']
        : ['Monitor the market for 1-2 weeks', 'Validate the opportunity', 'Develop if signals strengthen'],
      riskAnalysis: ['Market competition may increase', 'Timing is critical for this opportunity'],
      translated: {},
    };
  }

  private hashInput(input: AIAnalysisInput): string {
    const { createHash } = require('crypto');
    return createHash('md5').update(JSON.stringify(input)).digest('hex').slice(0, 16);
  }
}
