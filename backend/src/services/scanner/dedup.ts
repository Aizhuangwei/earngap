// Opportunity Dedup - SHA256 content hash
import crypto from 'crypto';

export function generateContentHash(title: string, source: string, summary: string): string {
  const content = `${title}|${source}|${summary}`.toLowerCase().trim();
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function generateOpportunityHash(opportunity: {
  title: string;
  summary: string;
  sources: { name: string }[];
}): string {
  const sourceNames = opportunity.sources.map(s => s.name).sort().join(',');
  return generateContentHash(opportunity.title, sourceNames, opportunity.summary);
}
