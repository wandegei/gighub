import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Send, Search, MessageSquare, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const chatRef = useRef(null);

  /* ------------------------------- */
  /* LOAD USER & PROFILE */
  /* ------------------------------- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return setLoading(false);
      setUser(userData.user);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading profile:", error);
        setLoading(false);
        return;
      }

      setProfile(profileData);
      await loadConversations(profileData?.id);
      setLoading(false);
    })();
  }, []);

  /* ------------------------------- */
  /* LOAD CONVERSATIONS */
  /* ------------------------------- */
  const loadConversations = async (profileId) => {
    if (!profileId) return;

    try {
      const { data: convosData, error } = await supabase
        .from("conversations")
        .select(`
          id,
          user_one,
          user_two,
          last_message,
          last_message_time
        `)
        .or(`user_one.eq.${profileId},user_two.eq.${profileId}`)
        .order("last_message_time", { ascending: false });

      if (error) throw error;

      const convos = (convosData || []).map((c) => {
        const otherId = c.user_one === profileId ? c.user_two : c.user_one;
        return {
          id: c.id,
          otherId,
          lastMessage: c.last_message || "",
          lastMessageTime: c.last_message_time,
          unread: 0,
        };
      });

      // Count unread messages safely
      for (let convo of convos) {
        const { data: unreadData } = await supabase
          .from("messages")
          .select("id")
          .eq("conversation_id", convo.id)
          .eq("receiver_id", profileId)
          .eq("is_read", false);
        convo.unread = unreadData?.length || 0;
      }

      setConversations(convos);

      // Auto-open conversation from URL
      const params = new URLSearchParams(window.location.search);
      const convoId = params.get("convoId");
      if (convoId) {
        const found = convos.find((c) => c.id === convoId);
        if (found) setSelectedConvo(found);
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
    }
  };

  /* ------------------------------- */
  /* LOAD MESSAGES */
  /* ------------------------------- */
  useEffect(() => {
    if (!selectedConvo || !profile?.id) return;

    const loadMessages = async () => {
      try {
        const { data: messagesData, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", selectedConvo.id)
          .order("created_at", { ascending: true });

        if (error) throw error;

        setMessages(messagesData || []);

        // Mark messages as read
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("conversation_id", selectedConvo.id)
          .eq("receiver_id", profile.id)
          .eq("is_read", false);
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    };

    loadMessages();
  }, [selectedConvo, profile?.id]);

  /* ------------------------------- */
  /* AUTO SCROLL TO BOTTOM */
  /* ------------------------------- */
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  /* ------------------------------- */
  /* SEND MESSAGE */
  /* ------------------------------- */
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConvo || !profile) return;
    const messageText = newMessage.trim();
    setSending(true);

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedConvo.id,
        sender_id: profile.id,
        receiver_id: selectedConvo.otherId,
        message: messageText,
        is_read: false,
      });

      if (error) throw error;

      await supabase
        .from("conversations")
        .update({
          last_message: messageText,
          last_message_time: new Date().toISOString(),
        })
        .eq("id", selectedConvo.id);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender_id: profile.id,
          receiver_id: selectedConvo.otherId,
          message: messageText,
          created_at: new Date().toISOString(),
        },
      ]);

      setNewMessage("");
      await loadConversations(profile.id);
    } catch (err) {
      console.error(err);
      toast.error("Message failed");
    } finally {
      setSending(false);
    }
  };

  /* ------------------------------- */
  /* TYPING INDICATOR */
  /* ------------------------------- */
  const handleTyping = async (e) => {
    setNewMessage(e.target.value);
    if (!selectedConvo || !profile) return;

    try {
      await supabase.channel("typing").httpSend({
        type: "broadcast",
        event: "typing",
        payload: {
          conversation_id: selectedConvo.id,
          user_id: profile.id,
        },
      });
    } catch (err) {
      console.error("Typing broadcast failed:", err);
    }
  };

  /* ------------------------------- */
  /* REALTIME UPDATES */
  /* ------------------------------- */
  useEffect(() => {
    if (!profile) return;

    const channel = supabase.channel("messages-system");

    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;
          if (msg.sender_id === profile.id || msg.receiver_id === profile.id) {
            if (selectedConvo?.id === msg.conversation_id) {
              setMessages((prev) => [...prev, msg]);
            }
            loadConversations(profile.id);
          }
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        if (
          payload.payload.user_id !== profile.id &&
          payload.payload.conversation_id === selectedConvo?.id
        ) {
          setOtherTyping(true);
          setTimeout(() => setOtherTyping(false), 2000);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [profile, selectedConvo]);

  if (loading)
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-[#1E2430] rounded w-48 mb-6" />
          <div className="h-96 bg-[#1E2430] rounded-xl" />
        </div>
      </div>
    );

  /* ------------------------------- */
  /* UI */
  /* ------------------------------- */
  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl lg:text-3xl font-bold text-white mb-6">Messages</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">

        {/* CONVERSATIONS */}
        <div className={`card-dark p-4 overflow-y-auto ${selectedConvo ? "hidden lg:block" : ""}`}>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input placeholder="Search messages..." className="input-dark pl-10" />
          </div>

          {conversations.length > 0 ? (
            <div className="space-y-2">
              {conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => setSelectedConvo(convo)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedConvo?.id === convo.id
                      ? "bg-[#FF6B3D]/10 border border-[#FF6B3D]"
                      : "hover:bg-[#0A0E1A]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{convo.otherName || "User"}</span>
                    {convo.unread > 0 && (
                      <span className="bg-[#FF6B3D] text-black text-xs px-2 py-0.5 rounded-full">{convo.unread}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-1">{convo.lastMessage}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {convo.lastMessageTime ? format(new Date(convo.lastMessageTime), "MMM d, h:mm a") : ""}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No conversations yet</p>
            </div>
          )}
        </div>

        {/* CHAT */}
        <div className={`lg:col-span-2 card-dark flex flex-col ${!selectedConvo ? "hidden lg:flex" : ""}`}>
          {selectedConvo ? (
            <>
              <div className="p-4 border-b border-[#1E2430] flex items-center gap-3">
                <button onClick={() => setSelectedConvo(null)} className="lg:hidden text-[#FF6B3D]">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF5722] flex items-center justify-center">
                  <span className="font-semibold text-black">{selectedConvo.otherName?.charAt(0)}</span>
                </div>
                <p className="font-medium text-white">{selectedConvo.otherName}</p>
              </div>

              <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isSent = msg.sender_id === profile.id;
                  return (
                    <div key={msg.id} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isSent ? "bg-gradient-to-r from-[#FF6B3D] to-[#FF5722]" : "bg-[#151922]"}`}>
                        <p style={{ color: isSent ? "black" : "white" }}>{msg.message}</p>
                        <p className={`text-xs mt-1 ${isSent ? "text-black/70" : "text-gray-500"}`}>
                          {format(new Date(msg.created_at), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {otherTyping && <p className="text-xs text-gray-500 px-2">typing...</p>}
              </div>

              <div className="p-4 border-t border-[#1E2430]">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="input-dark resize-none"
                    rows={2}
                  />
                  <Button onClick={handleSend} disabled={sending || !newMessage.trim()} className="btn-primary">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}