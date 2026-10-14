import type { RelationshipKind } from '@/lib/schema';

export type GNode = { id: string; name: string; type: string; gen: number; conflicted: boolean; x?: number; y?: number; z?: number; fx?: number; fy?: number; fz?: number };
export type GLink = { id: string; source: string | GNode; target: string | GNode; kind: RelationshipKind; src: string; curvature: number };

export type GraphProps = {
  nodes: GNode[];
  links: GLink[];
  selectedId: string | null;
  highlightNodes: Set<string> | null;
  highlightLinks: Set<string> | null;
  reduced: boolean;
  onNodeClick: (id: string) => void;
  fitSignal: number;
};

export const endId = (e: string | GNode) => (typeof e === 'string' ? e : e.id);
