import { Sparkles, User } from 'lucide-react';

export default function MessageList({ messages, isLoading }) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scroll-smooth">
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 mt-[-40px]">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-sm">
            <Sparkles className="w-8 h-8 text-violet-500 opacity-80" />
          </div>
          <p className="text-lg font-medium text-zinc-600 dark:text-zinc-300">How can I help you today?</p>
          <p className="text-sm mt-2">Ask anything about your connected documents.</p>
        </div>
      )}

      {messages.map((msg, idx) => (
        <div key={idx} className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          
          {msg.role === 'assistant' && (
            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-1 border border-violet-200 dark:border-violet-800/50">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
          )}

          <div className={`px-5 py-3.5 rounded-2xl max-w-[85%] text-[15px] leading-relaxed shadow-sm ${
            msg.role === 'user' 
              ? 'bg-violet-600 text-white rounded-tr-sm shadow-violet-600/20' 
              : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-tl-sm'
          }`}>
            <p>{msg.content}</p>
            
            {msg.sources && msg.sources.length > 0 && (
  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
        Sources
      </span>
    </div>
    <div className="flex flex-wrap gap-2">
      {msg.sources.map((source, i) => (
        <div 
          key={i} 
          className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 text-xs rounded-md font-medium border border-zinc-200 dark:border-zinc-700/50 shadow-sm"
        >
          {/* Optional: Add a small file icon for premium feel */}
          <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
          {source}
        </div>
      ))}
    </div>
  </div>
)}
          </div>

          {msg.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-zinc-800 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}