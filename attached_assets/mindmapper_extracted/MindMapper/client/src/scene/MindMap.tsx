import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { Vector3 } from 'three';
import { useStore } from '../state/useStore';
import { useCameraSpring } from '../lib/camera';
import Nodes from './Nodes';
import Edges from './Edges';

function CameraController() {
  const { viewState } = useStore();
  const { animateToPosition } = useCameraSpring();
  const controlsRef = useRef<any>();
  const { camera } = useThree();

  useEffect(() => {
    const targetPosition = new Vector3(
      viewState.cameraPosition.x,
      viewState.cameraPosition.y,
      viewState.cameraPosition.z
    );
    const targetLookAt = new Vector3(
      viewState.cameraTarget.x,
      viewState.cameraTarget.y,
      viewState.cameraTarget.z
    );

    animateToPosition(targetPosition, targetLookAt);
    
    if (controlsRef.current) {
      controlsRef.current.target.copy(targetLookAt);
    }
  }, [viewState.cameraPosition, viewState.cameraTarget, animateToPosition]);

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

function Scene() {
  const { setCurrentRoot, selectNode, hoverNode, openInlineEditor } = useStore();

  const handleNodeClick = (nodeId: string) => {
    selectNode(nodeId);
  };

  const handleNodeDoubleClick = async (nodeId: string) => {
    await setCurrentRoot(nodeId);
  };

  const handleNodeHover = (nodeId: string | null) => {
    hoverNode(nodeId);
  };

  const handleCanvasClick = (event: any) => {
    // Canvas click handling will be done through the onClick prop
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const { viewState, linkMode } = useStore.getState();

      switch (event.key.toLowerCase()) {
        case ' ':
          event.preventDefault();
          // Create new node at a random position near center
          const position = {
            x: (Math.random() - 0.5) * 4,
            y: (Math.random() - 0.5) * 4,
            z: (Math.random() - 0.5) * 4
          };
          useStore.getState().createNode('New Node', position);
          break;

        case 'e':
          if (viewState.selectedNodeId) {
            openInlineEditor(viewState.selectedNodeId);
          }
          break;

        case 'l':
          if (viewState.selectedNodeId) {
            useStore.getState().toggleLinkMode(viewState.selectedNodeId);
          }
          break;

        case 'g':
          useStore.getState().toggleAutoLayout();
          break;

        case 'c':
          if (viewState.selectedNodeId) {
            useStore.getState().recolorSubtree(viewState.selectedNodeId);
          }
          break;

        case 'backspace':
          if (!viewState.selectedNodeId) {
            useStore.getState().goToParent();
          }
          break;

        case 'enter':
          if (viewState.selectedNodeId) {
            setCurrentRoot(viewState.selectedNodeId);
          }
          break;

        case 'escape':
          if (linkMode.active) {
            useStore.getState().toggleLinkMode();
          } else {
            selectNode(null);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentRoot, selectNode, openInlineEditor]);

  return (
    <>
      <CameraController />
      
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      
      <Suspense fallback={null}>
        <Nodes
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeHover={handleNodeHover}
        />
        <Edges />
      </Suspense>
      
      <Environment preset="city" />
    </>
  );
}

export default function MindMap() {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{ position: [5, 5, 5], fov: 75 }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
