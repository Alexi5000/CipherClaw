/**
 * CipherClaw — Built-in Flow Tests
 * Pre-configured integration test flows for agent, CRM, content, and memory domains.
 */

import type { FlowTest } from '../types/index.js';
import { uid } from './utils.js';

/** Create the default set of built-in flow tests covering all domains. */
export function createBuiltInFlowTests(): FlowTest[] {
  return [
    // Agent domain flows
    {
      id: uid('ft'), name: 'Agent Boot → Plan → Execute → Memory Write', domain: 'agent',
      steps: [
        { id: uid('fs'), name: 'Agent Initialization', description: 'Agent loads config and soul prompt', expectedOutcome: 'Agent status: ready', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Task Planning', description: 'Agent creates execution plan from input', expectedOutcome: 'Plan with ≥1 steps generated', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Tool Execution', description: 'Agent executes planned tool calls', expectedOutcome: 'All tool calls return results', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Memory Persistence', description: 'Agent writes results to memory', expectedOutcome: 'Memory write confirmed', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
      ],
      synthesizedFrom: null, status: 'pending', startedAt: null, completedAt: null, coverage: 0,
    },
    {
      id: uid('ft'), name: 'Agent Delegation → Sub-Agent → Result Aggregation', domain: 'agent',
      steps: [
        { id: uid('fs'), name: 'Delegation Decision', description: 'Orchestrator decides to delegate', expectedOutcome: 'Delegation target identified', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Sub-Agent Invocation', description: 'Sub-agent receives and processes task', expectedOutcome: 'Sub-agent returns result', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Result Aggregation', description: 'Orchestrator aggregates sub-results', expectedOutcome: 'Aggregated result available', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
      ],
      synthesizedFrom: null, status: 'pending', startedAt: null, completedAt: null, coverage: 0,
    },
    {
      id: uid('ft'), name: 'Error → Classification → Recovery → Escalation', domain: 'agent',
      steps: [
        { id: uid('fs'), name: 'Error Occurrence', description: 'Agent encounters an error', expectedOutcome: 'Error captured in trace', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Error Classification', description: 'Error classified by module/severity', expectedOutcome: 'Classification complete', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Recovery Attempt', description: 'Agent attempts recovery based on recoverability', expectedOutcome: 'Recovery attempted or escalated', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Escalation', description: 'Unrecoverable errors escalated to parent', expectedOutcome: 'Parent agent notified', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
      ],
      synthesizedFrom: null, status: 'pending', startedAt: null, completedAt: null, coverage: 0,
    },
    // CRM domain flows
    {
      id: uid('ft'), name: 'Lead Capture → Enrichment → Scoring → Assignment', domain: 'crm',
      steps: [
        { id: uid('fs'), name: 'Lead Capture', description: 'New lead enters the system', expectedOutcome: 'Lead record created', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Data Enrichment', description: 'Lead data enriched from external sources', expectedOutcome: 'Enrichment fields populated', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Lead Scoring', description: 'Lead scored based on criteria', expectedOutcome: 'Score assigned', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Assignment', description: 'Lead assigned to sales rep or agent', expectedOutcome: 'Assignment confirmed', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
      ],
      synthesizedFrom: null, status: 'pending', startedAt: null, completedAt: null, coverage: 0,
    },
    {
      id: uid('ft'), name: 'Outreach → Response → Follow-up → Deal Creation', domain: 'crm',
      steps: [
        { id: uid('fs'), name: 'Outreach Sent', description: 'Initial outreach message sent', expectedOutcome: 'Message delivered', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Response Received', description: 'Lead responds to outreach', expectedOutcome: 'Response captured', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Follow-up Scheduled', description: 'Follow-up action scheduled', expectedOutcome: 'Follow-up in queue', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Deal Created', description: 'Qualified lead converted to deal', expectedOutcome: 'Deal record created', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
      ],
      synthesizedFrom: null, status: 'pending', startedAt: null, completedAt: null, coverage: 0,
    },
    // Content domain flows
    {
      id: uid('ft'), name: 'Content Create → Review → Approve → Publish', domain: 'content',
      steps: [
        { id: uid('fs'), name: 'Content Creation', description: 'Content generated by agent', expectedOutcome: 'Draft content available', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Quality Review', description: 'Content reviewed for quality', expectedOutcome: 'Review score ≥ threshold', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Approval', description: 'Content approved for publishing', expectedOutcome: 'Approval granted', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Publishing', description: 'Content published to platform', expectedOutcome: 'Published successfully', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
      ],
      synthesizedFrom: null, status: 'pending', startedAt: null, completedAt: null, coverage: 0,
    },
    // Memory domain flows
    {
      id: uid('ft'), name: 'Memory Write → Retrieve → Decay → Promote', domain: 'memory',
      steps: [
        { id: uid('fs'), name: 'Memory Write', description: 'Data written to working memory', expectedOutcome: 'Write confirmed', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Memory Retrieval', description: 'Data retrieved from appropriate tier', expectedOutcome: 'Correct data returned', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Decay Processing', description: 'Memory items decay over time', expectedOutcome: 'Decay applied correctly', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Tier Promotion', description: 'Important items promoted to higher tier', expectedOutcome: 'Promotion successful', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
      ],
      synthesizedFrom: null, status: 'pending', startedAt: null, completedAt: null, coverage: 0,
    },
    // Cross-domain flows
    {
      id: uid('ft'), name: 'Agent → CRM Lead → Content → Social Post (Full Pipeline)', domain: 'all',
      steps: [
        { id: uid('fs'), name: 'Agent Task Reception', description: 'Agent receives social selling task', expectedOutcome: 'Task parsed and planned', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'CRM Lead Selection', description: 'Agent selects target leads from CRM', expectedOutcome: 'Leads selected', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Content Generation', description: 'Agent generates personalized content', expectedOutcome: 'Content created', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Social Publishing', description: 'Content published to social platform', expectedOutcome: 'Post published', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
        { id: uid('fs'), name: 'Result Tracking', description: 'Engagement tracked and fed back to CRM', expectedOutcome: 'Metrics recorded', actualOutcome: null, status: 'pending', durationMs: null, assertions: [] },
      ],
      synthesizedFrom: null, status: 'pending', startedAt: null, completedAt: null, coverage: 0,
    },
  ];
}
