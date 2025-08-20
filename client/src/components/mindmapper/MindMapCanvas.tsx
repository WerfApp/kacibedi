import { useEffect, useRef, useState } from 'react';
import { useMindMapStore } from '../../state/mindmapper/useStore';
import { Node } from '../../db/db';

interface CanvasNode extends Node {
  screenX: number;
  screenY: number;
  vx: number;
  vy: number;
}

export default function MindMapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([]);
  const isDragging = useRef(false);
  const dragNode = useRef<string | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const { 
    nodes, 
    edges, 
    viewState, 
    selectNode, 
    createNode, 
    updateNode,
    setCurrentRoot 
  } = useMindMapStore();

  // Initialize canvas nodes with screen coordinates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes.length) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 80; // Scale factor for 3D to 2D conversion

    const newCanvasNodes: CanvasNode[] = nodes.map(node => ({
      ...node,
      screenX: centerX + (node.x * scale),
      screenY: centerY + (node.y * scale),
      vx: 0,
      vy: 0
    }));

    setCanvasNodes(newCanvasNodes);
  }, [nodes]);

  // Animation loop for smooth movement and physics
  useEffect(() => {
    const animate = () => {
      setCanvasNodes(prevNodes => {
        return prevNodes.map(node => {
          // Simple physics for smooth movement
          node.vx *= 0.95; // Damping
          node.vy *= 0.95;
          node.screenX += node.vx;
          node.screenY += node.vy;

          // Keep nodes within canvas bounds
          const canvas = canvasRef.current;
          if (canvas) {
            const margin = 50;
            if (node.screenX < margin) {
              node.screenX = margin;
              node.vx = 0;
            }
            if (node.screenX > canvas.width - margin) {
              node.screenX = canvas.width - margin;
              node.vx = 0;
            }
            if (node.screenY < margin) {
              node.screenY = margin;
              node.vy = 0;
            }
            if (node.screenY > canvas.height - margin) {
              node.screenY = canvas.height - margin;
              node.vy = 0;
            }
          }

          return { ...node };
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const gridSize = 50;
      
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw edges first (so they appear behind nodes)
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      
      edges.forEach(edge => {
        const fromNode = canvasNodes.find(n => n.id === edge.from);
        const toNode = canvasNodes.find(n => n.id === edge.to);
        
        if (fromNode && toNode) {
          ctx.beginPath();
          ctx.moveTo(fromNode.screenX, fromNode.screenY);
          ctx.lineTo(toNode.screenX, toNode.screenY);
          ctx.stroke();

          // Draw arrow
          const angle = Math.atan2(toNode.screenY - fromNode.screenY, toNode.screenX - fromNode.screenX);
          const arrowLength = 15;
          const arrowAngle = Math.PI / 6;
          
          ctx.beginPath();
          ctx.moveTo(
            toNode.screenX - arrowLength * Math.cos(angle - arrowAngle),
            toNode.screenY - arrowLength * Math.sin(angle - arrowAngle)
          );
          ctx.lineTo(toNode.screenX, toNode.screenY);
          ctx.lineTo(
            toNode.screenX - arrowLength * Math.cos(angle + arrowAngle),
            toNode.screenY - arrowLength * Math.sin(angle + arrowAngle)
          );
          ctx.stroke();
        }
      });

      // Draw nodes
      canvasNodes.forEach(node => {
        const isSelected = viewState.selectedNodeId === node.id;
        const isHovered = viewState.hoveredNodeId === node.id;
        const radius = (node.size * 25) * (isSelected ? 1.3 : isHovered ? 1.1 : 1.0);

        // Node shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(node.screenX + 3, node.screenY + 3, radius, 0, 2 * Math.PI);
        ctx.fill();

        // Node background
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.screenX, node.screenY, radius, 0, 2 * Math.PI);
        ctx.fill();

        // Node border
        if (isSelected) {
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 3;
        } else if (isHovered) {
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
        }
        ctx.stroke();

        // Node text
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Truncate long text
        let displayText = node.text;
        if (displayText.length > 15) {
          displayText = displayText.substring(0, 12) + '...';
        }
        
        ctx.fillText(displayText, node.screenX, node.screenY);

        // Description on hover
        if (isHovered && node.description) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(node.screenX - 100, node.screenY + radius + 10, 200, 40);
          
          ctx.fillStyle = '#94a3b8';
          ctx.font = '12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(node.description, node.screenX, node.screenY + radius + 30);
        }
      });

      requestAnimationFrame(draw);
    };

    draw();
  }, [canvasNodes, edges, viewState]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Mouse event handlers
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getNodeAt = (x: number, y: number): CanvasNode | null => {
    for (const node of canvasNodes) {
      const distance = Math.sqrt(
        Math.pow(x - node.screenX, 2) + Math.pow(y - node.screenY, 2)
      );
      const radius = node.size * 25;
      if (distance <= radius) {
        return node;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const node = getNodeAt(pos.x, pos.y);
    
    lastMousePos.current = pos;
    
    if (node) {
      selectNode(node.id);
      isDragging.current = true;
      dragNode.current = node.id;
    } else {
      selectNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const node = getNodeAt(pos.x, pos.y);

    // Handle hover
    if (node && !isDragging.current) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }

    // Handle dragging
    if (isDragging.current && dragNode.current) {
      const dx = pos.x - lastMousePos.current.x;
      const dy = pos.y - lastMousePos.current.y;

      setCanvasNodes(prevNodes => 
        prevNodes.map(n => 
          n.id === dragNode.current 
            ? { ...n, screenX: n.screenX + dx, screenY: n.screenY + dy }
            : n
        )
      );
    }

    lastMousePos.current = pos;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    dragNode.current = null;
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const node = getNodeAt(pos.x, pos.y);
    
    if (node) {
      setCurrentRoot(node.id);
    } else {
      // Create new node at click position
      const canvas = canvasRef.current;
      if (canvas) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = 80;
        
        const worldX = (pos.x - centerX) / scale;
        const worldY = (pos.y - centerY) / scale;
        
        createNode('New Node', { x: worldX, y: worldY, z: 0 });
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (canvas) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = 80;
        
        // Create node at random position near center
        const worldX = (Math.random() - 0.5) * 4;
        const worldY = (Math.random() - 0.5) * 4;
        
        createNode('New Node', { x: worldX, y: worldY, z: 0 });
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-default"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    />
  );
}