import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  QueryClient, 
  QueryClientProvider 
} from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  FileText, 
  Globe, 
  Settings, 
  BookOpen, 
  Trash2, 
  Plus, 
  X, 
  Layout, 
  Database,
  RefreshCcw,
  Loader2,
  Play,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  FolderOpen
} from 'lucide-react';
import { useModalStore } from '../store/useModalStore';

// Import api dari lib lokal Anda
const api_placeholder = {
  get: async (url: string) => {
    return { data: { data: [] as RAGDoc[] } };
  },
  post: async (url: string, data: any) => {
    return { data: { success: true, data: { reply: "Respon fallback...", ragSources: [] } } };
  },
  patch: async (url: string, data: any) => ({ data: {} }),
  delete: async (url: string) => ({ data: {} }),
};

// ─── Interfaces & Types ──────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
}

interface RAGDoc {
  id: string;
  title: string;
  source_type: 'pdf' | 'xlsx' | 'url' | 'youtube' | 'text' | 'docx' | 'image';
  chunk_count: number;
}

// Initialize Query Client
const queryClient = new QueryClient();

// ─── ChatBubble Component ─────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}
    >
      <div className={`flex gap-4 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 shadow-sm transition-transform group-hover:scale-105 ${
          isUser ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-600 text-white'
        }`}>
          {isUser ? <User size={20} /> : <Sparkles size={20} />}
        </div>
        
        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm border transition-all ${
            isUser 
              ? 'bg-white border-emerald-100 text-slate-700 rounded-tr-none' 
              : 'bg-white border-slate-100 text-slate-800 rounded-tl-none'
          }`}>
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>

          {msg.sources && msg.sources.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {msg.sources.map((s, i) => (
                <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-bold">
                  <BookOpen size={12} /> {s}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-semibold text-slate-400">
              {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {!isUser && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">• AsistenTani</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-4 mb-6">
      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
        <Bot size={20} />
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
              transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Chat UI Logic ───────────────────────────────────────────────────

function ChatContainer() {
  const { showAlert } = useModalStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Halo! Saya **AsistenTani** AgriHub. Saya siap membantu Anda dengan pertanyaan seputar:\n\n• Budidaya & teknik tanam\n• Pengendalian hama & penyakit\n• Harga pasar & tren komoditas\n• Fitur platform AgriHub\n\nSilakan ajukan pertanyaan!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useRag, setUseRag] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'docs'>('chat');
  const [urlInput, setUrlInput] = useState('');
  const [docTitle, setDocTitle] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const user = useMemo(() => ({ puter_token: "mock-token" }), []); 
  const isPuterConnected = !!user?.puter_token;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const { data: docsData } = useQuery({
    queryKey: ['rag-docs'],
    queryFn: () => api_placeholder.get('/rag/documents').then(r => r.data),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      showAlert(`Berhasil memilih file: ${file.name}.`);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    const historyForAPI = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/rag/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agrihub-auth') ? JSON.parse(localStorage.getItem('agrihub-auth')!).state.token : ''}`,
        },
        body: JSON.stringify({ message: userMsg.content, history: historyForAPI, use_rag: useRag }),
      });

      if (!response.ok || !response.body) throw new Error('Stream failed');

      const assistantMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', timestamp: new Date() }]);
      setIsLoading(false);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              accumulated += parsed.token;
              setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: accumulated } : m));
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Maaf, terjadi kesalahan saat menghubungi sistem AgriHub.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F0F7F4] text-slate-900 font-sans p-4 lg:p-6 gap-6 overflow-hidden w-full">
      
      {/* ─── Sidebar ─── */}
      <aside className="w-80 flex-shrink-0 flex flex-col gap-5">
        
        {/* Tab Switcher */}
        <div className="bg-white/60 backdrop-blur-sm p-1.5 rounded-2xl flex gap-1 border border-white/50 shadow-sm">
          {(['chat', 'docs'] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === tab ? 'bg-white text-emerald-700 shadow-sm border border-emerald-50' : 'text-slate-400 hover:text-emerald-600'
              }`}
            >
              {tab === 'chat' ? <Settings size={14} /> : <BookOpen size={14} />}
              {tab === 'chat' ? 'Pengaturan' : `Knowledge Base (${docsData?.data?.length || 0})`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' ? (
              <motion.div key="settings" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="h-full flex flex-col gap-4">
                <div className="bg-white border border-emerald-100/50 rounded-[2rem] p-6 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-500" /> Pengaturan AI
                  </h3>
                  
                  <div className={`p-4 rounded-2xl border transition-all mb-6 ${isPuterConnected ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${isPuterConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                      <span className="font-bold text-xs text-slate-700">Koneksi Puter AI</span>
                    </div>
                    {isPuterConnected ? (
                      <div className="flex items-start gap-2 text-emerald-700">
                        <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] font-medium">Akun Anda sudah terhubung ke Puter AI. Anda bisa menggunakan AI tanpa batas!</p>
                      </div>
                    ) : (
                      <button className="w-full mt-2 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">Hubungkan Sekarang</button>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-1">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Gunakan RAG</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Sertakan dokumen referensi</p>
                    </div>
                    <button onClick={() => setUseRag(!useRag)} className={`w-12 h-6.5 rounded-full transition-all relative ${useRag ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      <motion.div animate={{ x: useRag ? 24 : 4 }} className="absolute top-1 w-4.5 h-4.5 bg-white rounded-full shadow-lg" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-white border border-emerald-100/50 rounded-[2rem] p-6 shadow-sm overflow-hidden flex flex-col">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles size={12} /> Pertanyaan Cepat
                  </h3>
                  <div className="flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
                    {['Cara atasi hama wereng pada padi?', 'Harga cabai merah minggu ini?', 'Teknik menanam tomat organik', 'Cuaca bagus untuk panen jagung?'].map(q => (
                      <button key={q} onClick={() => setInput(q)} className="text-left text-xs text-slate-600 p-3 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-all group flex items-center justify-between font-medium">
                        <span className="truncate pr-2">{q}</span>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-emerald-500" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="docs" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="h-full flex flex-col gap-4">
                <div className="bg-white border border-emerald-100/50 rounded-[2rem] p-6 shadow-sm flex flex-col gap-4">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <BookOpen size={16} className="text-emerald-500" /> Knowledge Base
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Upload dokumen agar AI dapat menggunakannya sebagai referensi.
                  </p>
                  
                  {/* Tombol Upload sesuai gambar */}
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                  >
                    <FolderOpen size={16} /> Upload PDF / XLSX / TXT
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.xlsx,.csv,.txt,.docx" />
                  
                  <div className="space-y-3 pt-2">
                    <input 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400" 
                      placeholder="URL website atau YouTube" 
                      value={urlInput} 
                      onChange={e => setUrlInput(e.target.value)} 
                    />
                    <input 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400" 
                      placeholder="Judul dokumen" 
                      value={docTitle} 
                      onChange={e => setDocTitle(e.target.value)} 
                    />
                    <button className="w-full py-2.5 bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm">
                      <Globe size={14} className="text-blue-400" /> Tambah URL
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-white border border-emerald-100/50 rounded-[2rem] p-6 shadow-sm overflow-hidden flex flex-col">
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 opacity-60">
                    <div className="p-4 bg-slate-50 rounded-full">
                      <FolderOpen size={28} className="text-yellow-500" />
                    </div>
                    <p className="text-xs font-bold tracking-tight">Belum ada dokumen.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* ─── Main Chat Window ─── */}
      <main className="flex-1 bg-white rounded-[2.5rem] border border-emerald-50 shadow-2xl flex flex-col overflow-hidden relative">
        <header className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:rotate-6">
                <Bot size={28} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-lg tracking-tight">AsistenTani</h2>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{useRag ? 'RAG AKTIF • DOKUMEN SIAP' : 'MODE UMUM'}</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">• Didukung Puter.js AI</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href={
                (import.meta as any).env?.VITE_WA_BOT_NUMBER 
                ? `https://wa.me/${(import.meta as any).env.VITE_WA_BOT_NUMBER}?text=Halo%20Bot`
                : `https://api.whatsapp.com/send?text=Halo%20Bot`
              }
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 text-[#075E54] hover:bg-[#25D366]/20 transition-all rounded-lg text-xs font-bold"
            >
              💬 WhatsApp Bot
            </a>
            <button onClick={() => setMessages([{ id: 'welcome', role: 'assistant', content: 'Chat dibersihkan. Ada lagi yang bisa saya bantu?', timestamp: new Date() }])} className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-500 transition-all text-xs font-bold">
              <Trash2 size={16} /> <span>Bersihkan</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-b from-white to-[#F9FBF9] custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Input Footer */}
        <footer className="p-8 bg-white border-t border-slate-50">
          <div className="max-w-4xl mx-auto relative group">
            <div className={`flex items-end gap-3 p-3 border-2 rounded-[1.5rem] transition-all duration-300 ${isLoading ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 focus-within:border-emerald-500'}`}>
              <textarea
                className="flex-1 bg-transparent py-3 px-2 text-sm outline-none resize-none max-h-40 min-h-[44px] font-medium text-slate-700"
                placeholder="Tanya sesuatu tentang pertanian..."
                rows={1}
                disabled={isLoading}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <button onClick={sendMessage} disabled={!input.trim() || isLoading} className={`w-12 h-12 rounded-xl transition-all flex items-center justify-center mb-0.5 ${input.trim() && !isLoading ? 'bg-emerald-600 text-white shadow-xl hover:bg-emerald-700 active:scale-95' : 'bg-slate-100 text-slate-400'}`}>
                {isLoading ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
              </button>
            </div>
          </div>
        </footer>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatContainer />
    </QueryClientProvider>
  );
}