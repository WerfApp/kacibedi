export interface Node {
  id: string;
  parentId: string | null;
  title: string;
  body?: string;
  tags?: string[];
  color: { oklch: { l: number; c: number; h: number } };
  createdAt: number;
  updatedAt: number;
  links: string[];
  position?: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
}

export interface AppSettings {
  theme: 'light' | 'dark';
  motionReduced: boolean;
  performanceCap: {
    nodeLabels: 'always' | 'hover' | 'never';
    maxVisibleNodes: number;
    edgeThickness: 'thick' | 'normal' | 'thin';
  };
  layoutDefaults: {
    linkStrength: number;
    collisionRadius: number;
    centerStrength: number;
  };
}

export interface Session {
  id: string;
  currentRootId: string;
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
  lastAccessed: number;
}

export interface Command {
  id: string;
  label: string;
  description: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}

export interface LinkMode {
  active: boolean;
  sourceNodeId?: string;
}

export interface ViewState {
  rootId: string;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  breadcrumb: string[];
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
}

export interface LayoutMessage {
  type: 'init' | 'tick' | 'result' | 'stop';
  nodes?: Node[];
  links?: Array<{ source: string; target: string }>;
  positions?: Record<string, { x: number; y: number; z: number }>;
}

export interface MindMapExport {
  name: string;
  description?: string;
  exportedAt: number;
  version: string;
  nodes: Node[];
  rootId: string;
  metadata: {
    nodeCount: number;
    createdAt: number;
    lastModified: number;
  };
}
