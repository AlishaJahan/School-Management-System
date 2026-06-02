"use client";

import { useEffect, useState, useRef } from "react";

export default function MessagingPage() {
  const [currentUser, setCurrentUser] = useState({ id: 0, name: "User", role: "student" });
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");

  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const messageEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const shouldScrollRef = useRef(true);

  // Load user details & contacts on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    let userObj = { id: 0, name: "User", role: "student" };
    if (savedUser) {
      try {
        userObj = JSON.parse(savedUser);
        setCurrentUser(userObj);
      } catch (e) {}
    }
    fetchContacts(userObj);
  }, []);

  // Poll for new messages every 4 seconds when a chat is open
  useEffect(() => {
    if (!activeContact) return;

    // Fetch immediately
    fetchMessages(activeContact.user_id, false);

    const interval = setInterval(() => {
      fetchMessages(activeContact.user_id, false);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeContact]);

  // Scroll to bottom when message log changes (only if forced or near bottom)
  useEffect(() => {
    if (messages.length === 0) return;

    const checkAndScroll = () => {
      let forceScroll = shouldScrollRef.current;
      
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const nearBottom = (scrollHeight - scrollTop - clientHeight) < 150;

        if (forceScroll || nearBottom) {
          chatContainerRef.current.scrollTo({
            top: scrollHeight,
            behavior: forceScroll ? "instant" : "smooth"
          });
          shouldScrollRef.current = false;
        }
      }
    };

    // Use a small timeout to let the DOM complete layout renders
    const timer = setTimeout(checkAndScroll, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  const fetchContacts = async (userObj) => {
    setLoadingContacts(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/parent/contacts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load contacts.");
      const data = await res.json();
      setContacts(data);

      // Pre-select first contact if available
      if (data.length > 0) {
        shouldScrollRef.current = true;
        setActiveContact(data[0]);
      }
    } catch (err) {
      setError(err.message || "Unable to retrieve contacts directory.");
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchMessages = async (targetId, showLoader = true) => {
    if (showLoader) {
      setLoadingMessages(true);
      shouldScrollRef.current = true;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/parent/messages/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch messages.");
      const data = await res.json();
      
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoader) setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeContact) return;

    setSending(true);
    const token = localStorage.getItem("token");
    const payload = {
      receiverId: activeContact.user_id,
      message: messageInput.trim()
    };

    try {
      const res = await fetch("http://localhost:5000/api/parent/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to deliver message.");
      
      const sentMsg = await res.json();
      shouldScrollRef.current = true;
      setMessages(prev => [...prev, sentMsg]);
      setMessageInput("");
    } catch (err) {
      setError(err.message || "Failed to dispatch message.");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const d = new Date(timeStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in h-[80vh]">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 uppercase tracking-widest">
              Messaging Desk
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 uppercase tracking-widest">
              Live Secure Channel
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Parent-Teacher Inbox</h2>
          <p className="text-zinc-400 text-xs">
            Review academic logs, coordinate study plans, and send updates to instructors and parents in real-time.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-semibold animate-fade-in flex-shrink-0">
          ⚠️ {error}
        </div>
      )}

      {/* Messaging Layout Panel */}
      <div className="flex flex-1 gap-6 overflow-hidden min-h-[450px]">
        
        {/* Left Hand: Contacts Sidebar (Col span 1) */}
        <div className="w-80 glass-card rounded-2xl flex flex-col overflow-hidden border-white/5">
          <div className="p-4 border-b border-white/5 bg-white/[0.01]">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-0.5">Active Directory Contacts</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {loadingContacts ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500/20 border-t-indigo-400" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Syncing contacts...</span>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-zinc-600 text-xs font-bold uppercase tracking-wider">No contacts indexed</span>
              </div>
            ) : (
              contacts.map((contact) => {
                const isSelected = activeContact?.user_id === contact.user_id;
                return (
                  <div
                    key={contact.user_id}
                    onClick={() => { 
                      setActiveContact(contact); 
                      setError(""); 
                      shouldScrollRef.current = true;
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 group ${
                      isSelected
                        ? "bg-violet-500/10 border-violet-500/30 text-violet-300 shadow-inner"
                        : "bg-white/[0.01] border-white/5 text-zinc-300 hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold ${isSelected ? "text-violet-300" : "text-white group-hover:text-violet-300 transition-colors"}`}>{contact.name}</span>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                        contact.role === 'teacher' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                      }`}>{contact.role || "member"}</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-semibold">{contact.detail}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Hand: Active Chat Console (Col span 2) */}
        <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden border-white/5 bg-white/[0.005]">
          
          {activeContact ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-4 border-b border-white/5 bg-white/[0.01] flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-300 font-bold uppercase text-xs">
                    {activeContact.name.substring(0, 2)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white leading-tight">{activeContact.name}</span>
                    <span className="text-[10px] text-zinc-400">{activeContact.detail} • {activeContact.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active Connection</span>
                </div>
              </div>

              {/* Chat Messages Logs */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-500/20 border-t-violet-400" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Syncing dialogue log...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-10 select-none">
                    <span className="text-2xl mb-2">💬</span>
                    <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Send a message to start dialogue</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[70%] gap-1 ${
                          isMe ? "self-end items-end" : "self-start items-start"
                        }`}
                      >
                        {/* Sender Label */}
                        <span className="text-[8px] text-zinc-500 font-bold tracking-wider pl-0.5">
                          {isMe ? "You" : msg.sender_name}
                        </span>
                        
                        {/* Bubble */}
                        <div
                          className={`p-3.5 rounded-2xl border text-xs font-medium leading-relaxed leading-normal ${
                            isMe
                              ? "bg-violet-500/15 border-violet-500/20 text-violet-200 rounded-tr-none shadow-md shadow-violet-500/5"
                              : "bg-white/[0.02] border-white/5 text-zinc-300 rounded-tl-none"
                          }`}
                        >
                          <p>{msg.message}</p>
                        </div>
                        
                        {/* Timestamp */}
                        <span className="text-[8px] text-zinc-600 font-semibold font-mono pr-0.5 mt-0.5">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Chat Input Console Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-white/[0.01] flex gap-3 flex-shrink-0">
                <input
                  type="text"
                  placeholder={`Send message to ${activeContact.name}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="glass-input px-4 py-3.5 text-xs font-semibold flex-grow bg-[#09090b]/40"
                  required
                />
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className="glow-btn px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center flex-shrink-0 disabled:opacity-50 active:scale-[0.98] transition-all"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-10 select-none">
              <span className="text-3xl mb-3">✉️</span>
              <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Select a contact to begin secure dialogue</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
