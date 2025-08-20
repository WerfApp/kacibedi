import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../state/useStore";

export default function AddFAB() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showGodModeWarning, setShowGodModeWarning] = useState(false);
  const { createNode, viewState, nodes, godMode, selectedNode } = useStore();
  
  // Only center the button when completely empty (no nodes at all)
  const isEmpty = nodes.length === 0;

  const handleOpenDialog = () => {
    // Check God Mode constraints
    if (godMode && !selectedNode) {
      setShowGodModeWarning(true);
      return;
    }
    setOpen(true);
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    
    try {
      if (godMode && selectedNode) {
        // In God Mode, add as child of selected node
        await createNode(title.trim(), selectedNode.id, body.trim() || undefined);
      } else if (!godMode) {
        // In normal mode, add as child of current root
        await createNode(title.trim(), viewState.rootId, body.trim() || undefined);
      }
      setTitle("");
      setBody("");
      setOpen(false);
    } catch (error) {
      console.error('Failed to create node:', error);
    }
  };

  return (
    <>
      <motion.button
        aria-label="Add node"
        onClick={handleOpenDialog}
        animate={{
          bottom: isEmpty ? "50%" : "1.5rem",
          right: isEmpty ? "50%" : "1.5rem", 
          transform: isEmpty ? "translate(50%, 50%)" : "translate(0, 0)",
          scale: isEmpty ? 1.3 : 1
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed h-14 w-14 rounded-full shadow-lg bg-cyan-500/90 hover:bg-cyan-500 dark:bg-cyan-500/90 dark:hover:bg-cyan-500 text-white text-3xl leading-none z-20 transition-all duration-200 hover:scale-110"
      >
        +
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="w-[min(92vw,520px)] rounded-2xl bg-white dark:bg-neutral-900 text-slate-800 dark:text-neutral-100 p-5"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-3">New node</h3>
              
              <label className="block text-sm mb-1 text-slate-700 dark:text-neutral-300">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 px-3 py-2 mb-3 outline-none focus:ring-2 ring-cyan-500 border border-slate-300 dark:border-neutral-700"
                placeholder="e.g. Quantum notes"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey) {
                    handleCreate();
                  }
                }}
              />
              
              <label className="block text-sm mb-1 text-slate-700 dark:text-neutral-300">Description (optional)</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 px-3 py-2 h-28 mb-4 outline-none focus:ring-2 ring-cyan-500 resize-none border border-slate-300 dark:border-neutral-700"
                placeholder="Short summary"
              />
              
              <div className="flex gap-2 justify-end">
                <button 
                  className="px-3 py-2 rounded-md bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-100 transition-colors" 
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-50"
                  onClick={handleCreate}
                  disabled={!title.trim()}
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* God Mode Warning Dialog */}
      <AnimatePresence>
        {showGodModeWarning && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setShowGodModeWarning(false)}
          >
            <motion.div
              className="w-[min(92vw,420px)] rounded-2xl bg-white dark:bg-neutral-900 text-slate-800 dark:text-neutral-100 p-6 border border-slate-300 dark:border-neutral-700"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-3 text-amber-400">God Mode Active</h3>
              <p className="text-slate-600 dark:text-neutral-300 mb-4">
                In God Mode, new nodes are added as children of the selected node. 
                Please select a node first, or turn off God Mode to add nodes normally.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 transition-colors"
                  onClick={() => setShowGodModeWarning(false)}
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}