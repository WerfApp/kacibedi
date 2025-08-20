import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Instances, Instance, Text } from '@react-three/drei';
import { Mesh, Vector3, Color } from 'three';
// Using Text from react-three-drei instead of troika-three-text for compatibility
import { useStore } from '../state/useStore';
import { oklchToCSS } from '../lib/colors';
import { calculateNodeRadius } from '../lib/geometry';

interface NodesProps {
  onNodeClick: (nodeId: string) => void;
  onNodeDoubleClick: (nodeId: string) => void;
  onNodeHover: (nodeId: string | null) => void;
}

export default function Nodes({ onNodeClick, onNodeDoubleClick, onNodeHover }: NodesProps) {
  const { nodes, viewState, linkMode } = useStore();
  const { raycaster, camera, scene } = useThree();
  const instancesRef = useRef<any>();
  const labelsRef = useRef<Map<string, Text>>(new Map());
  
  const visibleNodes = useMemo(() => {
    const rootId = viewState.rootId;
    const visible = new Set([rootId]);
    
    // Add immediate children
    nodes.filter(n => n.parentId === rootId).forEach(child => {
      visible.add(child.id);
    });
    
    // Add linked neighbors within radius
    nodes.forEach(node => {
      if (visible.has(node.id)) {
        node.links.forEach(linkId => {
          const linkedNode = nodes.find(n => n.id === linkId);
          if (linkedNode) {
            visible.add(linkId);
          }
        });
      }
    });
    
    return nodes.filter(n => visible.has(n.id));
  }, [nodes, viewState.rootId]);

  const nodeInstances = useMemo(() => {
    return visibleNodes.map((node, index) => {
      const radius = calculateNodeRadius(node.title, node.id === viewState.selectedNodeId);
      const color = new Color(oklchToCSS(node.color.oklch));
      const position = node.position || { x: 0, y: 0, z: 0 };
      
      return {
        id: node.id,
        index,
        position: new Vector3(position.x, position.y, position.z),
        scale: new Vector3(radius, radius, radius),
        color,
        node
      };
    });
  }, [visibleNodes, viewState.selectedNodeId]);

  // Update instance transforms
  useFrame(() => {
    if (!instancesRef.current) return;
    
    nodeInstances.forEach(({ index, position, scale, color }) => {
      const mesh = instancesRef.current.getMatrixAt(index);
      instancesRef.current.setMatrixAt(index, mesh.makeTransform(position, undefined, scale));
      instancesRef.current.setColorAt(index, color);
    });
    
    instancesRef.current.instanceMatrix.needsUpdate = true;
    if (instancesRef.current.instanceColor) {
      instancesRef.current.instanceColor.needsUpdate = true;
    }
  });

  // Handle interactions
  const handlePointerMove = (event: any) => {
    if (!instancesRef.current) return;
    
    const intersects = raycaster.intersectObject(instancesRef.current);
    if (intersects.length > 0) {
      const instanceId = intersects[0].instanceId;
      if (instanceId !== undefined && nodeInstances[instanceId]) {
        const nodeInstance = nodeInstances[instanceId];
        onNodeHover(nodeInstance.id);
        document.body.style.cursor = 'pointer';
      }
    } else {
      onNodeHover(null);
      document.body.style.cursor = 'default';
    }
  };

  const handleClick = (event: any) => {
    if (!instancesRef.current) return;
    
    const intersects = raycaster.intersectObject(instancesRef.current);
    if (intersects.length > 0) {
      const instanceId = intersects[0].instanceId;
      if (instanceId !== undefined && nodeInstances[instanceId]) {
        const nodeInstance = nodeInstances[instanceId];
        
        if (linkMode.active && linkMode.sourceNodeId && linkMode.sourceNodeId !== nodeInstance.id) {
          // Create link
          useStore.getState().createLink(linkMode.sourceNodeId, nodeInstance.id);
          useStore.getState().toggleLinkMode();
        } else {
          onNodeClick(nodeInstance.id);
        }
      }
    }
  };

  const handleDoubleClick = (event: any) => {
    if (!instancesRef.current) return;
    
    const intersects = raycaster.intersectObject(instancesRef.current);
    if (intersects.length > 0) {
      const instanceId = intersects[0].instanceId;
      if (instanceId !== undefined && nodeInstances[instanceId]) {
        const nodeInstance = nodeInstances[instanceId];
        onNodeDoubleClick(nodeInstance.id);
      }
    }
  };

  // Render text labels for hovered/selected nodes
  const renderLabels = () => {
    const labelsToRender = visibleNodes.filter(node => 
      node.id === viewState.hoveredNodeId || node.id === viewState.selectedNodeId
    );

    return labelsToRender.map(node => {
      const position = node.position || { x: 0, y: 0, z: 0 };
      const radius = calculateNodeRadius(node.title, node.id === viewState.selectedNodeId);
      
      return (
        <Text
          key={`label-${node.id}`}
          position={[position.x, position.y + radius + 0.5, position.z]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="rgba(0,0,0,0.8)"
        >
          {node.title}
        </Text>
      );
    });
  };

  if (visibleNodes.length === 0) {
    return null;
  }

  return (
    <group>
      <Instances
        ref={instancesRef}
        limit={visibleNodes.length}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          onNodeHover(null);
          document.body.style.cursor = 'default';
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial />
        
        {nodeInstances.map((instance) => (
          <Instance
            key={instance.id}
            position={instance.position}
            scale={instance.scale}
            color={instance.color}
          />
        ))}
      </Instances>
      
      {renderLabels()}
    </group>
  );
}
