import { useState, useEffect, useRef } from "react";
import { Sun, Moon, CheckCircle2, AlertCircle, Globe } from "lucide-react";
import { Show, SignIn, UserButton } from "@clerk/react";
import Sidebar from "./components/Sidebar";
import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import DocumentHub from "./components/DocumentHub";
import SettingsHub from "./components/SettingsHub";

const generateSessionId = () =>
  "chat_" + Math.random().toString(36).substring(2, 10);

const translations = {
  en: {
    missionControl: "Mission Control",
    newChatStarted: "New private session started.",
    chatDeleted: "Chat deleted.",
    chatRenamed: "Chat renamed.",
    allWiped: "All chat history wiped completely.",
    exportFail: "No messages to export yet.",
    exportSuccess: "Chat exported successfully.",
    networkErr: "Network error. Is the backend running?",
    connFail: "Failed to connect to the backend server.",
  },
  de: {
    missionControl: "Kontrollzentrum",
    newChatStarted: "Neue private Sitzung gestartet.",
    chatDeleted: "Chat gelöscht.",
    chatRenamed: "Chat umbenannt.",
    allWiped: "Gesamter Chat-Verlauf vollständig gelöscht.",
    exportFail: "Noch keine Nachrichten zum Exportieren.",
    exportSuccess: "Chat erfolgreich exportiert.",
    networkErr: "Netzwerkfehler. Läuft das Backend?",
    connFail: "Verbindung zum Backend-Server fehlgeschlagen.",
  },
};

function App() {
  const [sessionId, setSessionId] = useState(
    () => localStorage.getItem("rag_session_id") || generateSessionId(),
  );
  const [lang, setLang] = useState(
    () => localStorage.getItem("rag_lang") || "en",
  );
  const t = translations[lang];

  const [chatSessions, setChatSessions] = useState(() => {
    const savedSessions = localStorage.getItem("rag_sessions_list");
    return savedSessions ? JSON.parse(savedSessions) : [];
  });

  const [messages, setMessages] = useState(() => {
    const savedChat = localStorage.getItem(`rag_chat_${sessionId}`);
    return savedChat ? JSON.parse(savedChat) : [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("rag_lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("rag_session_id", sessionId);
    localStorage.setItem(`rag_chat_${sessionId}`, JSON.stringify(messages));

    if (messages.length > 0) {
      setChatSessions((prev) => {
        const exists = prev.find((s) => s.id === sessionId);
        if (!exists) {
          return [
            {
              id: sessionId,
              title: messages[0].content.substring(0, 25) + "...",
            },
            ...prev,
          ];
        } else if (
          exists.title === "New Chat" ||
          exists.title === "Neuer Chat"
        ) {
          return prev.map((s) =>
            s.id === sessionId
              ? { ...s, title: messages[0].content.substring(0, 25) + "..." }
              : s,
          );
        }
        return prev;
      });
    }
  }, [messages, sessionId]);

  useEffect(() => {
    localStorage.setItem("rag_sessions_list", JSON.stringify(chatSessions));
  }, [chatSessions]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(
      () => setToast((prev) => ({ ...prev, show: false })),
      3500,
    );
  };

  const handleNewChat = () => {
    const newId = generateSessionId();
    setSessionId(newId);
    setMessages([]);
    setActiveTab("chat");
    showToast(t.newChatStarted, "info");
  };

  const handleSwitchChat = (id) => {
    setSessionId(id);
    const savedChat = localStorage.getItem(`rag_chat_${id}`);
    setMessages(savedChat ? JSON.parse(savedChat) : []);
    setActiveTab("chat");
  };

  const handleDeleteChat = (e, idToDelete) => {
    e.stopPropagation();
    setChatSessions((prev) =>
      prev.filter((session) => session.id !== idToDelete),
    );
    localStorage.removeItem(`rag_chat_${idToDelete}`);

    if (sessionId === idToDelete) {
      setSessionId(generateSessionId());
      setMessages([]);
      setActiveTab("chat");
    } else {
      showToast(t.chatDeleted, "info");
    }
  };

  const handleRenameChat = (id, newTitle) => {
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === id ? { ...session, title: newTitle } : session,
      ),
    );
    showToast(t.chatRenamed, "success");
  };

  const handleClearAllChats = () => {
    chatSessions.forEach((session) =>
      localStorage.removeItem(`rag_chat_${session.id}`),
    );
    localStorage.removeItem("rag_sessions_list");
    setChatSessions([]);
    setSessionId(generateSessionId());
    setMessages([]);
    setActiveTab("chat");
    showToast(t.allWiped, "success");
  };

  const handleExportChat = () => {
    if (messages.length === 0) {
      showToast(t.exportFail, "error");
      return;
    }
    const currentSession = chatSessions.find((s) => s.id === sessionId);
    const chatText = messages
      .map((m) => `${m.role === "user" ? "You" : "AI"}: ${m.content}`)
      .join("\n\n");
    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentSession?.title || "Export"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t.exportSuccess, "success");
  };

  const handleSendMessage = async (text) => {
    const userMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const API_URL = "http://127.0.0.1:8000";
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          session_id: sessionId,
          lang: lang,
        }),
      });

      if (!response.ok) throw new Error("Network error");
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t.connFail },
      ]);
      showToast(t.networkErr, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Show when="signed-out">
        <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-[#0A0A0B]">
          <SignIn routing="hash" />
        </div>
      </Show>

      <Show when="signed-in">
        <div className="flex h-screen w-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-50 to-white dark:from-[#18181b] dark:to-[#0A0A0B] font-sans overflow-hidden transition-colors duration-500 relative selection:bg-violet-500/30">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            sessionId={sessionId}
            onNewChat={handleNewChat}
            chatSessions={chatSessions}
            onSwitchChat={handleSwitchChat}
            onDeleteChat={handleDeleteChat}
            onRenameChat={handleRenameChat}
            onClearAllChats={handleClearAllChats}
            onExportChat={handleExportChat}
            lang={lang}
          />

          <main className="flex-1 flex flex-col h-full relative border-l border-zinc-200 dark:border-zinc-800/60 bg-transparent">
            <header className="px-6 py-4 bg-white/60 dark:bg-[#0A0A0B]/60 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 flex justify-between items-center z-20 absolute top-0 w-full transition-colors duration-500">
              <div>
                <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
                  {t.missionControl}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">
                    {lang === "de"
                      ? "Sichere Verbindung Aktiv"
                      : "Secure Connection Active"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setLang((l) => (l === "en" ? "de" : "en"))}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm text-xs font-bold"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {lang === "en" ? "EN" : "DE"}
                </button>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm"
                >
                  {isDarkMode ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
                <div className="pl-2 border-l border-zinc-200 dark:border-zinc-800">
                  <UserButton
                    appearance={{
                      elements: { userButtonAvatarBox: "w-8 h-8 rounded-lg" },
                    }}
                  />
                </div>
              </div>
            </header>

            {activeTab === "chat" && (
              <div className="flex-1 overflow-hidden pt-20 flex flex-col h-full">
                <MessageList
                  messages={messages}
                  isLoading={isLoading}
                  lang={lang}
                />

                <div className="mt-auto">
                  <MessageInput
                    onSend={handleSendMessage}
                    isLoading={isLoading}
                    sessionId={sessionId}
                    showToast={showToast}
                    lang={lang}
                  />
                  <div className="text-[11px] text-center text-zinc-500 dark:text-zinc-500 pb-4 pt-1 px-4">
                    {lang === "de"
                      ? "Hinweis: Beim ersten Upload kann es 30-60 Sekunden dauern, bis der kostenlose Cloud-Server hochgefahren ist."
                      : "Note: The first upload may take 30-60 seconds while the free cloud server wakes up."}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "docs" && (
              <div className="flex-1 overflow-hidden pt-20 h-full flex">
                <DocumentHub onReset={handleNewChat} />
              </div>
            )}
            {activeTab === "settings" && (
              <div className="flex-1 overflow-hidden pt-20 h-full flex">
                <SettingsHub
                  isDarkMode={isDarkMode}
                  setIsDarkMode={setIsDarkMode}
                />
              </div>
            )}
          </main>

          <div
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-400 ease-out ${toast.show ? "translate-y-0 opacity-100 scale-100" : "-translate-y-4 opacity-0 scale-95 pointer-events-none"}`}
          >
            <div
              className={`flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl border min-w-[300px] justify-center ${
                toast.type === "error"
                  ? "bg-red-500 text-white border-red-600"
                  : "bg-emerald-500 text-white border-emerald-600"
              }`}
            >
              {toast.type === "error" ? (
                <AlertCircle className="w-5 h-5 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              )}
              <span className="font-bold text-sm tracking-wide">
                {toast.message}
              </span>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}

export default App;
