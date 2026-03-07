import { Database, FolderHeart, Settings, PlusCircle, MessageSquare, Trash2, Edit2, Download, AlertOctagon } from 'lucide-react';
import { useState } from 'react';

// 🔥 Sidebar Translations
const dict = {
  en: {
    newChat: "New Private Chat",
    export: "Export Chat",
    docHub: "Document Hub",
    recent: "Recent Chats",
    clear: "Clear All",
    settings: "Settings"
  },
  de: {
    newChat: "Neuer Privater Chat",
    export: "Chat Exportieren",
    docHub: "Dokumenten-Hub",
    recent: "Letzte Chats",
    clear: "Alle löschen",
    settings: "Einstellungen"
  }
};

export default function Sidebar({ 
  activeTab, setActiveTab, sessionId, onNewChat, 
  chatSessions, onSwitchChat, onDeleteChat, onRenameChat, 
  onClearAllChats, onExportChat, lang 
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const t = dict[lang]; // Load language

  const startEditing = (e, id, currentTitle) => {
    e.stopPropagation(); setEditingId(id); setEditTitle(currentTitle);
  };

  const saveRename = (e, id) => {
    e.stopPropagation();
    if (editTitle.trim()) onRenameChat(id, editTitle.trim());
    setEditingId(null);
  };

  return (
    <div className="w-64 bg-zinc-50 dark:bg-[#09090B] flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800/60">
      
      {/* BRANDING */}
      <div className="p-5 pb-2">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5 tracking-tight">
          <div className="p-1.5 bg-violet-600 rounded-lg shadow-sm">
            <Database className="w-5 h-5 text-white" />
          </div>
          Fokus RAG
        </h1>
      </div>
      
      {/* PRIMARY ACTIONS: New Chat Button */}
      <div className="px-3 mt-4 space-y-1.5">
        <button 
          onClick={onNewChat} 
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all shadow-md shadow-violet-500/20 font-semibold text-sm"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          {t.newChat}
        </button>
      </div>

      {/* SECONDARY TOOLS */}
      <nav className="px-3 space-y-0.5 mt-4">
        <button onClick={onExportChat} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100">
          <Download className="w-4 h-4 shrink-0" />
          <span className="font-medium text-sm">{t.export}</span>
        </button>

        <button onClick={() => setActiveTab('docs')} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${activeTab === 'docs' ? 'bg-zinc-200/60 dark:bg-zinc-800/60 text-violet-600 dark:text-violet-400 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium'}`}>
          <FolderHeart className="w-4 h-4 shrink-0" />
          <span className="text-sm">{t.docHub}</span>
        </button>
      </nav>

      <div className="px-4 my-4"><div className="w-full h-px bg-zinc-200 dark:bg-zinc-800/60"></div></div>

      {/* HISTORY LIST */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t.recent}</h3>
          {chatSessions.length > 0 && (
            <button onClick={onClearAllChats} className="text-[11px] font-medium text-red-500/80 hover:text-red-500 transition-colors flex items-center gap-1">
              {t.clear}
            </button>
          )}
        </div>

        <div className="space-y-0.5">
          {chatSessions.map((session) => (
            <div key={session.id} className="group relative flex items-center">
              {editingId === session.id ? (
                <input
                  type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveRename(e, session.id)} onBlur={(e) => saveRename(e, session.id)}
                  autoFocus className="flex-1 px-3 py-1.5 mx-1 bg-white dark:bg-zinc-900 border border-violet-400 rounded-md text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              ) : (
                <button
                  onClick={() => onSwitchChat(session.id)}
                  className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left truncate text-sm pr-14 ${
                    sessionId === session.id && activeTab === 'chat'
                      ? 'bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 font-medium'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 opacity-70 shrink-0" />
                  <span className="truncate">{session.title}</span>
                </button>
              )}

              {editingId !== session.id && (
                <div className="absolute right-1 opacity-0 group-hover:opacity-100 flex items-center">
                  <button onClick={(e) => startEditing(e, session.id, session.title)} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={(e) => onDeleteChat(e, session.id)} className="p-1.5 text-zinc-400 hover:text-red-500 rounded-md transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-3 mt-auto border-t border-zinc-200 dark:border-zinc-800/60">
        <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium'}`}>
          <Settings className="w-4 h-4 shrink-0" />
          <span className="text-sm">{t.settings}</span>
        </button>
      </div>
    </div>
  );
}