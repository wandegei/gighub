import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Bot, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function AIAssistant() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Get user from Supabase
      const { data: { user: supaUser }, error } = await supabase.auth.getUser();
      if (error || !supaUser) {
        toast.error("Failed to fetch user");
        setLoading(false);
        return;
      }
      setUser(supaUser);

      // Fetch provider profile from Supabase 'profiles' table
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", supaUser.email);

      if (profiles && profiles.length > 0) {
        setProfile(profiles[0]);
      }

      // Initial assistant message
      setMessages([
        {
          role: "assistant",
          content: `Hi! I'm your GigHub AI Assistant. I can help you with:

• Writing better service descriptions
• Pricing strategies
• Client communication tips
• Profile optimization
• Business advice

How can I help you today?`
        }
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setSending(true);

    try {
      const context = `You are a helpful AI assistant for service providers on GigHub, a freelance marketplace platform in Uganda. 
The user is ${profile?.full_name || "a provider"} (${profile?.user_type || "provider"}). 
Provide practical, actionable advice specific to the Ugandan market and service industry.`;

      // Replace this with your LLM call
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${context}\n\nUser question: ${userMessage}` })
      }).then((res) => res.json());

      setMessages((prev) => [...prev, { role: "assistant", content: response.answer }]);
    } catch (error) {
      toast.error("Failed to get response");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." }
      ]);
    }

    setSending(false);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-[#1E2430] rounded w-48 mb-6" />
          <div className="h-96 bg-[#1E2430] rounded-xl" />
        </div>
      </div>
    );
  }

  if (profile?.user_type !== "provider") {
    return (
      <div className="p-6 lg:p-8">
        <div className="card-dark p-12 text-center">
          <Bot className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            AI Assistant is for providers only
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Bot className="w-8 h-8 text-[#FF6B3D]" /> AI Assistant
        </h1>
        <p className="text-[#FF6B3D]">Get instant help and advice for your business</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="card-dark flex flex-col" style={{ height: "calc(100vh - 300px)" }}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-[#FF6B3D] to-[#FF5722]"
                      : "bg-[#0A0E1A] border border-[#1E2430]"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown
                      className="prose prose-sm prose-invert max-w-none"
                      components={{
                        p: ({ children }) => <p className="text-white mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="text-white list-disc ml-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="text-white list-decimal ml-4 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="text-white mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="text-[#FF6B3D]">{children}</strong>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p style={{ color: "black" }}>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-[#0A0E1A] border border-[#1E2430] rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 text-[#FF6B3D] animate-spin" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[#1E2430]">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask me anything about growing your business..."
                className="input-dark resize-none"
                rows={2}
                disabled={sending}
              />
              <Button onClick={handleSend} disabled={sending || !input.trim()} className="btn-primary">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}