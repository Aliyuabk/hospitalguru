'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellOff, MessageCircle, Send, Volume2, VolumeX } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { PageHeading } from '@/components/shell';

type Contact = { id: number; name: string; email: string; role: string; department: string | null; last_message: string | null; last_message_at: string | null; unread_count: number };
type ChatMessage = { id: number; sender_id: number; recipient_id: number; body: string; read_at: string | null; created_at: string; sender: { id: number; name: string } };
const roleLabels: Record<string, string> = { hod: 'HOD Super Admin', store_keeper: 'Central Store Keeper', pharmacy_staff: 'Pharmacy Staff', md: 'MD Management', doctor: 'Doctor' };

export default function ChatPage() {
  const [meId, setMeId] = useState(0);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const initialLoadRef = useRef(true);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<Contact | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    try { setMeId(Number(JSON.parse(localStorage.getItem('bkd_user') || '{}').id || 0)); } catch { setMeId(0); }
    setSoundEnabled(localStorage.getItem('bkd_chat_sound') === 'on');
  }, []);

  const playBeep = useCallback((kind: 'sent' | 'received') => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext;
      const context = audioRef.current || new AudioContextClass();
      audioRef.current = context;
      if (context.state === 'suspended') void context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = kind === 'sent' ? 660 : 880;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.17);
    } catch { /* Sound is optional when the browser/device blocks audio. */ }
  }, [soundEnabled]);

  const loadContacts = useCallback(async () => {
    try {
      const rows = await apiFetch<Contact[]>('/chat/contacts');
      setContacts(rows);
      setSelected(current => {
        if (!current) return rows[0] || null;
        return rows.find(contact => contact.id === current.id) || rows[0] || null;
      });
      setError('');
    } catch (e: any) { setError(e.message); }
    finally { setLoadingContacts(false); }
  }, []);

  useEffect(() => { void loadContacts(); const timer = window.setInterval(loadContacts, 10000); return () => window.clearInterval(timer); }, [loadContacts]);

  useEffect(() => {
    selectedRef.current = selected; messagesRef.current = []; setMessages([]); initialLoadRef.current = true;
    if (!selected) return;
    let active = true;
    const load = async () => {
      try {
        const rows = await apiFetch<ChatMessage[]>(`/chat/${selected.id}/messages`);
        if (!active) return;
        const previous = messagesRef.current;
        if (!initialLoadRef.current && rows.some(message => message.sender_id !== meId && !previous.some(old => old.id === message.id))) playBeep('received');
        initialLoadRef.current = false; messagesRef.current = rows; setMessages(rows); setError('');
      } catch (e: any) { if (active) setError(e.message); }
      finally { if (active) setLoadingMessages(false); }
    };
    setLoadingMessages(true); void load();
    const timer = window.setInterval(load, 2500);
    return () => { active = false; window.clearInterval(timer); };
  }, [selected?.id, meId, playBeep]);

  useEffect(() => { messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim(); if (!body || !selected || sending) return;
    setSending(true); setError('');
    try {
      const sent = await apiFetch<ChatMessage>(`/chat/${selected.id}/messages`, { method: 'POST', body: JSON.stringify({ body }) });
      const next = [...messagesRef.current, sent]; messagesRef.current = next; setMessages(next); setDraft(''); playBeep('sent'); void loadContacts();
    } catch (e: any) { setError(e.message); }
    finally { setSending(false); }
  }

  async function toggleSound() {
    if (soundEnabled) { setSoundEnabled(false); localStorage.setItem('bkd_chat_sound', 'off'); return; }
    try { const context = audioRef.current || new window.AudioContext(); audioRef.current = context; await context.resume(); } catch { /* Browser may not support audio. */ }
    setSoundEnabled(true); localStorage.setItem('bkd_chat_sound', 'on');
  }

  const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const clock = (value: string) => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return <>
    <PageHeading eyebrow="Staff workspace" title="Staff chat" description="Send quick text messages to other active staff accounts." action={<button type="button" onClick={toggleSound} aria-pressed={soundEnabled} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e5ece8] bg-white px-3 text-xs font-bold text-[#425c51] hover:bg-[#f7f9f8]">{soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}{soundEnabled ? 'Sound on' : 'Enable sound'}</button>} />
    <section className="grid h-[min(68vh,720px)] min-h-[470px] overflow-hidden rounded-2xl border border-[#e5ece8] bg-white shadow-soft md:grid-cols-[300px_1fr]" aria-label="Staff messaging">
      <aside className={`${selected ? 'hidden md:block' : 'block'} min-h-0 border-r border-[#edf1ef]`}>
        <div className="border-b border-[#edf1ef] px-4 py-4"><h2 className="text-sm font-extrabold text-[#233b33]">Conversations</h2><p className="mt-1 text-[11px] text-[#82928b]">Active staff accounts</p></div>
        <div className="h-[calc(100%-69px)] overflow-y-auto p-2">
          {loadingContacts ? <div className="p-4 text-xs text-[#82928b]">Loading staff…</div> : contacts.length === 0 ? <div className="px-4 py-8 text-center"><MessageCircle className="mx-auto mb-2 text-[#a6b5ae]" size={24}/><p className="text-xs text-[#82928b]">No other active staff accounts yet.</p></div> : contacts.map(contact => <button key={contact.id} onClick={() => { setSelected(contact); setError(''); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${selected?.id === contact.id ? 'bg-[#edf7f1]' : 'hover:bg-[#f7f9f8]'}`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e3f1eb] text-xs font-bold text-brand-700">{initials(contact.name)}</span>
            <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-xs font-bold text-[#2b443a]">{contact.name}</span>{contact.last_message_at && <span className="shrink-0 text-[10px] text-[#9aa9a3]">{clock(contact.last_message_at)}</span>}</span><span className="mt-1 flex items-center justify-between gap-2"><span className="truncate text-[10px] text-[#82928b]">{contact.last_message || contact.department || roleLabels[contact.role] || 'Staff'}</span>{contact.unread_count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{contact.unread_count}</span>}</span></span>
          </button>)}
        </div>
      </aside>
      <div className={`${selected ? 'flex' : 'hidden md:flex'} min-h-0 flex-col`}>
        {selected ? <>
          <header className="flex items-center gap-3 border-b border-[#edf1ef] px-4 py-3"><button onClick={() => setSelected(null)} className="mr-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-700 md:hidden">Back</button><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e3f1eb] text-xs font-bold text-brand-700">{initials(selected.name)}</span><span className="min-w-0"><span className="block truncate text-sm font-bold text-[#233b33]">{selected.name}</span><span className="mt-0.5 block truncate text-[10px] text-[#82928b]">{selected.department || roleLabels[selected.role] || 'Hospital staff'}</span></span><span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Active account</span></header>
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f8faf9] px-4 py-5 sm:px-6">{messages.length === 0 && !loadingMessages && <div className="grid h-full place-items-center"><p className="rounded-xl bg-white px-4 py-3 text-xs text-[#82928b] shadow-sm">Say hello to start the conversation.</p></div>}{messages.map(message => { const mine = message.sender_id === meId; return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[70%] ${mine ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md border border-[#e9efeb] bg-white text-[#2b443a]'}`}><p className="whitespace-pre-wrap break-words text-sm">{message.body}</p><div className={`mt-1 flex items-center justify-end gap-1.5 text-[9px] ${mine ? 'text-white/75' : 'text-[#9aa9a3]'}`}><time>{clock(message.created_at)}</time>{mine && <span>{message.read_at ? 'Read' : 'Sent'}</span>}</div></div></div>; })}<div ref={messageEndRef}/></div>
          {error && <div role="alert" className="border-t border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700">{error}</div>}
          <form onSubmit={sendMessage} className="flex items-end gap-2 border-t border-[#edf1ef] bg-white p-3 sm:p-4"><label className="sr-only" htmlFor="staff-chat-message">Message</label><textarea id="staff-chat-message" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} maxLength={4000} rows={1} placeholder="Write a message…" className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-[#e5ece8] bg-[#f9fbfa] px-3 py-3 text-sm outline-none focus:border-brand-500"/><button type="submit" disabled={sending || !draft.trim()} aria-label="Send message" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"><Send size={17}/></button></form>
        </> : <div className="grid flex-1 place-items-center p-6 text-center"><div><MessageCircle className="mx-auto mb-3 text-[#a6b5ae]" size={34}/><h2 className="text-sm font-bold text-[#425c51]">Your staff conversations</h2><p className="mt-1 max-w-xs text-xs text-[#82928b]">Choose a staff member to start chatting. Messages are text-only.</p></div></div>}
      </div>
    </section>
    <p className="mt-3 flex items-center gap-1.5 text-[10px] text-[#94a39c]"><Bell size={12}/>Messages refresh automatically. No photos, files, or other attachments can be sent.</p>
  </>;
}
