import { useState } from 'react';
import { Download, Upload, X, FileText, Calendar } from 'lucide-react';
import { useStore } from '../state/useStore';
import { MindMapExport } from '../types';

interface ImportExportProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportExport({ isOpen, onClose }: ImportExportProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportName, setExportName] = useState('');
  const [exportDescription, setExportDescription] = useState('');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const { nodes, viewState, exportMindMap, importMindMap, clearAndImport } = useStore();
  
  const currentRootNode = nodes.find(n => n.id === viewState.rootId);
  const defaultName = currentRootNode?.title || 'My Mind Map';

  const handleExport = async () => {
    if (!exportName.trim()) return;
    
    setExporting(true);
    try {
      await exportMindMap(exportName.trim(), exportDescription.trim() || undefined);
      onClose();
      setExportName('');
      setExportDescription('');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export mind map. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data: MindMapExport = JSON.parse(text);
      
      // Validate the imported data
      if (!data.nodes || !Array.isArray(data.nodes) || !data.rootId) {
        throw new Error('Invalid mind map file format');
      }

      // Ask user if they want to replace current map or merge
      const shouldReplace = confirm(
        `Import "${data.name}"?\n\nThis will replace your current mind map. This action cannot be undone.`
      );
      
      if (shouldReplace) {
        await clearAndImport(data);
        onClose();
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import mind map. Please check the file format and try again.');
    } finally {
      setImporting(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-md w-full border border-neutral-200 dark:border-neutral-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Mind Map Files
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Download size={16} className="inline mr-2" />
            Export
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Upload size={16} className="inline mr-2" />
            Import
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Map Name *
                </label>
                <input
                  type="text"
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  placeholder={defaultName}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={exportDescription}
                  onChange={(e) => setExportDescription(e.target.value)}
                  placeholder="Add a description for this mind map..."
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 text-sm text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} />
                  <span className="font-medium">Export Info</span>
                </div>
                <div>• {nodes.length} nodes will be exported</div>
                <div>• Current root: {currentRootNode?.title || 'Unknown'}</div>
                <div>• Format: JSON file (.json)</div>
              </div>

              <button
                onClick={handleExport}
                disabled={!exportName.trim() || exporting}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Export Mind Map
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Select Mind Map File
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    disabled={importing}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:font-medium hover:file:bg-blue-700 file:cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">!</div>
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <div className="font-medium mb-1">Import Warning</div>
                    <div>Importing will replace your current mind map. Make sure to export your current work first if you want to keep it.</div>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 text-sm text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} />
                  <span className="font-medium">Supported Format</span>
                </div>
                <div>• JSON files exported from Lattice</div>
                <div>• Files must contain valid node data</div>
                <div>• All node relationships will be preserved</div>
              </div>

              {importing && (
                <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Importing mind map...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}