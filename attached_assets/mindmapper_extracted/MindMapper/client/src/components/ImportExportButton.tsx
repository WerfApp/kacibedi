import { useState } from 'react';
import { Save } from 'lucide-react';
import ImportExport from './ImportExport';

export default function ImportExportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-6 right-6 p-3 rounded-full bg-slate-200/90 dark:bg-neutral-900/80 text-slate-800 dark:text-neutral-100 backdrop-blur border border-slate-300/50 dark:border-white/10 hover:bg-slate-300/90 dark:hover:bg-neutral-800 transition-all duration-200 z-30 shadow-lg"
        title="Import/Export Mind Map"
      >
        <Save size={20} />
      </button>
      
      <ImportExport isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}