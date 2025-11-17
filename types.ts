
export interface MindMapNode {
  id: string;
  label: string;
  level: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface MindMapLink {
  source: string;
  target: string;
}

export interface MindMapData {
  nodes: MindMapNode[];
  links: MindMapLink[];
  centralTopic: string;
}
