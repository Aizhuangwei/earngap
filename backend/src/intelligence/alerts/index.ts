// Alert Engine - 智能提醒系统
import { logger, alertLogger } from '../../logger';
import { CacheService } from '../../cache/cache-service';
import { emitAlert, emitNewOpportunity } from '../../socket';
import { LifecycleStage } from '../lifecycle';

export type AlertTrigger = 'HIGH_SCORE' | 'LIFECYCLE_CHANGE' | 'SURGE' | 'DEADLINE' | 'NEW_OPPORTUNITY';

export interface AlertRule {
  trigger: AlertTrigger;
  name: string;
  condition: string;
  priority: number; // 1-5, 5最高
}

export interface AlertEvent {
  opportunityId: string;
  opportunityTitle: string;
  type: AlertTrigger;
  message: string;
  score: number;
  timestamp: Date;
}

export class AlertEngine {
  // 提醒规则
  private readonly RULES: AlertRule[] = [
    { trigger: 'HIGH_SCORE', name: 'High Score Alert', condition: 'score >= 80', priority: 5 },
    { trigger: 'LIFECYCLE_CHANGE', name: 'Lifecycle Transition', condition: 'EARLY → EXPANDING', priority: 4 },
    { trigger: 'SURGE', name: 'Growth Surge', condition: '24h growth > 200%', priority: 4 },
    { trigger: 'DEADLINE', name: 'Deadline Approaching', condition: 'window < 7 days', priority: 3 },
    { trigger: 'NEW_OPPORTUNITY', name: 'New Opportunity', condition: 'score >= 65', priority: 3 },
  ];

  // 评估是否需要触发提醒
  async evaluate(
    opportunity: {
      id: string;
      title: string;
      score: number;
      phase: string;
      prevPhase?: string;
      growth24h?: number;
      windowDays?: number;
    },
    isNew: boolean = false
  ): Promise<AlertEvent[]> {
    const alerts: AlertEvent[] = [];

    // 新机会提醒
    if (isNew && opportunity.score >= 65) {
      alerts.push(this.buildAlert(opportunity, 'NEW_OPPORTUNITY', `New opportunity: ${opportunity.title} (${opportunity.score}分)`));
    }

    // 高分提醒
    if (opportunity.score >= 80) {
      alerts.push(this.buildAlert(opportunity, 'HIGH_SCORE', `🔥 High score alert: ${opportunity.title} scored ${opportunity.score}`));
    }

    // 生命周期变化
    if (opportunity.prevPhase && opportunity.phase !== opportunity.prevPhase) {
      alerts.push(this.buildAlert(
        opportunity,
        'LIFECYCLE_CHANGE',
        `Lifecycle change: ${opportunity.title} moved from ${opportunity.prevPhase} → ${opportunity.phase}`
      ));
    }

    // 热度暴涨
    if (opportunity.growth24h && opportunity.growth24h > 200) {
      alerts.push(this.buildAlert(
        opportunity,
        'SURGE',
        `🚀 Growth surge: ${opportunity.title} up ${opportunity.growth24h}% in 24h`
      ));
    }

    // 截止日期提醒
    if (opportunity.windowDays && opportunity.windowDays <= 7 && opportunity.windowDays > 0) {
      alerts.push(this.buildAlert(
        opportunity,
        'DEADLINE',
        `⏰ Deadline approaching: ${opportunity.title} only ${opportunity.windowDays} days left`
      ));
    }

    // 推送提醒
    for (const alert of alerts) {
      await this.pushAlert(alert);
    }

    return alerts;
  }

  private buildAlert(opp: any, type: AlertTrigger, message: string): AlertEvent {
    return {
      opportunityId: opp.id,
      opportunityTitle: opp.title,
      type,
      message,
      score: opp.score,
      timestamp: new Date(),
    };
  }

  private async pushAlert(alert: AlertEvent): Promise<void> {
    // Redis 通知队列
    await CacheService.pushAlert(alert);
    alertLogger.info({ msg: 'Alert generated', type: alert.type, title: alert.opportunityTitle });

    // WebSocket 实时推送
    emitAlert(alert);

    // QQ Bot 推送（仅高分和生命周期变化）
    if (alert.type === 'HIGH_SCORE' || alert.type === 'LIFECYCLE_CHANGE') {
      // TODO: 调用 QQ Bot API 发送通知
      logger.info({ msg: 'High priority alert ready for QQ push', title: alert.opportunityTitle });
    }
  }

  getRules(): AlertRule[] {
    return this.RULES;
  }
}
