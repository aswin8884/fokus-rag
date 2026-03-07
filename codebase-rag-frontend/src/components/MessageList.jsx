import { Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // 🔥 We added this import!

export default function MessageList({ messages, isLoading, lang = 'en' }) {
  
  const t = {
    en: {
      greeting: "How can I help you today?",
      subtext: "Ask anything about your connected documents."
    },
    de: {
      greeting: "Wie kann ich Ihnen heute helfen?",
      subtext: "Fragen Sie alles zu Ihren verbundenen Dokumenten."
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scroll-smooth">
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 mt-[-40px] animate-message">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-sm">
            <Sparkles className="w-8 h-8 text-violet-500 opacity-80" />
          </div>
          <p className="text-lg font-medium text-zinc-600 dark:text-zinc-300">{t[lang].greeting}</p>
          <p className="text-sm mt-2">{t[lang].subtext}</p>
        </div>
      )}

      {messages.map((msg, idx) => (
        <div key={idx} className={`flex gap-4 max-w-3xl mx-auto animate-message ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          
          {msg.role === 'assistant' && (
            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-1 border border-violet-200 dark:border-violet-800/50 shadow-sm">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
          )}

          <div className={`px-5 py-3.5 rounded-2xl max-w-[85%] text-[15px] leading-relaxed shadow-sm ${
            msg.role === 'user' 
              ? 'bg-violet-600 text-white rounded-tr-sm shadow-violet-600/20' 
              : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-tl-sm'
          }`}>
            
            <div className="prose prose-zinc dark:prose-invert prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-a:text-violet-500 max-w-none text-[15px]">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
            
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
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 text-xs rounded-md font-medium border border-zinc-200 dark:border-zinc-700/50 shadow-sm transition-all duration-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-default"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_4px_rgba(139,92,246,0.6)]"></div>
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