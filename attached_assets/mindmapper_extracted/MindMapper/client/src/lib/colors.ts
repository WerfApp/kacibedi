import { oklch, converter, formatCss } from 'culori';

const GOLDEN_ANGLE = 137.508;

export interface OKLCHColor {
  l: number;
  c: number;
  h: number;
}

export function generateChildColor(parentColor: OKLCHColor, depth: number): OKLCHColor {
  const newHue = (parentColor.h + depth * GOLDEN_ANGLE) % 360;
  const newChroma = Math.max(0, Math.min(0.25, parentColor.c * 0.92));
  const lightnessDelta = Math.sign(0.5 - parentColor.l) * 0.04;
  const newLightness = Math.max(0.35, Math.min(0.9, parentColor.l + lightnessDelta));

  return {
    l: newLightness,
    c: newChroma,
    h: newHue
  };
}

export function oklchToCSS(color: OKLCHColor): string {
  const oklchColor = oklch({ l: color.l, c: color.c, h: color.h });
  return formatCss(oklchColor);
}

export function generateRootColor(): OKLCHColor {
  return {
    l: 0.7,
    c: 0.15,
    h: Math.random() * 360
  };
}

export function generateNodeColors(nodes: import('../types').Node[], rootHue: number): Record<string, OKLCHColor> {
  const colors: Record<string, OKLCHColor> = {};
  const visited = new Set<string>();
  
  // Find root node
  const rootNode = nodes.find(n => n.parentId === null);
  if (!rootNode) return colors;
  
  // Set root color
  colors[rootNode.id] = { l: 0.7, c: 0.15, h: rootHue };
  
  // BFS to assign colors to children
  const queue = [{ node: rootNode, depth: 0 }];
  visited.add(rootNode.id);
  
  while (queue.length > 0) {
    const { node, depth } = queue.shift()!;
    const children = nodes.filter(n => n.parentId === node.id && !visited.has(n.id));
    
    children.forEach((child, index) => {
      if (!visited.has(child.id)) {
        const parentColor = colors[node.id];
        colors[child.id] = generateChildColor(parentColor, depth + index + 1);
        queue.push({ node: child, depth: depth + 1 });
        visited.add(child.id);
      }
    });
  }
  
  return colors;
}

export function getContrastColor(backgroundColor: OKLCHColor): string {
  return backgroundColor.l > 0.5 ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
}
