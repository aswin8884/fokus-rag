import { useState, useRef } from 'react';
import { Send, Paperclip, FileText, Loader2, CheckCircle2, X } from 'lucide-react';

export default function MessageInput({ onSend, isLoading, sessionId, showToast, lang }) {
  const [text, setText] = useState('');
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null); 
  const fileInputRef = useRef(null);

  // Translations for the input area
  const placeholders = {
    en: "Message Fokus RAG...",
    de: "Nachricht an Fokus RAG..."
  };
const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile({ name: file.name, status: 'uploading' });
    setFileUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

      const response = await fetch(`${API_URL}/upload?session_id=${sessionId}`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setUploadedFile({ name: file.name, status: 'success' });
        showToast(data.message, "success");
      } else {
        setUploadedFile(null);
        showToast(data.message, "error");
      }
    } catch (error) {
      setUploadedFile(null);
      showToast(lang === 'de' ? "Upload fehlgeschlagen." : "Upload failed.", "error");
    } finally {
      setFileUploading(false);
      e.target.value = null; 
    }
  };

  const handleSend = () => {
    if (!text.trim() && !uploadedFile) return;
    if (isLoading || fileUploading) return;
    
    if (text.trim()) {
      onSend(text);
      setText('');
    }
    
    if (uploadedFile?.status === 'success') {
      setUploadedFile(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 md:p-6 bg-transparent">
      <div className="max-w-3xl mx-auto">
        
        {/* 🔥 PREMIUM CHATGPT-STYLE INPUT WRAPPER */}
        <div className="relative flex flex-col bg-zinc-100 dark:bg-[#18181B] border border-zinc-300 dark:border-zinc-700/80 rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-violet-500/50 focus-within:border-violet-500/50 transition-all">
          
          {/* 🔥 FILE UPLOAD THUMBNAIL CHIP */}
          {uploadedFile && (
            <div className="px-4 pt-4 pb-1">
              <div className="relative inline-flex items-center gap-3 p-2.5 pr-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
                <div className={`p-2 rounded-lg ${uploadedFile.status === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'}`}>
                  {uploadedFile.status === 'uploading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 max-w-[150px] truncate">
                    {uploadedFile.name}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    {uploadedFile.status === 'uploading' ? (lang === 'de' ? 'Hochladen...' : 'Uploading...') : 'Document'}
                  </span>
                </div>
                
                {/* Status Icon Indicator */}
                <div className="ml-2 flex items-center justify-center">
                  {uploadedFile.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>

                {/* Remove button (Only visible if not uploading) */}
                {uploadedFile.status !== 'uploading' && (
                  <button 
                    onClick={() => setUploadedFile(null)}
                    className="absolute -top-2 -right-2 p-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors border border-white dark:border-zinc-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-end gap-2 p-2">
            {/* 🔥 PAPERCLIP UPLOAD ICON */}
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,.txt" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={fileUploading || isLoading}
              className="p-2.5 text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-xl transition-all disabled:opacity-50 mb-0.5 ml-1"
              title={lang === 'de' ? "Datei hochladen" : "Attach File"}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* TEXTAREA */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholders[lang] || placeholders.en}
              className="w-full max-h-32 min-h-[44px] py-3 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none resize-none overflow-y-auto text-[15px]"
              rows={1}
              disabled={isLoading}
            />

            {/* SEND BUTTON */}
            <button
              onClick={handleSend}
              disabled={(!text.trim() && !uploadedFile) || isLoading || fileUploading}
              className="p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all disabled:opacity-50 disabled:hover:bg-violet-600 mb-0.5 mr-1"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <div className="text-center mt-3">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-500 font-medium">
            {lang === 'de' 
              ? "KI kann Fehler machen. Überprüfen Sie wichtige Informationen." 
              : "AI can make mistakes. Verify important data."}
          </p>
        </div>
      </div>
    </div>
  );
}