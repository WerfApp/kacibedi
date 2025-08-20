import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2 } from 'lucide-react';
import { useStore } from '../state/useStore';
import { oklchToCSS } from '../lib/colors';

export default function EnhancedMindMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Camera controls
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPanStart, setLastPanStart] = useState({ x: 0, y: 0 });
  const { nodes, viewState, setCurrentRoot, selectNode, openInlineEditor, deleteNode, godMode, godLayout } = useStore();

  // Reset camera when God Mode is turned off
  useEffect(() => {
    if (!godMode) {
      // Smooth transition back to center when exiting God Mode
      const startTime = Date.now();
      const duration = 600;
      const startCamera = { ...camera };
      const targetCamera = { x: 0, y: 0, zoom: 1 };
      
      const animateReset = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out
        
        setCamera({
          x: startCamera.x + (targetCamera.x - startCamera.x) * easeProgress,
          y: startCamera.y + (targetCamera.y - startCamera.y) * easeProgress,
          zoom: startCamera.zoom + (targetCamera.zoom - startCamera.zoom) * easeProgress
        });
        
        if (progress < 1) {
          requestAnimationFrame(animateReset);
        }
      };
      
      // Only animate if camera is not already centered
      if (Math.abs(camera.x) > 1 || Math.abs(camera.y) > 1 || Math.abs(camera.zoom - 1) > 0.01) {
        animateReset();
      }
    }
  }, [godMode]); // Only run when godMode changes

  // Check for empty state but don't return early (to avoid hooks issue)
  const isEmpty = nodes.length === 0 || !viewState.rootId;

  // Get visible nodes with safe fallbacks  
  const visibleNodes = isEmpty ? [] : godMode ? 
    // In God Mode, show all nodes in the subtree
    nodes.filter(node => {
      if (!node || !viewState.rootId) return false;
      // Include root and all descendants
      if (node.id === viewState.rootId) return true;
      // Check if node is a descendant of current root
      let current = node;
      while (current.parentId) {
        const parent = nodes.find(n => n.id === current.parentId);
        if (!parent) break;
        if (parent.id === viewState.rootId) return true;
        current = parent;
      }
      return false;
    }) :
    // Normal mode: only show root and immediate children
    nodes.filter(node => {
      if (!node || !viewState.rootId) return false;
      if (node.id === viewState.rootId) return true;
      if (node.parentId === viewState.rootId) return true;
      return false;
    });

  const currentRoot = isEmpty ? null : (
    visibleNodes.find(n => n.id === viewState.rootId) || 
    nodes.find(n => n && n.parentId === null) ||
    visibleNodes[0]
  );

  const childNodes = isEmpty ? [] : godMode ? 
    visibleNodes.filter(n => n.id !== viewState.rootId) : // All non-root nodes in God Mode
    visibleNodes.filter(n => n.parentId === (currentRoot?.id || viewState.rootId)); // Only immediate children in normal mode

  // Animation with CSS transforms for smooth scaling
  const getNodeStyle = (nodeId: string, baseRadius: number) => {
    const isActive = hoveredNodeId === nodeId || selectedNodeId === nodeId;
    return {
      transform: `scale(${isActive ? 1.25 : 1})`,
      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      width: baseRadius * 2,
      height: baseRadius * 2,
      borderRadius: '50%',
      position: 'absolute' as const,
      pointerEvents: 'none' as const,
    };
  };

  // Redraw canvas on state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentRoot) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply camera transformations
    ctx.save();
    ctx.translate(canvas.width / 2 + camera.x, canvas.height / 2 + camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    const centerX = 0; // Center is now at origin due to transform
    const centerY = 0;
    
    // Use different layout logic for God Mode vs normal mode
    if (godMode && godLayout) {
      // God Mode: Use computed radial layout positions
      const scale = Math.min(canvas.width, canvas.height) / 10; // Scale factor for visualization
      
      // Draw all edges first
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6;
      
      visibleNodes.forEach(node => {
        if (node.parentId) {
          const parentPos = godLayout.get(node.parentId);
          const nodePos = godLayout.get(node.id);
          if (parentPos && nodePos) {
            ctx.beginPath();
            ctx.moveTo(centerX + parentPos.x * scale, centerY + parentPos.y * scale);
            ctx.lineTo(centerX + nodePos.x * scale, centerY + nodePos.y * scale);
            ctx.stroke();
          }
        }
      });
      
      ctx.globalAlpha = 1;
      
      // Draw all nodes
      visibleNodes.forEach(node => {
        const position = godLayout.get(node.id);
        if (!position) return;
        
        const x = centerX + position.x * scale;
        const y = centerY + position.y * scale;
        const nodeRadius = node.id === viewState.rootId ? 40 : Math.max(20, 30 - position.depth * 3);
        
        const nodeColor = oklchToCSS(node.color.oklch);
        ctx.fillStyle = nodeColor;
        ctx.strokeStyle = selectedNodeId === node.id ? '#fff' : 'transparent';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Node label
        ctx.fillStyle = '#fff';
        ctx.font = node.id === viewState.rootId ? 'bold 14px Inter, sans-serif' : 
                   position.depth <= 1 ? 'bold 12px Inter, sans-serif' : '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        
        const maxWidth = nodeRadius * 1.8;
        const text = node.title.length > 12 ? node.title.substring(0, 12) + '...' : node.title;
        ctx.fillText(text, x, y + 4);
      });
      
    } else {
      // Normal mode: Original circular layout
      const radius = Math.min(canvas.width, canvas.height) * 0.3;

    // Draw connections
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

    // Draw root node
    const rootColor = oklchToCSS(currentRoot.color.oklch);
    ctx.fillStyle = rootColor;
    ctx.strokeStyle = selectedNodeId === currentRoot.id ? '#fff' : 'transparent';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Root label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(currentRoot.title, centerX, centerY + 5);

    // Draw child nodes
    childNodes.forEach((child, index) => {
      const angle = (index / childNodes.length) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const childColor = oklchToCSS(child.color.oklch);
      ctx.fillStyle = childColor;
      ctx.strokeStyle = selectedNodeId === child.id ? '#fff' : 'transparent';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(x, y, 30, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Child label
      ctx.fillStyle = '#fff';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(child.title, x, y + 4);
    });
    }
    
    // Restore canvas transformation
    ctx.restore();
  }, [visibleNodes, currentRoot, childNodes, selectedNodeId, hoveredNodeId, godMode, godLayout, viewState.rootId, camera]);

  const screenToWorld = (screenX: number, screenY: number, canvas: HTMLCanvasElement) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const worldX = (screenX - centerX - camera.x) / camera.zoom;
    const worldY = (screenY - centerY - camera.y) / camera.zoom;
    return { x: worldX, y: worldY };
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentRoot) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    
    // Handle panning - only in God Mode
    if (isDragging && godMode) {
      const deltaX = screenX - dragStart.x;
      const deltaY = screenY - dragStart.y;
      setCamera(prev => ({
        ...prev,
        x: lastPanStart.x + deltaX,
        y: lastPanStart.y + deltaY
      }));
      return;
    }

    const { x, y } = screenToWorld(screenX, screenY, canvas);
    setMousePos({ x: event.clientX, y: event.clientY });

    const centerX = 0; // World coordinates
    const centerY = 0;
    const radius = Math.min(canvas.width, canvas.height) * 0.3 / camera.zoom;

    let foundHover = false;

    if (godMode && godLayout) {
      // Check nodes in God Mode first - use same scale as rendering
      const scale = Math.min(canvas.width, canvas.height) / 10;
      for (const node of visibleNodes) {
        const position = godLayout.get(node.id);
        if (!position) continue;
        
        const nodeX = position.x * scale;
        const nodeY = position.y * scale;
        const nodeRadius = node.id === viewState.rootId ? 40 : Math.max(20, 30 - position.depth * 3);
        const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
        
        if (distance <= nodeRadius) {
          setHoveredNodeId(node.id);
          foundHover = true;
          break;
        }
      }
    } else {
      // Check root node - fixed radius (40) since zoom is locked at 1 in normal mode
      const rootDistance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (rootDistance <= 40) {
        setHoveredNodeId(currentRoot.id);
        foundHover = true;
      } else {
        // Check child nodes in normal mode - fixed radius (30) since zoom is locked at 1 in normal mode
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
    }

    if (!foundHover) {
      setHoveredNodeId(null);
    }
    
    // Update cursor based on hover state
    if (canvas) {
      if (foundHover) {
        canvas.style.cursor = 'pointer';
      } else if (godMode) {
        canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
      } else {
        canvas.style.cursor = 'default';
      }
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentRoot) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    if (event.button === 0) { // Left click
      if (hoveredNodeId) {
        setSelectedNodeId(hoveredNodeId);
        selectNode(hoveredNodeId);
        
        // Pan camera to focus on clicked node
        if (godMode && godLayout) {
          const position = godLayout.get(hoveredNodeId);
          if (position) {
            const scale = Math.min(canvas.width, canvas.height) / 10;
            const targetX = -position.x * scale;
            const targetY = -position.y * scale;
            
            // Smooth pan to target
            const startTime = Date.now();
            const duration = 800;
            const startCamera = { ...camera };
            
            const animatePan = () => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out
              
              setCamera(prev => ({
                ...prev,
                x: startCamera.x + (targetX - startCamera.x) * easeProgress,
                y: startCamera.y + (targetY - startCamera.y) * easeProgress
              }));
              
              if (progress < 1) {
                requestAnimationFrame(animatePan);
              }
            };
            
            animatePan();
          }
        }
      } else if (godMode) {
        // Only allow panning in God Mode
        setIsDragging(true);
        setDragStart({ x: screenX, y: screenY });
        setLastPanStart({ x: camera.x, y: camera.y });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    // Only allow zoom in God Mode
    if (!godMode) {
      event.preventDefault();
      return;
    }
    
    event.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Less sensitive zoom - smaller factor
    const zoomFactor = event.deltaY > 0 ? 0.95 : 1.05;
    const newZoom = Math.max(0.1, Math.min(5, camera.zoom * zoomFactor));
    
    if (newZoom !== camera.zoom) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Calculate zoom center offset
      const zoomCenterX = mouseX - centerX;
      const zoomCenterY = mouseY - centerY;
      
      setCamera(prev => ({
        x: prev.x - zoomCenterX * (newZoom / prev.zoom - 1),
        y: prev.y - zoomCenterY * (newZoom / prev.zoom - 1),
        zoom: newZoom
      }));
    }
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentRoot) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const { x, y } = screenToWorld(screenX, screenY, canvas);

    // Double-click to drill down into nodes
    if (hoveredNodeId && hoveredNodeId !== viewState.rootId) {
      // Verify the node still exists before drilling down
      const targetNode = nodes.find(n => n.id === hoveredNodeId);
      if (targetNode) {
        setCurrentRoot(hoveredNodeId);
        setSelectedNodeId(null);
        
        // Reset camera when drilling down
        setCamera({ x: 0, y: 0, zoom: 1 });
      } else {
        // Clear stale hoveredNodeId if node no longer exists
        setHoveredNodeId(null);
      }
    }
  };

  // Get selected/hovered node for description - can be any node in the system
  const activeNode = selectedNodeId ? 
    nodes.find(n => n.id === selectedNodeId) :
    hoveredNodeId ? nodes.find(n => n.id === hoveredNodeId) : null;

  // Handle empty state - return simple background when no nodes exist
  if (isEmpty) {
    return <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300" />;
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onMouseLeave={() => {
          setHoveredNodeId(null);
          setIsDragging(false);
        }}
        style={{ cursor: isDragging ? 'grabbing' : (godMode ? 'grab' : 'pointer') }}
      />
      
      {/* Description box in top left */}
      <AnimatePresence>
        {activeNode && (hoveredNodeId || selectedNodeId) && (
          <motion.div
            initial={{ opacity: 0, x: -20, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -20, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-4 left-4 z-30 max-w-sm"
          >
            <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md text-slate-800 dark:text-white p-4 rounded-xl shadow-2xl border border-slate-300/50 dark:border-white/20 pointer-events-auto">
              {/* Header with title and action buttons */}
              <div className="flex items-start justify-between mb-2">
                <div className="font-semibold text-base text-slate-800 dark:text-white flex-1 mr-2">
                  {activeNode.title}
                </div>
                {selectedNodeId && (
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => {
                        openInlineEditor(activeNode.id);
                        setSelectedNodeId(null);
                      }}
                      className="p-1.5 rounded-md bg-blue-600/80 hover:bg-blue-600 transition-colors text-white"
                      title="Edit node"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-1.5 rounded-md bg-red-600/80 hover:bg-red-600 transition-colors text-white"
                      title="Delete node"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              
              {activeNode.body && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15, delay: 0.05 }}
                  className="text-slate-700 dark:text-white/90 text-sm leading-relaxed overflow-hidden"
                >
                  {activeNode.body}
                </motion.div>
              )}
              
              <div className="text-slate-600 dark:text-white/60 text-xs mt-3 border-t border-slate-300/50 dark:border-white/20 pt-2">
                {selectedNodeId ? 'Node selected • Use buttons to edit or delete' : 'Double-click to dive deeper'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {showDeleteConfirm && selectedNodeId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-white/20 rounded-xl p-6 max-w-md mx-4"
            >
              <div className="text-slate-800 dark:text-white text-lg font-semibold mb-2">
                Delete Node
              </div>
              <div className="text-slate-700 dark:text-white/80 text-sm mb-4">
                Are you sure you want to delete "{activeNode?.title}"? This action cannot be undone and will also delete all child nodes.
              </div>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-slate-800 dark:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (selectedNodeId && activeNode) {
                      // If deleting the current root, navigate to parent first
                      if (selectedNodeId === viewState.rootId && activeNode.parentId) {
                        // Verify parent node still exists before navigating
                        const parentNode = nodes.find(n => n.id === activeNode.parentId);
                        if (parentNode) {
                          await setCurrentRoot(activeNode.parentId);
                        }
                      }
                      await deleteNode(selectedNodeId);
                      setSelectedNodeId(null);
                      setShowDeleteConfirm(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive hints */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-slate-500 dark:text-white/60 text-xs pointer-events-none text-center"
      >
        <div className="animate-pulse">Click to select • Double-click to dive deeper • Hover for descriptions</div>
      </motion.div>
    </div>
  );
}