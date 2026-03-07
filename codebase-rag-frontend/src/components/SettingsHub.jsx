import { Settings, Sun, Moon, Cpu, Database, Shield } from 'lucide-react';

export default function SettingsHub({ isDarkMode, setIsDarkMode }) {
  return (
    <div className="flex-1 overflow-y-auto p-8 bg-zinc-50 dark:bg-[#0A0A0B] transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8 mt-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div>
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-violet-500" />
            System Settings
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Manage your application preferences and view engine configurations.</p>
        </div>

        <div className="space-y-6">
          {/* Appearance Section */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">Appearance</h3>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-800 dark:text-zinc-100">Theme Preference</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Toggle between light and dark mode for the workspace.</p>
              </div>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium transition-colors"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>

          {/* AI Engine Section (Read-Only to look professional) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">AI Engine Configuration</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-800 dark:text-zinc-100">Language Model</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Cohere Command-R (Strict Grounding)</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-md uppercase tracking-wide">Active</span>
              </div>

              <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800/80"></div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-800 dark:text-zinc-100">Vector Storage</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">ChromaDB + Cohere Embed English v3.0</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold rounded-md">Local</span>
              </div>

              <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800/80"></div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-800 dark:text-zinc-100">Temperature (Creativity)</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Locked to 0.0 to prevent hallucinations</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold rounded-md">Strict</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}