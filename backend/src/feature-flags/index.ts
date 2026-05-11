// Feature Flags - Centralized feature control
import { getEnv } from '../config/env';

export type FeatureFlag = {
  key: string;
  name: string;
  description: string;
  defaultValue: boolean;
  dependsOn?: FeatureEnvFlag;
};

export type FeatureEnvFlag = 'ENABLE_AI_PREDICT' | 'ENABLE_BILLING' | 'ENABLE_TRANSLATE';

const features: FeatureFlag[] = [
  {
    key: 'ai_predict',
    name: 'AI Prediction',
    description: 'AI-driven opportunity prediction engine',
    defaultValue: false,
    dependsOn: 'ENABLE_AI_PREDICT',
  },
  {
    key: 'billing',
    name: 'Billing & SaaS',
    description: 'Subscription billing and API keys',
    defaultValue: false,
    dependsOn: 'ENABLE_BILLING',
  },
  {
    key: 'translate',
    name: 'Auto Translation',
    description: 'Automatic multi-language translation',
    defaultValue: true,
    dependsOn: 'ENABLE_TRANSLATE',
  },
  {
    key: 'beta_features',
    name: 'Beta Features',
    description: 'Experimental features in development',
    defaultValue: false,
  },
  {
    key: 'advanced_alerts',
    name: 'Advanced Alerts',
    description: 'Trend prediction and smart alerts',
    defaultValue: false,
  },
  {
    key: 'export_data',
    name: 'Data Export',
    description: 'Export opportunity data as CSV/JSON',
    defaultValue: true,
  },
];

export class FeatureFlags {
  private store: Map<string, boolean> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const env = getEnv();

    for (const feature of features) {
      // Check env override first
      if (feature.dependsOn) {
        const envValue = (env as any)[feature.dependsOn];
        if (typeof envValue === 'boolean') {
          this.store.set(feature.key, envValue);
          continue;
        }
      }
      this.store.set(feature.key, feature.defaultValue);
    }
  }

  isEnabled(key: string): boolean {
    return this.store.get(key) ?? false;
  }

  setEnabled(key: string, value: boolean): void {
    this.store.set(key, value);
  }

  getAll(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [key, value] of this.store) {
      result[key] = value;
    }
    return result;
  }

  getDefinitions(): FeatureFlag[] {
    return features;
  }
}

export const featureFlags = new FeatureFlags();
