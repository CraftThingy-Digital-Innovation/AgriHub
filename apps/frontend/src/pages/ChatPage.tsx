import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  timestamp: Date;
}

interface RAGDoc {
  id: string;
  title: string;
  source_type: string;
  chunk_count: number;
  is_global: number;
  content_preview: string;
  created_at: string;
}

// ─── Source type icon ─────────────────────────────────────────────────────

const SOURCE_ICONS: Record<string, string> = {
  pdf: '📄', xlsx: '📊', url: '🌐', youtube: '▶️', text: '📝', docx: '📝',
};

// ─── ChatBubble Component ─────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-white text-sm flex-shrink-0 mt-1">🌱</div>
      )}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-gradient-to-br from-green-600 to-green-500 text-white rounded-br-sm'
            : 'bg-white border border-green-100 text-green-900 rounded-bl-sm'
        }`}>
          {msg.content}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {msg.sources.map(s => (
              <span key={s} className="badge badge-green text-[10px]">📚 {s}</span>
            ))}
          </div>
        )}
        <span className="text-[10px] text-green-400">
          {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm flex-shrink-0 mt-1">👤</div>
      )}
    </motion.div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-white text-sm">🌱</div>
      <div className="bg-white border border-green-100 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-green-400"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ChatPage ─────────────────────────────────────────────────────────

export default function ChatPage() {
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '🌱 Halo! Saya **AsistenTani** AgriHub. Saya siap membantu Anda dengan pertanyaan seputar:\n\n• Budidaya & teknik tanam\n• Pengendalian hama & penyakit\n• Harga pasar & tren komoditas\n• Fitur platform AgriHub\n\nSilakan ajukan pertanyaan!',
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
  
  const user = useAuthStore(s => s.user);
  const updateUser = useAuthStore(s => s.updateUser);
  const [isConnecting, setIsConnecting] = useState(false);
  const isPuterConnected = !!user?.puter_token;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Fetch user documents
  const { data: docsData } = useQuery({
    queryKey: ['rag-docs'],
    queryFn: () => api.get('/rag/documents').then(r => r.data),
  });

  // Upload file
  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/rag/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rag-docs'] }); },
  });

  // Add URL
  const addUrlMutation = useMutation({
    mutationFn: (data: { url: string; title: string }) => api.post('/rag/add-url', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rag-docs'] }); setUrlInput(''); setDocTitle(''); },
  });

  // Delete doc
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/rag/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rag-docs'] }),
  });

  // Hubungkan ke Puter API
  async function connectPuter() {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      // @ts-ignore
      const puter = window.puter;
      if (!puter) { alert('Puter.js belum dimuat. Coba refresh halaman.'); setIsConnecting(false); return; }

      // Check if already signed in to avoid popup
      const alreadySignedIn = await puter.auth.isSignedIn();
      if (!alreadySignedIn) {
          try {
              await puter.auth.signIn();
          } catch (signInErr: any) {
              if (signInErr?.error === 'auth_window_closed') {
                  console.warn('Puter Auth: User closed the window.');
                  setIsConnecting(false);
                  return;
              }
              throw signInErr;
          }
      }

      const token = puter.auth.getToken();
      if (token) {
        await api.patch('/auth/puter-token', { token });
        updateUser({ puter_token: token as string });
      } else {
        throw new Error('Gagal mendapatkan token dari Puter');
      }
    } catch (err) {
      console.error('Failed to connect Puter:', err);
      alert('Gagal menghubungkan ke Puter AI. Pastikan pop-up diizinkan.');
    } finally {
      setIsConnecting(false);
    }
  }

  // Send message with SSE streaming
  async function sendMessage() {
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
      // Try SSE streaming
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
      let sources: string[] = [];

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
            if (parsed.sources) sources = parsed.sources;
            if (parsed.error) throw new Error(parsed.error);
          } catch {}
        }
      }
      if (sources.length > 0) {
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, sources } : m));
      }
    } catch {
      // Fallback ke non-streaming
      try {
        const { data } = await api.post('/rag/chat', { message: userMsg.content, history: historyForAPI, use_rag: useRag });
        if (data.success) {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.data.reply,
            sources: data.data.ragSources,
            timestamp: new Date(),
          }]);
        }
      } catch {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '❌ Gagal menghubungi AI. Pastikan server berjalan dan Anda sudah menghubungkan akun Puter AI Anda di tab Pengaturan.',
          timestamp: new Date(),
        }]);
      } finally {
        setIsLoading(false);
      }
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.[^.]+$/, ''));
    uploadMutation.mutate(formData);
  }

  const docs: RAGDoc[] = docsData?.data ?? [];

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4 max-w-6xl mx-auto">
      {/* Sidebar — Tabs */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        {/* Tab Toggle */}
        <div className="flex bg-green-50 rounded-xl p-1">
          {(['chat', 'docs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === tab ? 'bg-white text-green-800 shadow-sm' : 'text-green-600'}`}
            >
              {tab === 'chat' ? '⚙️ Pengaturan' : `📚 Knowledge Base (${docs.length})`}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'chat' ? (
            <motion.div key="chat-settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card flex-1 p-4 flex flex-col gap-4">
              <h3 className="font-bold text-green-900 text-sm">⚙️ Pengaturan AI</h3>
              
              {/* Puter AI Connection Status */}
              <div className="bg-green-50 rounded-xl p-3 border border-green-100 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${isPuterConnected ? 'bg-green-500' : 'bg-red-400'}`}></div>
                  <div className="font-bold text-sm text-green-900">Koneksi Puter AI</div>
                </div>
                {isPuterConnected ? (
                  <p className="text-xs text-green-700 mb-2">✅ Akun Anda sudah terhubung ke Puter AI. Anda bisa menggunakan AI tanpa batas!</p>
                ) : (
                  <>
                    <p className="text-xs text-green-600 mb-3">⚠️ Anda belum menghubungkan akun Puter. AI tidak akan merespon pertanyaan Anda.</p>
                    <button 
                        onClick={connectPuter} 
                        disabled={isConnecting}
                        className="btn-primary py-1.5 px-3 text-xs w-full justify-center disabled:opacity-50"
                    >
                        {isConnecting ? '⏳ Menghubungkan...' : '🔗 Hubungkan Puter sekarang'}
                    </button>
                  </>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setUseRag(!useRag)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${useRag ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${useRag ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-green-900">Gunakan RAG</div>
                  <div className="text-xs text-green-600">Sertakan knowledge dari dokumen Anda</div>
                </div>
              </label>

              <div className="border-t border-green-100 pt-3">
                <div className="text-xs font-semibold text-green-700 mb-2">💡 Pertanyaan Cepat</div>
                {[
                  'Cara atasi hama wereng pada padi?',
                  'Harga cabai merah minggu ini?',
                  'Teknik menanam tomat organik',
                  'Cuaca bagus untuk panen jagung?',
                ].map(q => (
                  <button key={q} onClick={() => setInput(q)} className="block w-full text-left text-xs text-green-700 py-1.5 px-2 rounded-lg hover:bg-green-50 transition-colors border-b border-green-50 last:border-0">
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="docs-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card flex-1 p-4 flex flex-col gap-3 overflow-hidden">
              <h3 className="font-bold text-green-900 text-sm">📚 Knowledge Base</h3>
              <p className="text-xs text-green-600">Upload dokumen agar AI dapat menggunakannya sebagai referensi.</p>

              {/* Upload file */}
              <button onClick={() => fileInputRef.current?.click()} className="btn-primary text-xs py-2 justify-center">
                {uploadMutation.isPending ? '⏳ Mengunggah...' : '📁 Upload PDF / XLSX / TXT'}
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf,.xlsx,.xls,.csv,.txt,.md" className="hidden" onChange={handleFileUpload} />

              {/* URL input */}
              <div className="space-y-2">
                <input className="input-field text-xs" placeholder="URL website atau YouTube" value={urlInput} onChange={e => setUrlInput(e.target.value)} />
                <input className="input-field text-xs" placeholder="Judul dokumen" value={docTitle} onChange={e => setDocTitle(e.target.value)} />
                <button
                  className="btn-secondary text-xs py-2 w-full justify-center"
                  disabled={!urlInput || addUrlMutation.isPending}
                  onClick={() => addUrlMutation.mutate({ url: urlInput, title: docTitle || urlInput })}
                >
                  {addUrlMutation.isPending ? '⏳...' : '🌐 Tambah URL'}
                </button>
              </div>

              {/* Doc list */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {docs.length === 0 ? (
                  <div className="text-center text-xs text-green-500 py-6">
                    <div className="text-2xl mb-2">📂</div>
                    <p>Belum ada dokumen.</p>
                  </div>
                ) : docs.map((doc: RAGDoc) => (
                  <div key={doc.id} className="flex items-start gap-2 p-2 rounded-lg bg-green-50 group">
                    <span className="text-base">{SOURCE_ICONS[doc.source_type] || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-green-900 truncate">{doc.title}</div>
                      <div className="text-[10px] text-green-500">{doc.chunk_count} chunk{Number(doc.is_global) === 1 ? ' · Global' : ''}</div>
                    </div>
                    <button onClick={() => deleteMutation.mutate(doc.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs transition-opacity">✕</button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col card overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-green-100">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-white text-lg">🌱</div>
          <div>
            <div className="font-bold text-green-900 text-sm">AsistenTani</div>
            <div className="text-[10px] text-green-500">
              {useRag ? `📚 RAG aktif · ${docs.length} dokumen` : '💬 Mode umum'} · Didukung Puter.js AI
            </div>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setMessages([{ id: 'welcome', role: 'assistant', content: '🌱 Chat baru dimulai! Ada yang ingin Anda tanyakan?', timestamp: new Date() }])}
              className="text-xs text-green-500 hover:text-green-700 transition-colors"
            >
              🗑️ Bersihkan
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8faf9]">
          {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-green-100 p-4 bg-white">
          <div className="flex gap-2">
            <textarea
              className="input-field flex-1 resize-none text-sm"
              rows={5}
              placeholder="Tanya sesuatu tentang pertanian, harga, atau cara pakai AgriHub..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="btn-primary px-5 self-stretch disabled:opacity-50 flex-shrink-0"
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </div>
          <div className="text-[10px] text-green-400 mt-1">Enter untuk kirim · Shift+Enter untuk baris baru</div>
        </div>
      </div>
    </div>
  );
}
