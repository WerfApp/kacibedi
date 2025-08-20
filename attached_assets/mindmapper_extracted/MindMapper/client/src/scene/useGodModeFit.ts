import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useStore } from '../state/useStore';
import * as THREE from 'three';

export function useGodModeFit() {
  const { camera, controls } = useThree();
  const { godMode, godLayout, lastCameraPose, setLastCameraPose } = useStore();
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!controls || !('target' in controls)) return;
    const orbitControls = controls as any; // OrbitControls type

    if (godMode && godLayout) {
      // Save current camera pose if not already saved
      if (!lastCameraPose && !isInitialMount.current) {
        const currentPose = {
          pos: camera.position.toArray() as [number, number, number],
          target: orbitControls.target.toArray() as [number, number, number]
        };
        setLastCameraPose(currentPose);
      }

      // Calculate bounding sphere from layout
      const positions = Object.values(godLayout);
      if (positions.length === 0) return;

      const center = new THREE.Vector3();
      positions.forEach(pos => {
        center.add(new THREE.Vector3(pos.x, pos.y, pos.z));
      });
      center.divideScalar(positions.length);

      let maxDistance = 0;
      positions.forEach(pos => {
        const distance = center.distanceTo(new THREE.Vector3(pos.x, pos.y, pos.z));
        maxDistance = Math.max(maxDistance, distance);
      });

      // Calculate optimal camera distance
      const fov = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180;
      const distance = Math.max(10, (maxDistance * 1.2) / Math.tan(fov / 2));

      // Animate camera to fit the layout
      const targetPosition = center.clone().add(new THREE.Vector3(0, 0, distance));
      
      // Smooth animation
      const startPos = camera.position.clone();
      const startTarget = orbitControls.target.clone();
      const duration = 1000; // 1 second
      const startTime = Date.now();

      const animateToFit = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out

        camera.position.lerpVectors(startPos, targetPosition, easeProgress);
        orbitControls.target.lerpVectors(startTarget, center, easeProgress);
        orbitControls.update();

        if (progress < 1) {
          requestAnimationFrame(animateToFit);
        }
      };

      animateToFit();

      // Set OrbitControls limits
      orbitControls.minDistance = maxDistance * 0.4;
      orbitControls.maxDistance = maxDistance * 8;

    } else if (!godMode && lastCameraPose) {
      // Restore previous camera pose
      const { pos, target } = lastCameraPose;
      
      const startPos = camera.position.clone();
      const startTarget = orbitControls.target.clone();
      const targetPos = new THREE.Vector3(...pos);
      const targetTarget = new THREE.Vector3(...target);
      
      const duration = 800;
      const startTime = Date.now();

      const animateRestore = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        camera.position.lerpVectors(startPos, targetPos, easeProgress);
        orbitControls.target.lerpVectors(startTarget, targetTarget, easeProgress);
        orbitControls.update();

        if (progress < 1) {
          requestAnimationFrame(animateRestore);
        }
      };

      animateRestore();

      // Reset OrbitControls limits
      orbitControls.minDistance = 1;
      orbitControls.maxDistance = 1000;
    }

    isInitialMount.current = false;
  }, [godMode, godLayout, camera, controls, lastCameraPose, setLastCameraPose]);
}