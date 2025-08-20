import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force-3d';
import { LayoutMessage, Node } from '../types';

interface WorkerNode extends Node {
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number;
  fy?: number;
  fz?: number;
}

interface Link {
  source: string | WorkerNode;
  target: string | WorkerNode;
}

let simulation: any = null;
let nodes: WorkerNode[] = [];
let links: Link[] = [];

self.onmessage = function(event: MessageEvent<LayoutMessage>) {
  const { type, nodes: newNodes, links: newLinks } = event.data;

  switch (type) {
    case 'init':
      if (newNodes && newLinks) {
        initializeSimulation(newNodes, newLinks);
      }
      break;
    
    case 'tick':
      if (simulation) {
        simulation.tick();
        sendPositions();
      }
      break;
    
    case 'stop':
      if (simulation) {
        simulation.stop();
      }
      break;
  }
};

function initializeSimulation(newNodes: Node[], newLinks: Array<{ source: string; target: string }>) {
  nodes = newNodes.map(node => ({
    ...node,
    x: node.position?.x || (Math.random() - 0.5) * 10,
    y: node.position?.y || (Math.random() - 0.5) * 10,
    z: node.position?.z || (Math.random() - 0.5) * 10
  }));

  links = newLinks.map(link => ({
    source: link.source,
    target: link.target
  }));

  // Create simulation with forces
  simulation = forceSimulation(nodes)
    .force('link', forceLink(links)
      .id((d: any) => d.id)
      .strength(0.3)
      .distance(2))
    .force('charge', forceManyBody()
      .strength(-30)
      .distanceMax(10))
    .force('center', forceCenter(0, 0, 0)
      .strength(0.05))
    .force('collide', forceCollide()
      .radius((d: any) => calculateNodeRadius(d.title) * 2)
      .strength(0.7))
    .force('z-jiggle', () => {
      // Add slight z-axis movement for 3D depth
      nodes.forEach(node => {
        if (node.z !== undefined) {
          node.z += (Math.random() - 0.5) * 0.01;
        }
      });
    })
    .alphaDecay(0.02)
    .velocityDecay(0.4);

  // Run simulation for a burst
  simulation.tick(100);
  sendPositions();

  // Continue with regular ticking
  const tickInterval = setInterval(() => {
    if (simulation.alpha() <= simulation.alphaMin()) {
      clearInterval(tickInterval);
      return;
    }
    simulation.tick();
    sendPositions();
  }, 16); // ~60fps
}

function calculateNodeRadius(title: string): number {
  return 0.3 + Math.min(title.length * 0.02, 0.2);
}

function sendPositions() {
  const positions: Record<string, { x: number; y: number; z: number }> = {};
  
  nodes.forEach(node => {
    positions[node.id] = {
      x: node.x || 0,
      y: node.y || 0,
      z: node.z || 0
    };
  });

  const message: LayoutMessage = {
    type: 'result',
    positions
  };

  self.postMessage(message);
}
