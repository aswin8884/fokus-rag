import { FileText, Database, Trash2, AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export default function DocumentHub({ onReset }) {
  // State to control our custom modal
  const [showModal, setShowModal] = useState(false);

  const handleConfirmWipe = () => {
    setShowModal(false);
    onReset(); // Call the actual reset function
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-zinc-50 dark:bg-[#0A0A0B] transition-colors duration-300 relative">
      <div className="max-w-4xl mx-auto space-y-8 mt-20">
        
        <div>
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Document Hub</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Manage your uploaded PDFs and vector database.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Card */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">Vector Database</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Online & Ready</p>
              </div>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Your RAG engine is currently storing document embeddings. You can chat with any uploaded documents in the Chat Workspace.
            </p>
          </div>

          {/* Danger Zone Card */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">Danger Zone</h3>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Clear Memory</p>
              </div>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Delete all uploaded PDFs and wipe the AI's vector memory completely to start fresh.
            </p>
            {/* Open Modal instead of window.confirm */}
            <button 
              onClick={() => setShowModal(true)}
              className="w-full py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg font-medium transition-colors border border-red-200 dark:border-red-800/50"
            >
              Wipe Database
            </button>
          </div>
        </div>
      </div>

      {/* PREMIUM CUSTOM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Delete Vector Database?</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">
              This action cannot be undone. This will permanently delete all uploaded PDFs and wipe the AI's memory.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmWipe}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-red-500/20"
              >
                Yes, Wipe It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}