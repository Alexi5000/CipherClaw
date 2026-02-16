/**
 * CipherClaw — Error & Prediction Pattern Databases
 * Static pattern definitions used by the error classifier and predictive engine.
 */

import type { ErrorModule, Severity, Recoverability, FailurePattern } from '../types/index.js';

// ═══════════════════════════════════════════════════════════════
// ERROR PATTERN DATABASE
// ═══════════════════════════════════════════════════════════════

export interface ErrorPattern {
  pattern: RegExp;
  module: ErrorModule;
  severity: Severity;
  recoverability: Recoverability;
  suggestedFix: string;
}

export const ERROR_PATTERNS: ErrorPattern[] = [
  // Memory errors
  { pattern: /memory.*overflow|out of memory/i, module: 'memory', severity: 'critical', recoverability: 'retriable', suggestedFix: 'Increase memory limits or implement memory pruning strategy' },
  { pattern: /memory.*retriev|recall.*fail/i, module: 'memory', severity: 'high', recoverability: 'retriable', suggestedFix: 'Check memory tier health and retrieval indices' },
  { pattern: /memory.*decay|stale.*memory/i, module: 'memory', severity: 'medium', recoverability: 'retriable', suggestedFix: 'Adjust decay rates or promote critical memories' },
  { pattern: /memory.*coherence|inconsistent.*memory/i, module: 'memory', severity: 'high', recoverability: 'clarification', suggestedFix: 'Run memory coherence check and reconcile tiers' },
  // Model/LLM errors
  { pattern: /rate.*limit|429|too many requests/i, module: 'model', severity: 'medium', recoverability: 'retriable', suggestedFix: 'Implement exponential backoff or switch to fallback model' },
  { pattern: /context.*window|token.*limit|max.*tokens/i, module: 'model', severity: 'high', recoverability: 'retriable', suggestedFix: 'Reduce context size or implement sliding window' },
  { pattern: /model.*unavailable|503|service.*unavailable/i, module: 'model', severity: 'high', recoverability: 'retriable', suggestedFix: 'Switch to fallback model provider' },
  { pattern: /invalid.*response|malformed.*json|parse.*error/i, module: 'model', severity: 'medium', recoverability: 'retriable', suggestedFix: 'Add response validation and retry with stricter prompt' },
  { pattern: /hallucination|confabulation|fabricat/i, module: 'model', severity: 'high', recoverability: 'clarification', suggestedFix: 'Add grounding checks and fact verification step' },
  // Tool errors
  { pattern: /tool.*not found|unknown.*tool|invalid.*tool/i, module: 'tool', severity: 'high', recoverability: 'fatal', suggestedFix: 'Verify tool registration and agent tool permissions' },
  { pattern: /tool.*timeout|execution.*timeout/i, module: 'tool', severity: 'medium', recoverability: 'retriable', suggestedFix: 'Increase tool timeout or optimize tool execution' },
  { pattern: /tool.*permission|unauthorized.*tool/i, module: 'tool', severity: 'high', recoverability: 'fatal', suggestedFix: 'Update agent tool permissions in registry' },
  // Planning errors
  { pattern: /plan.*fail|no.*plan|planning.*error/i, module: 'planning', severity: 'high', recoverability: 'retriable', suggestedFix: 'Simplify task or provide more context for planning' },
  { pattern: /infinite.*loop|max.*iterations|stuck/i, module: 'planning', severity: 'critical', recoverability: 'fatal', suggestedFix: 'Add iteration limits and loop detection' },
  { pattern: /deadlock|circular.*dependency/i, module: 'planning', severity: 'critical', recoverability: 'fatal', suggestedFix: 'Restructure agent dependencies to break cycle' },
  // Hierarchy errors
  { pattern: /delegation.*fail|cannot.*delegate/i, module: 'hierarchy', severity: 'high', recoverability: 'retriable', suggestedFix: 'Check target agent availability and delegation permissions' },
  { pattern: /escalation.*fail|no.*parent|orphan.*agent/i, module: 'hierarchy', severity: 'critical', recoverability: 'fatal', suggestedFix: 'Verify agent hierarchy configuration' },
  { pattern: /hierarchy.*loop|circular.*hierarchy/i, module: 'hierarchy', severity: 'critical', recoverability: 'fatal', suggestedFix: 'Fix circular hierarchy reference in agent registry' },
  // CRM errors
  { pattern: /lead.*not found|contact.*missing/i, module: 'crm', severity: 'medium', recoverability: 'retriable', suggestedFix: 'Verify CRM data sync and lead existence' },
  { pattern: /pipeline.*stall|deal.*stuck/i, module: 'crm', severity: 'medium', recoverability: 'clarification', suggestedFix: 'Review pipeline stage rules and automation triggers' },
  { pattern: /duplicate.*lead|merge.*conflict/i, module: 'crm', severity: 'low', recoverability: 'retriable', suggestedFix: 'Run deduplication and merge conflicting records' },
  // Content errors
  { pattern: /content.*reject|approval.*denied/i, module: 'content', severity: 'medium', recoverability: 'clarification', suggestedFix: 'Review content guidelines and resubmit with corrections' },
  { pattern: /publish.*fail|posting.*error/i, module: 'content', severity: 'high', recoverability: 'retriable', suggestedFix: 'Check platform API credentials and rate limits' },
  { pattern: /content.*policy|violation|flagged/i, module: 'content', severity: 'high', recoverability: 'fatal', suggestedFix: 'Review content against platform policies before resubmitting' },
  // Security errors
  { pattern: /auth.*fail|unauthorized|403|401/i, module: 'security', severity: 'critical', recoverability: 'fatal', suggestedFix: 'Refresh authentication tokens or check permissions' },
  { pattern: /injection|xss|sql.*inject/i, module: 'security', severity: 'critical', recoverability: 'fatal', suggestedFix: 'Sanitize inputs and add security validation layer' },
  { pattern: /prompt.*inject|jailbreak/i, module: 'security', severity: 'critical', recoverability: 'fatal', suggestedFix: 'Add prompt injection detection and input sanitization' },
  // Communication errors
  { pattern: /network.*error|connection.*refused|ECONNREFUSED/i, module: 'communication', severity: 'high', recoverability: 'retriable', suggestedFix: 'Check network connectivity and retry with backoff' },
  { pattern: /timeout|ETIMEDOUT/i, module: 'communication', severity: 'medium', recoverability: 'retriable', suggestedFix: 'Increase timeout or check service health' },
  // Workflow errors
  { pattern: /workflow.*fail|pipeline.*break/i, module: 'workflow', severity: 'high', recoverability: 'retriable', suggestedFix: 'Check workflow step dependencies and retry from last checkpoint' },
  { pattern: /cron.*fail|schedule.*error/i, module: 'workflow', severity: 'medium', recoverability: 'retriable', suggestedFix: 'Verify cron expression and scheduled task configuration' },
];

// ═══════════════════════════════════════════════════════════════
// FAILURE PREDICTION PATTERNS
// ═══════════════════════════════════════════════════════════════

export const PREDICTION_PATTERNS: FailurePattern[] = [
  {
    name: 'Latency Cascade',
    description: 'Increasing latency across consecutive spans predicts timeout failure',
    indicators: [
      { metric: 'span_latency_trend', condition: 'increasing', value: 0, threshold: 1.5, weight: 0.4 },
      { metric: 'avg_latency_ratio', condition: 'threshold_exceeded', value: 0, threshold: 3.0, weight: 0.3 },
      { metric: 'timeout_proximity', condition: 'threshold_exceeded', value: 0, threshold: 0.8, weight: 0.3 },
    ],
    historicalOccurrences: 0, avgTimeToFailure: 30000, avgConfidence: 0.7,
  },
  {
    name: 'Token Exhaustion',
    description: 'Context window approaching limit predicts truncation or model failure',
    indicators: [
      { metric: 'context_window_usage', condition: 'threshold_exceeded', value: 0, threshold: 0.85, weight: 0.5 },
      { metric: 'token_growth_rate', condition: 'increasing', value: 0, threshold: 1.2, weight: 0.3 },
      { metric: 'compression_attempts', condition: 'threshold_exceeded', value: 0, threshold: 2, weight: 0.2 },
    ],
    historicalOccurrences: 0, avgTimeToFailure: 15000, avgConfidence: 0.8,
  },
  {
    name: 'Error Rate Acceleration',
    description: 'Accelerating error rate predicts system-wide failure',
    indicators: [
      { metric: 'error_rate_derivative', condition: 'increasing', value: 0, threshold: 0.1, weight: 0.4 },
      { metric: 'unique_error_types', condition: 'increasing', value: 0, threshold: 3, weight: 0.3 },
      { metric: 'retry_exhaustion_rate', condition: 'threshold_exceeded', value: 0, threshold: 0.5, weight: 0.3 },
    ],
    historicalOccurrences: 0, avgTimeToFailure: 60000, avgConfidence: 0.75,
  },
  {
    name: 'Memory Pressure',
    description: 'Memory tier degradation predicts retrieval failures',
    indicators: [
      { metric: 'memory_stale_ratio', condition: 'threshold_exceeded', value: 0, threshold: 0.3, weight: 0.4 },
      { metric: 'retrieval_miss_rate', condition: 'increasing', value: 0, threshold: 0.2, weight: 0.3 },
      { metric: 'decay_acceleration', condition: 'increasing', value: 0, threshold: 1.5, weight: 0.3 },
    ],
    historicalOccurrences: 0, avgTimeToFailure: 120000, avgConfidence: 0.65,
  },
  {
    name: 'Reasoning Degradation',
    description: 'Cognitive fingerprint drift predicts agent reasoning failures',
    indicators: [
      { metric: 'cognitive_drift_score', condition: 'threshold_exceeded', value: 0, threshold: 25, weight: 0.4 },
      { metric: 'decision_consistency_drop', condition: 'increasing', value: 0, threshold: 0.2, weight: 0.3 },
      { metric: 'planning_depth_decrease', condition: 'increasing', value: 0, threshold: 0.3, weight: 0.3 },
    ],
    historicalOccurrences: 0, avgTimeToFailure: 180000, avgConfidence: 0.6,
  },
  {
    name: 'Hierarchy Bottleneck',
    description: 'Escalation rate spike predicts orchestrator overload',
    indicators: [
      { metric: 'escalation_rate', condition: 'threshold_exceeded', value: 0, threshold: 0.5, weight: 0.4 },
      { metric: 'delegation_failure_rate', condition: 'increasing', value: 0, threshold: 0.2, weight: 0.3 },
      { metric: 'queue_depth', condition: 'threshold_exceeded', value: 0, threshold: 10, weight: 0.3 },
    ],
    historicalOccurrences: 0, avgTimeToFailure: 45000, avgConfidence: 0.7,
  },
];
