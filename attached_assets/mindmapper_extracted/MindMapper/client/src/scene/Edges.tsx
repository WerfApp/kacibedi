import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useStore } from '../state/useStore';
import { Vector3 } from 'three';

export default function Edges() {
  const { nodes, viewState } = useStore();

  const visibleEdges = useMemo(() => {
    const rootId = viewState.rootId;
    const visibleNodeIds = new Set([rootId]);
    
    // Get visible nodes
    nodes.filter(n => n.parentId === rootId).forEach(child => {
      visibleNodeIds.add(child.id);
    });
    
    // Add linked neighbors
    nodes.forEach(node => {
      if (visibleNodeIds.has(node.id)) {
        node.links.forEach(linkId => {
          if (nodes.find(n => n.id === linkId)) {
            visibleNodeIds.add(linkId);
          }
        });
      }
    });

    const visibleNodes = nodes.filter(n => visibleNodeIds.has(n.id));
    const edges: Array<{ start: Vector3; end: Vector3; type: 'parent' | 'link' }> = [];

    // Parent-child edges
    visibleNodes.forEach(node => {
      if (node.parentId && visibleNodeIds.has(node.parentId)) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent?.position && node.position) {
          edges.push({
            start: new Vector3(parent.position.x, parent.position.y, parent.position.z),
            end: new Vector3(node.position.x, node.position.y, node.position.z),
            type: 'parent'
          });
        }
      }
    });

    // User-created link edges
    visibleNodes.forEach(node => {
      if (node.position) {
        node.links.forEach(linkId => {
          if (visibleNodeIds.has(linkId)) {
            const linkedNode = nodes.find(n => n.id === linkId);
            if (linkedNode?.position) {
              edges.push({
                start: new Vector3(node.position!.x, node.position!.y, node.position!.z),
                end: new Vector3(linkedNode.position.x, linkedNode.position.y, linkedNode.position.z),
                type: 'link'
              });
            }
          }
        });
      }
    });

    return edges;
  }, [nodes, viewState.rootId]);

  return (
    <group>
      {visibleEdges.map((edge, index) => {
        const points = [edge.start, edge.end];
        const color = edge.type === 'parent' ? '#3b82f6' : '#10b981';
        const opacity = edge.type === 'parent' ? 0.6 : 0.4;
        
        return (
          <Line
            key={`edge-${index}`}
            points={points}
            color={color}
            transparent
            opacity={opacity}
            lineWidth={2}
          />
        );
      })}
    </group>
  );
}
