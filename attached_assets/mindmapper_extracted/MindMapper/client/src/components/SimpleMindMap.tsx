import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../state/useStore';
import { oklchToCSS } from '../lib/colors';

export default function SimpleMindMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { nodes, viewState, setCurrentRoot, selectNode } = useStore();

  // Get visible nodes for current root with safe checks
  const visibleNodes = nodes.filter(node => {
    if (!node || !viewState.rootId) return false;
    if (node.id === viewState.rootId) return true;
    if (node.parentId === viewState.rootId) return true;
    
    // Include linked nodes
    const rootNode = nodes.find(n => n && n.id === viewState.rootId);
    if (rootNode?.links?.includes(node.id)) return true;
    
    // Include nodes that link to visible nodes
    return node.links?.some(linkId => 
      linkId === viewState.rootId || 
      nodes.find(n => n && n.id === linkId)?.parentId === viewState.rootId
    ) || false;
  });

  // Current root node with fallback
  const currentRoot = visibleNodes.find(n => n.id === viewState.rootId) || 
                     nodes.find(n => n && n.parentId === null) ||
                     visibleNodes[0];

  // Child nodes
  const childNodes = visibleNodes.filter(n => n.parentId === (currentRoot?.id || viewState.rootId));

  // Calculate scales based on hover/selection state
  const getNodeScale = (nodeId: string) => {
    return (hoveredNodeId === nodeId || selectedNodeId === nodeId) ? 1.25 : 1.0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate positions for nodes in a radial layout
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.3;

    // Draw edges first
    if (currentRoot) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      
      childNodes.forEach((child, index) => {
        const angle = (index / childNodes.length) * 2 * Math.PI;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      });

      // Draw user links
      childNodes.forEach((node, index) => {
        const angle = (index / childNodes.length) * 2 * Math.PI;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        node.links?.forEach(linkId => {
          const linkedNode = visibleNodes.find(n => n.id === linkId);
          if (linkedNode) {
            const linkedIndex = childNodes.findIndex(n => n.id === linkId);
            if (linkedIndex >= 0) {
              const linkedAngle = (linkedIndex / childNodes.length) * 2 * Math.PI;
              const linkedX = centerX + Math.cos(linkedAngle) * radius;
              const linkedY = centerY + Math.sin(linkedAngle) * radius;

              ctx.strokeStyle = '#10b981';
              ctx.setLineDash([5, 5]);
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(linkedX, linkedY);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        });
      });
    }

    // Draw nodes
    if (currentRoot) {
      // Draw root node with scaling
      const rootScale = getNodeScale(currentRoot.id);
      const rootColor = oklchToCSS(currentRoot.color.oklch);
      ctx.fillStyle = rootColor;
      ctx.strokeStyle = selectedNodeId === currentRoot.id ? '#fff' : 'transparent';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(centerX, centerY, 40 * rootScale, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Root label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(currentRoot.title, centerX, centerY + 5);

      // Draw child nodes with scaling
      childNodes.forEach((child, index) => {
        const angle = (index / childNodes.length) * 2 * Math.PI;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const scale = getNodeScale(child.id);

        const childColor = oklchToCSS(child.color.oklch);
        ctx.fillStyle = childColor;
        ctx.strokeStyle = selectedNodeId === child.id ? '#fff' : 'transparent';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(x, y, 30 * scale, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Child label
        ctx.fillStyle = '#fff';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(child.title, x, y + 4);
      });
    }
  }, [nodes, viewState, visibleNodes, hoveredNodeId, selectedNodeId]);

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.3;

    let foundHover = false;

    // Check root node hover
    const rootDistance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    if (rootDistance <= 40 && currentRoot) {
      setHoveredNodeId(currentRoot.id);
      foundHover = true;
    } else {
      // Check child nodes
      for (let i = 0; i < childNodes.length; i++) {
        const child = childNodes[i];
        const angle = (i / childNodes.length) * 2 * Math.PI;
        const nodeX = centerX + Math.cos(angle) * radius;
        const nodeY = centerY + Math.sin(angle) * radius;

        const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
        if (distance <= 30) {
          setHoveredNodeId(child.id);
          foundHover = true;
          break;
        }
      }
    }

    if (!foundHover) {
      setHoveredNodeId(null);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.3;

    let clickedNode: string | null = null;

    // Check root node click
    const rootDistance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    if (rootDistance <= 40 && currentRoot) {
      clickedNode = currentRoot.id;
    } else {
      // Check child nodes
      for (let i = 0; i < childNodes.length; i++) {
        const child = childNodes[i];
        const angle = (i / childNodes.length) * 2 * Math.PI;
        const nodeX = centerX + Math.cos(angle) * radius;
        const nodeY = centerY + Math.sin(angle) * radius;

        const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
        if (distance <= 30) {
          clickedNode = child.id;
          break;
        }
      }
    }

    // Toggle selection - click same node to deselect
    if (clickedNode) {
      setSelectedNodeId(selectedNodeId === clickedNode ? null : clickedNode);
      selectNode(clickedNode);
    } else {
      setSelectedNodeId(null);
      selectNode(null);
    }
  };

  const handleCanvasDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.3;

    // Check child nodes for drill-down
    const childNodes = visibleNodes.filter(n => n.parentId === viewState.rootId);
    childNodes.forEach((child, index) => {
      const angle = (index / childNodes.length) * 2 * Math.PI;
      const nodeX = centerX + Math.cos(angle) * radius;
      const nodeY = centerY + Math.sin(angle) * radius;

      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      if (distance <= 30) {
        setCurrentRoot(child.id);
      }
    });
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
      />
      
      {/* Instructions */}
      <div className="absolute bottom-4 right-4 text-white/60 text-xs animate-pulse pointer-events-none">
        Click to select • Double-click to drill down
      </div>
    </div>
  );
}