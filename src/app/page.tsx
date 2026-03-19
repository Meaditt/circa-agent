"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/lib/types";

interface DownloadInfo {
  url: string;
  fileName: string;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [download, setDownload] = useState<DownloadInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      const assistantContent: string = data.content;

      const pptxMatch = assistantContent.match(
        /\|\|\|GENERATE_PPTX\|\|\|(.+?)\|\|\|END_PPTX\|\|\|/s
      );

      const cleanContent = assistantContent
        .replace(/\|\|\|GENERATE_PPTX\|\|\|.+?\|\|\|END_PPTX\|\|\|/s, "")
        .trim();

      setMessages([...newMessages, { role: "assistant", content: cleanContent }]);

      if (pptxMatch) {
        const pptxData = JSON.parse(pptxMatch[1]);
        await handleGeneratePptx(pptxData.customerName, pptxData.propertyNames);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePptx(customerName: string, propertyNames: string[]) {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, propertyNames }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const fileName = `Circa_${customerName.replace(/\s+/g, "_")}_Presentation.pptx`;

      setDownload({ url, fileName });
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, there was an error generating the presentation." },
      ]);
    } finally {
      setGenerating(false);
    }
  }

  function handleDownloadClick() {
    if (!download) return;
    const a = document.createElement("a");
    a.href = download.url;
    a.download = download.fileName;
    a.click();
    URL.revokeObjectURL(download.url);
    setDownload(null);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Got it! Let me know if you need any changes or want to explore other properties.",
      },
    ]);
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-[#2a2a4a]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--circa-gold)]">CIRCA</h1>
          <p className="text-sm text-gray-400">Panama Property Agent</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-60">
            <div className="text-5xl font-bold text-[var(--circa-gold)]">CIRCA</div>
            <p className="text-gray-400 max-w-md">
              Welcome! I'm your Circa Panama property agent. Tell me what you're looking for
              - budget, location, property type - and I'll find the perfect match for you.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {[
                "Show me beachfront properties",
                "What's available under $600K?",
                "I want a house with a pool",
                "Properties in Playa Venao",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 text-sm rounded-full border border-[#2a2a4a] text-gray-400 hover:text-[var(--circa-gold)] hover:border-[var(--circa-gold)] transition-colors cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-[var(--circa-gold)] text-[var(--circa-dark)]"
                  : "bg-[#1e1e3a] text-gray-200"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1e1e3a] rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--circa-gold)] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[var(--circa-gold)] animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 rounded-full bg-[var(--circa-gold)] animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        {generating && (
          <div className="flex justify-start">
            <div className="bg-[#1e1e3a] rounded-2xl px-4 py-3 text-[var(--circa-gold)] text-sm">
              Generating your presentation...
            </div>
          </div>
        )}

        {download && (
          <div className="flex justify-start">
            <button
              onClick={handleDownloadClick}
              className="flex items-center gap-3 bg-[var(--circa-gold)] text-[var(--circa-dark)] font-semibold px-6 py-3 rounded-2xl hover:brightness-110 transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Click here to download your presentation
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-[#2a2a4a]">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about properties in Panama..."
            className="flex-1 bg-[#1e1e3a] rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[var(--circa-gold)] transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-[var(--circa-gold)] text-[var(--circa-dark)] font-semibold px-6 py-3 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
