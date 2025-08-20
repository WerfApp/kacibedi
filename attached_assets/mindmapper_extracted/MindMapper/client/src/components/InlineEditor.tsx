import { useState, useEffect, useRef } from 'react';
import { useStore } from '../state/useStore';

export default function InlineEditor() {
  const {
    inlineEditorOpen,
    editingNodeId,
    nodes,
    closeInlineEditor,
    updateNode
  } = useStore();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const editingNode = editingNodeId ? nodes.find(n => n.id === editingNodeId) : null;

  useEffect(() => {
    if (inlineEditorOpen && editingNode) {
      setTitle(editingNode.title);
      setBody(editingNode.body || '');
      setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  }, [inlineEditorOpen, editingNode]);

  const handleSave = async () => {
    if (editingNodeId && title.trim()) {
      await updateNode(editingNodeId, { 
        title: title.trim(),
        body: body.trim() || undefined
      });
      closeInlineEditor();
    }
  };

  const handleCancel = () => {
    closeInlineEditor();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  };

  const handleTextareaKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  };

  if (!inlineEditorOpen || !editingNode) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-transparent z-40"
        onClick={handleCancel}
      />
      
      {/* Editor positioned in center */}
      <div 
        className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
      >
        <div className="bg-neutral-900 border border-white/20 rounded-xl shadow-2xl p-6 min-w-[400px] backdrop-blur-md">
          <div className="space-y-4">
            <div className="text-white text-lg font-semibold mb-4">
              Edit Node
            </div>
            
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                Title
              </label>
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-neutral-800 text-white text-sm placeholder-white/50"
                placeholder="Enter node title..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                Description (optional)
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                className="w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-neutral-800 text-white text-sm resize-none placeholder-white/50"
                placeholder="Enter description... (Ctrl+Enter to save)"
                rows={3}
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
