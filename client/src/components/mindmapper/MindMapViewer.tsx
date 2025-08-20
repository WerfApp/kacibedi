import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import { Vector3, Color } from 'three';
import { useMindMapStore } from '../../state/mindmapper/useStore';
import { Node } from '../../db/db';

// 3D Node component
function NodeMesh({ node, onClick, onDoubleClick, onHover }: {
  node: Node;
  onClick: (id: string) => void;
  onDoubleClick: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const meshRef = useRef<any>();
  const { viewState } = useMindMapStore();
  const isSelected = viewState.selectedNodeId === node.id;
  const isHovered = viewState.hoveredNodeId === node.id;

  useFrame(() => {
    if (meshRef.current) {
      const scale = isSelected ? 1.3 : isHovered ? 1.1 : 1.0;
      meshRef.current.scale.setScalar(scale * node.size);
    }
  });

  return (
    <group position={[node.x, node.y, node.z]}>
      <mesh
        ref={meshRef}
        onClick={() => onClick(node.id)}
        onDoubleClick={() => onDoubleClick(node.id)}
        onPointerEnter={() => onHover(node.id)}
        onPointerLeave={() => onHover(null)}
      >
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color={new Color(node.color)}
          emissive={isSelected ? new Color(node.color).multiplyScalar(0.2) : new Color(0x000000)}
        />
      </mesh>
      
      <Text
        position={[0, 1, 0]}
        fontSize={0.3}
        color={node.color}
        anchorX="center"
        anchorY="middle"
        maxWidth={3}
        overflowWrap="break-word"
      >
        {node.text}
      </Text>
    </group>
  );
}

// Edge component (lines between nodes)
function EdgeLine({ from, to, nodes }: { from: string; to: string; nodes: Node[] }) {
  const fromNode = nodes.find(n => n.id === from);
  const toNode = nodes.find(n => n.id === to);

  if (!fromNode || !toNode) return null;

  const points = [
    new Vector3(fromNode.x, fromNode.y, fromNode.z),
    new Vector3(toNode.x, toNode.y, toNode.z)
  ];

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#64748b" />
    </line>
  );
}

// Camera controller
function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<any>();

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={2}
      maxDistance={50}
      panSpeed={1}
      rotateSpeed={0.5}
      zoomSpeed={1}
    />
  );
}

// Main 3D scene
function Scene() {
  const { nodes, edges, selectNode, setCurrentRoot, hoverNode } = useMindMapStore();

  const handleNodeClick = (nodeId: string) => {
    selectNode(nodeId);
  };

  const handleNodeDoubleClick = (nodeId: string) => {
    setCurrentRoot(nodeId);
  };

  const handleNodeHover = (nodeId: string | null) => {
    hoverNode(nodeId);
  };

  return (
    <>
      <CameraController />
      
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      
      {/* Render all nodes */}
      {nodes.map(node => (
        <NodeMesh
          key={node.id}
          node={node}
          onClick={handleNodeClick}
          onDoubleClick={handleNodeDoubleClick}
          onHover={handleNodeHover}
        />
      ))}

      {/* Render all edges */}
      {edges.map(edge => (
        <EdgeLine
          key={edge.id}
          from={edge.from}
          to={edge.to}
          nodes={nodes}
        />
      ))}
      
      <Environment preset="city" />
    </>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <p className="text-slate-300 font-mono">Loading Mind Map...</p>
      </div>
    </div>
  );
}

export default function MindMapViewer() {
  const { initializeStore } = useMindMapStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await initializeStore();
      setInitialized(true);
    };
    initialize();
  }, [initializeStore]);

  if (!initialized) {
    return <LoadingFallback />;
  }

  return (
    <div className="absolute inset-0 bg-slate-900">
      <Canvas
        shadows
        camera={{ position: [5, 5, 5], fov: 75 }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}