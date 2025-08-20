import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Vector3 } from 'three';

interface CameraSpring {
  position: Vector3;
  target: Vector3;
  positionVelocity: Vector3;
  targetVelocity: Vector3;
}

export function useCameraSpring() {
  const springRef = useRef<CameraSpring>({
    position: new Vector3(5, 5, 5),
    target: new Vector3(0, 0, 0),
    positionVelocity: new Vector3(),
    targetVelocity: new Vector3()
  });

  const animateToPosition = (
    newPosition: Vector3,
    newTarget: Vector3,
    duration: number = 0.8
  ) => {
    const spring = springRef.current;
    // Simple spring animation - in production, use a proper spring library
    const steps = Math.ceil(duration * 60); // 60fps
    let currentStep = 0;

    const animate = () => {
      if (currentStep >= steps) return;
      
      const progress = currentStep / steps;
      const eased = easeInOutCubic(progress);
      
      spring.position.lerp(newPosition, eased * 0.1);
      spring.target.lerp(newTarget, eased * 0.1);
      
      currentStep++;
      requestAnimationFrame(animate);
    };
    
    animate();
  };

  const getCameraState = () => ({
    position: springRef.current.position.clone(),
    target: springRef.current.target.clone()
  });

  return { animateToPosition, getCameraState };
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function calculateOptimalCameraPosition(
  targetPosition: Vector3,
  boundingRadius: number = 5
): { position: Vector3; target: Vector3 } {
  const distance = Math.max(boundingRadius * 2, 8);
  const angle = Math.PI / 6; // 30 degrees elevation
  
  const position = new Vector3(
    targetPosition.x + distance * Math.cos(angle),
    targetPosition.y + distance * Math.sin(angle),
    targetPosition.z + distance * 0.5
  );

  return {
    position,
    target: targetPosition.clone()
  };
}
