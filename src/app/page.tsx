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
  }, [messages, download]);

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

  const suggestions = [
    "Show me beachfront properties",
    "What's available under $600K?",
    "I want a house with a pool",
    "Properties in Playa Venao",
  ];

  return (
    <div className="relative z-10 flex flex-col h-screen max-w-3xl mx-auto">
      {/* Header */}
      <header className="px-8 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo mark */}
            <div className="w-10 h-10 rounded-full border border-[var(--circa-border-active)] flex items-center justify-center">
              <span
                className="text-lg font-semibold text-[var(--circa-gold)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                C
              </span>
            </div>
            <div>
              <h1
                className="text-xl tracking-[0.2em] font-light text-[var(--circa-gold)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                CIRCA
              </h1>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--circa-text-dim)]">
                Panama Real Estate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
            <span className="text-[11px] text-[var(--circa-text-dim)] tracking-wide">Online</span>
          </div>
        </div>
        <div className="header-line mt-4" />
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center hero-enter">
            {/* Hero */}
            <div className="hero-title">
              <h2
                className="text-6xl font-light text-[var(--circa-gold)] tracking-[0.15em]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                CIRCA
              </h2>
            </div>
            <p
              className="hero-subtitle text-sm tracking-[0.4em] uppercase text-[var(--circa-text-dim)] mt-2"
            >
              Property Concierge
            </p>

            {/* Divider */}
            <div className="hero-divider flex items-center gap-4 mt-8 mb-6">
              <div className="w-12 h-px bg-[var(--circa-border-active)]" />
              <div className="w-1.5 h-1.5 rotate-45 border border-[var(--circa-gold-dim)]" />
              <div className="w-12 h-px bg-[var(--circa-border-active)]" />
            </div>

            <p
              className="hero-description text-[var(--circa-text-muted)] max-w-sm leading-relaxed text-[15px]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Welcome. Tell me what you're looking for and I'll find your
              perfect property in Panama.
            </p>

            {/* Suggestion chips */}
            <div className="hero-chips flex flex-wrap gap-2.5 justify-center mt-8 max-w-lg">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="chip-hover px-4 py-2 text-[13px] rounded-full border border-[var(--circa-border)] text-[var(--circa-text-dim)] cursor-pointer bg-transparent"
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
            className={`flex message-enter ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
            style={{ animationDelay: `${(i % 3) * 0.05}s` }}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full border border-[var(--circa-border-active)] flex items-center justify-center mr-3 mt-0.5">
                <span
                  className="text-xs text-[var(--circa-gold)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  C
                </span>
              </div>
            )}
            <div
              className={`max-w-[75%] px-5 py-3.5 ${
                message.role === "user"
                  ? "bg-[var(--circa-gold)] text-[var(--circa-dark)] rounded-2xl rounded-br-md"
                  : "bg-[var(--circa-surface)] text-[var(--circa-text)] rounded-2xl rounded-bl-md border border-[var(--circa-border)]"
              }`}
            >
              <p
                className="whitespace-pre-wrap text-[14px] leading-[1.7]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start message-enter">
            <div className="flex-shrink-0 w-7 h-7 rounded-full border border-[var(--circa-border-active)] flex items-center justify-center mr-3 mt-0.5">
              <span
                className="text-xs text-[var(--circa-gold)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                C
              </span>
            </div>
            <div className="bg-[var(--circa-surface)] rounded-2xl rounded-bl-md border border-[var(--circa-border)] px-5 py-4">
              <div className="flex gap-1.5">
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--circa-gold)]" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--circa-gold)]" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--circa-gold)]" />
              </div>
            </div>
          </div>
        )}

        {/* Generating state */}
        {generating && (
          <div className="flex justify-start message-enter">
            <div className="flex-shrink-0 w-7 h-7 rounded-full border border-[var(--circa-border-active)] flex items-center justify-center mr-3 mt-0.5">
              <span
                className="text-xs text-[var(--circa-gold)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                C
              </span>
            </div>
            <div className="bg-[var(--circa-surface)] rounded-2xl rounded-bl-md border border-[var(--circa-border)] px-5 py-3.5">
              <div className="flex items-center gap-3">
                <svg
                  className="animate-spin w-4 h-4 text-[var(--circa-gold)]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-[13px] text-[var(--circa-text-muted)]">
                  Preparing your presentation...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Download button */}
        {download && (
          <div className="flex justify-start message-enter">
            <div className="flex-shrink-0 w-7 h-7 rounded-full border border-[var(--circa-border-active)] flex items-center justify-center mr-3 mt-0.5">
              <span
                className="text-xs text-[var(--circa-gold)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                C
              </span>
            </div>
            <button
              onClick={handleDownloadClick}
              className="download-shimmer group flex items-center gap-4 text-[var(--circa-dark)] font-medium px-6 py-4 rounded-2xl rounded-bl-md hover:brightness-110 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--circa-dark)]/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <div className="text-left">
                <span className="block text-[14px] font-semibold">
                  Download Presentation
                </span>
                <span className="block text-[11px] opacity-70 mt-0.5">
                  {download.fileName}
                </span>
              </div>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-8 pb-6 pt-2">
        <div className="header-line mb-4" />
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me what you're looking for..."
                className="input-glow w-full bg-[var(--circa-surface)] rounded-xl px-5 py-3.5 text-[var(--circa-text)] placeholder-[var(--circa-text-dim)] outline-none border border-[var(--circa-border)] focus:border-[var(--circa-gold-dim)] transition-all text-[14px]"
                style={{ fontFamily: "var(--font-body)" }}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="group bg-[var(--circa-gold)] text-[var(--circa-dark)] w-12 h-12 rounded-xl flex items-center justify-center hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </form>
        <p className="text-center text-[10px] text-[var(--circa-text-dim)] mt-3 tracking-wide">
          Powered by Circa Panama
        </p>
      </div>
    </div>
  );
}
