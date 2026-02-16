/**
 * CipherClaw — Capability 1: Causal Debug Graph (CDG)
 * Builds a directed acyclic graph of causal relationships between spans,
 * identifies root causes, calculates impact propagation, and finds critical paths.
 */

import type { Span, Trace, CausalNode, CausalGraph, CausalEdge, DebugSession } from '../types/index.js';
import { uid, clamp } from './utils.js';

/** Update the causal graph for a session based on a new trace. */
export function updateCausalGraph(session: DebugSession, trace: Trace): void {
  const graph = session.causalGraph;
  const spanMap = new Map<string, Span>();
  for (const span of trace.spans) {
    spanMap.set(span.id, span);
  }

  // Create nodes
  for (const span of trace.spans) {
    const existing = graph.nodes.find(n => n.spanId === span.id);
    if (existing) continue;

    const node: CausalNode = {
      id: uid('cn'),
      spanId: span.id,
      agentId: span.agentId,
      operation: span.name,
      domain: span.domain,
      timestamp: span.startTime,
      durationMs: span.durationMs,
      status: span.status,
      parents: [],
      children: [],
      rootCauseProbability: 0,
      depth: 0,
      metadata: span.attributes,
    };
    graph.nodes.push(node);
  }

  // Create edges based on parent-child span relationships
  for (const span of trace.spans) {
    if (!span.parentSpanId) continue;
    const childNode = graph.nodes.find(n => n.spanId === span.id);
    const parentNode = graph.nodes.find(n => n.spanId === span.parentSpanId);
    if (!childNode || !parentNode) continue;

    if (!parentNode.children.includes(childNode.id)) {
      parentNode.children.push(childNode.id);
    }
    if (!childNode.parents.includes(parentNode.id)) {
      childNode.parents.push(parentNode.id);
    }

    const edgeExists = graph.edges.some(e => e.from === parentNode.id && e.to === childNode.id);
    if (!edgeExists) {
      const edge: CausalEdge = {
        from: parentNode.id,
        to: childNode.id,
        type: span.status === 'error' || span.status === 'critical' ? 'error_propagation' : 'control_flow',
        weight: 1,
        latencyMs: span.startTime - (spanMap.get(span.parentSpanId)?.endTime ?? span.startTime),
      };
      graph.edges.push(edge);
    }
  }

  calculateNodeDepths(graph);
  identifyRootCauses(graph);
  calculateRootCauseProbabilities(graph);
  graph.criticalPath = findCriticalPath(graph);

  const impacted = new Set<string>();
  for (const rcId of graph.rootCauses) {
    collectDescendants(graph, rcId, impacted);
  }
  graph.impactedNodes = Array.from(impacted);
}

/** Get the causal graph for a session. */
export function getCausalGraph(session: DebugSession): CausalGraph {
  return session.causalGraph;
}

/** Get root cause nodes from the causal graph. */
export function getCausalRootCauses(session: DebugSession): CausalNode[] {
  const graph = session.causalGraph;
  return graph.nodes.filter(n => graph.rootCauses.includes(n.id));
}

/** Calculate BFS depth for every node in the graph. */
export function calculateNodeDepths(graph: CausalGraph): void {
  const rootNodes = graph.nodes.filter(n => n.parents.length === 0);
  const visited = new Set<string>();
  const queue: { nodeId: string; depth: number }[] = rootNodes.map(n => ({ nodeId: n.id, depth: 0 }));

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) continue;
    node.depth = depth;

    for (const childId of node.children) {
      if (!visited.has(childId)) {
        queue.push({ nodeId: childId, depth: depth + 1 });
      }
    }
  }
}

/** Identify root cause nodes: error nodes whose parents are all non-error. */
export function identifyRootCauses(graph: CausalGraph): void {
  graph.rootCauses = graph.nodes
    .filter(n => (n.status === 'error' || n.status === 'critical') &&
      n.parents.every(pid => {
        const parent = graph.nodes.find(pn => pn.id === pid);
        return parent && parent.status !== 'error' && parent.status !== 'critical';
      }))
    .map(n => n.id);
}

/** Assign root-cause probability scores to every node. */
export function calculateRootCauseProbabilities(graph: CausalGraph): void {
  const errorNodes = graph.nodes.filter(n => n.status === 'error' || n.status === 'critical');
  if (errorNodes.length === 0) return;

  for (const node of graph.nodes) {
    if (graph.rootCauses.includes(node.id)) {
      const descendantErrors = countDescendantErrors(graph, node.id);
      node.rootCauseProbability = clamp(0.5 + (descendantErrors / errorNodes.length) * 0.5, 0, 1);
    } else if (node.status === 'error' || node.status === 'critical') {
      const errorParents = node.parents.filter(pid => {
        const p = graph.nodes.find(pn => pn.id === pid);
        return p && (p.status === 'error' || p.status === 'critical');
      });
      node.rootCauseProbability = clamp(0.1 * (1 - errorParents.length / Math.max(node.parents.length, 1)), 0, 1);
    }
  }
}

/** Count error/critical descendants of a node (excluding itself). */
export function countDescendantErrors(graph: CausalGraph, nodeId: string): number {
  let count = 0;
  const visited = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = graph.nodes.find(n => n.id === id);
    if (!node) continue;
    if (id !== nodeId && (node.status === 'error' || node.status === 'critical')) count++;
    for (const childId of node.children) queue.push(childId);
  }
  return count;
}

/** Find the longest path through error nodes (the critical failure path). */
export function findCriticalPath(graph: CausalGraph): string[] {
  const errorNodes = graph.nodes.filter(n => n.status === 'error' || n.status === 'critical');
  if (errorNodes.length === 0) return [];

  let longestPath: string[] = [];
  for (const rootId of graph.rootCauses) {
    const path = dfsLongestErrorPath(graph, rootId, new Set());
    if (path.length > longestPath.length) longestPath = path;
  }
  return longestPath;
}

/** DFS to find the longest error-only path from a node. */
export function dfsLongestErrorPath(graph: CausalGraph, nodeId: string, visited: Set<string>): string[] {
  if (visited.has(nodeId)) return [];
  visited.add(nodeId);
  const node = graph.nodes.find(n => n.id === nodeId);
  if (!node) return [];

  let longest: string[] = [nodeId];
  for (const childId of node.children) {
    const childNode = graph.nodes.find(n => n.id === childId);
    if (childNode && (childNode.status === 'error' || childNode.status === 'critical')) {
      const childPath = dfsLongestErrorPath(graph, childId, new Set(visited));
      if (childPath.length + 1 > longest.length) {
        longest = [nodeId, ...childPath];
      }
    }
  }
  return longest;
}

/** Recursively collect all descendant node IDs. */
export function collectDescendants(graph: CausalGraph, nodeId: string, collected: Set<string>): void {
  if (collected.has(nodeId)) return;
  collected.add(nodeId);
  const node = graph.nodes.find(n => n.id === nodeId);
  if (!node) return;
  for (const childId of node.children) {
    collectDescendants(graph, childId, collected);
  }
}
