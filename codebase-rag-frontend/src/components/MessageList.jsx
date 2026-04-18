import { Sparkles, User, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { useState } from "react";

export default function MessageList({ messages, isLoading, lang = "en" }) {
  const [copiedCode, setCopiedCode] = useState(null);

  const t = {
    en: {
      greeting: "How can I help you today?",
      subtext: "Ask anything about your connected documents.",
    },
    de: {
      greeting: "Wie kann ich Ihnen heute helfen?",
      subtext: "Fragen Sie alles zu Ihren verbundenen Dokumenten.",
    },
  };

  const markdownComponents = {
    code(props) {
      const { children, className } = props;
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "text";
      const codeString = String(children).replace(/\n$/, "");
      return (
        <div className="relative group my-4">
          <SyntaxHighlighter
            language={language}
            style={atomDark}
            className="rounded-lg !bg-zinc-950 !p-4 text-sm"
            wrapLines={true}
            lineProps={{ style: { wordBreak: "break-all", whiteSpace: "pre-wrap" } }}
          >
            {codeString}
          </SyntaxHighlighter>
          <button
            onClick={() => {
              navigator.clipboard.writeText(codeString);
              setCopiedCode(language);
              setTimeout(() => setCopiedCode(null), 2000);
            }}
            className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 bg-zinc-800 hover:bg-zinc-700 rounded transition-all duration-200 shadow-lg"
            title="Copy code"
          >
            {copiedCode === language ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-zinc-400 hover:text-white" />
            )}
          </button>
        </div>
      );
    },
    table(props) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="w-full border-collapse border border-zinc-300 dark:border-zinc-700">
            {props.children}
          </table>
        </div>
      );
    },
    th(props) {
      return (
        <th className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-left font-bold">
          {props.children}
        </th>
      );
    },
    td(props) {
      return (
        <td className="border border-zinc-300 dark:border-zinc-700 px-4 py-2">
          {props.children}
        </td>
      );
    },
    a(props) {
      return (
        <a
          {...props}
          className="text-violet-500 hover:text-violet-600 dark:hover:text-violet-400 underline"
          target="_blank"
          rel="noopener noreferrer"
        />
      );
    },
    h1(props) { return <h1 className="text-2xl font-bold my-4 mt-6">{props.children}</h1>; },
    h2(props) { return <h2 className="text-xl font-bold my-3 mt-5">{props.children}</h2>; },
    h3(props) { return <h3 className="text-lg font-bold my-2 mt-4">{props.children}</h3>; },
    ul(props) { return <ul className="list-disc list-inside my-3 space-y-1">{props.children}</ul>; },
    ol(props) { return <ol className="list-decimal list-inside my-3 space-y-1">{props.children}</ol>; },
    li(props) { return <li className="ml-2">{props.children}</li>; },
    blockquote(props) {
      return (
        <blockquote className="border-l-4 border-violet-500 pl-4 py-2 my-3 italic text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/30 rounded-r">
          {props.children}
        </blockquote>
      );
    },
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scroll-smooth">
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 mt-[-40px] animate-message">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-sm">
            <Sparkles className="w-8 h-8 text-violet-500 opacity-80" />
          </div>
          <p className="text-lg font-medium text-zinc-600 dark:text-zinc-300">
            {t[lang].greeting}
          </p>
          <p className="text-sm mt-2">{t[lang].subtext}</p>
        </div>
      )}

      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex gap-4 max-w-3xl mx-auto animate-message ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "assistant" && (
            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-1 border border-violet-200 dark:border-violet-800/50 shadow-sm">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
          )}

          <div
            className={`px-5 py-3.5 rounded-2xl max-w-[85%] text-[15px] leading-relaxed shadow-sm ${
              msg.role === "user"
                ? "bg-violet-600 text-white rounded-tr-sm shadow-violet-600/20"
                : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-tl-sm"
            }`}
          >
            {msg.role === "assistant" && !msg.content && isLoading && idx === messages.length - 1 ? (
              <div className="flex items-center gap-1.5 py-1">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            ) : (
              <>
                <div className="prose prose-zinc dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-a:text-violet-500 max-w-none text-[15px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        📄 Sources
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((source, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 text-xs rounded-md font-medium border border-zinc-200 dark:border-zinc-700/50 shadow-sm transition-all duration-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-default max-w-full"
                          title={source}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_4px_rgba(139,92,246,0.6)] flex-shrink-0"></div>
                          <span className="truncate">{source}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {msg.role === "user" && (
            <div className="w-8 h-8 rounded-full bg-zinc-800 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
