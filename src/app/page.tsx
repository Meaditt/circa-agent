"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage, Property } from "@/lib/types";

interface DownloadInfo {
  url: string;
  fileName: string;
}

type View = "builder" | "chat";

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [clientName, setClientName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [download, setDownload] = useState<DownloadInfo | null>(null);
  const [view, setView] = useState<View>("builder");
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Load properties
  useEffect(() => {
    fetch("/api/properties")
      .then((res) => res.json())
      .then((data) => setProperties(data.properties || []))
      .catch(() => {});
  }, []);

  const categories = ["All", ...Array.from(new Set(properties.map((p) => p.category)))];

  const filtered = properties.filter((p) => {
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    const matchesSearch =
      !filter ||
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.location.toLowerCase().includes(filter.toLowerCase()) ||
      p.amenities.toLowerCase().includes(filter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function toggleProperty(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.name)));
    }
  }

  const handleGenerate = useCallback(async () => {
    if (selected.size === 0 || !clientName.trim()) return;
    setGenerating(true);
    setDownload(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: clientName.trim(),
          propertyNames: Array.from(selected),
        }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const blob = await res.blob();
      const fileName = `Circa_${clientName.trim().replace(/\s+/g, "_")}_Presentation.pptx`;
      const file = new File([blob], fileName, {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });
      const url = URL.createObjectURL(file);

      setDownload({ url, fileName });
    } catch {
      alert("Error generating presentation. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [selected, clientName]);

  function handleDownload() {
    if (!download) return;
    const a = document.createElement("a");
    a.href = download.url;
    a.download = download.fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(download.url);
    }, 100);
    setDownload(null);
  }

  // Chat handlers
  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage: ChatMessage = { role: "user", content: chatInput };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    setStreamingContent("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("Chat failed");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      let fullContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              }
            } catch {}
          }
        }
      }

      const cleanContent = fullContent
        .replace(/\|\|\|GENERATE_PPTX\|\|\|.+?\|\|\|END_PPTX\|\|\|/s, "")
        .replace(/\[\[(.+?)\]\]/g, "$1")
        .trim();

      setStreamingContent("");
      setMessages([...newMessages, { role: "assistant", content: cleanContent }]);
    } catch {
      setStreamingContent("");
      setMessages([...newMessages, { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setChatLoading(false);
    }
  }

  const selectedProperties = properties.filter((p) => selected.has(p.name));

  return (
    <div className="min-h-screen bg-[var(--circa-darker)]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[var(--circa-darker)]/90 backdrop-blur-md border-b border-[var(--circa-border)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border border-[var(--circa-border-active)] flex items-center justify-center">
              <span className="text-lg font-semibold text-[var(--circa-gold)]" style={{ fontFamily: "var(--font-display)" }}>C</span>
            </div>
            <div>
              <h1 className="text-xl tracking-[0.2em] font-light text-[var(--circa-gold)]" style={{ fontFamily: "var(--font-display)" }}>CIRCA</h1>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--circa-text-dim)]">Presentation Builder</p>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-[var(--circa-surface)] rounded-lg p-1 border border-[var(--circa-border)]">
            <button
              onClick={() => setView("builder")}
              className={`px-4 py-1.5 rounded-md text-[12px] tracking-wide transition-all cursor-pointer ${
                view === "builder"
                  ? "bg-[var(--circa-gold)] text-[var(--circa-dark)] font-semibold"
                  : "text-[var(--circa-text-dim)] hover:text-[var(--circa-text)]"
              }`}
            >
              Builder
            </button>
            <button
              onClick={() => setView("chat")}
              className={`px-4 py-1.5 rounded-md text-[12px] tracking-wide transition-all cursor-pointer ${
                view === "chat"
                  ? "bg-[var(--circa-gold)] text-[var(--circa-dark)] font-semibold"
                  : "text-[var(--circa-text-dim)] hover:text-[var(--circa-text)]"
              }`}
            >
              Assistant
            </button>
          </div>
        </div>
      </header>

      {view === "builder" ? (
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Generation Bar */}
          <div className="sticky top-[73px] z-40 bg-[var(--circa-surface)] rounded-xl border border-[var(--circa-border)] p-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] tracking-wider uppercase text-[var(--circa-text-dim)] block mb-1">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name..."
                  className="w-full bg-[var(--circa-darker)] rounded-lg px-4 py-2.5 text-[var(--circa-text)] placeholder-[var(--circa-text-dim)] outline-none border border-[var(--circa-border)] focus:border-[var(--circa-gold-dim)] transition-all text-[14px]"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <div className="text-[13px] text-[var(--circa-text-muted)]">
                  <span className="text-[var(--circa-gold)] font-semibold">{selected.size}</span> properties selected
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating || selected.size === 0 || !clientName.trim()}
                  className="bg-[var(--circa-gold)] text-[var(--circa-dark)] px-6 py-2.5 rounded-lg font-semibold text-[13px] hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                      Generate Presentation
                    </>
                  )}
                </button>

                {download && (
                  <button
                    onClick={handleDownload}
                    className="download-shimmer text-[var(--circa-dark)] px-6 py-2.5 rounded-lg font-semibold text-[13px] hover:brightness-110 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download PPTX
                  </button>
                )}
              </div>
            </div>

            {/* Selected properties preview */}
            {selectedProperties.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {selectedProperties.map((p) => (
                  <span
                    key={p.name}
                    className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full bg-[var(--circa-gold)]/10 text-[var(--circa-gold)] border border-[var(--circa-gold)]/20"
                  >
                    {p.name}
                    <button
                      onClick={() => toggleProperty(p.name)}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search properties..."
              className="bg-[var(--circa-surface)] rounded-lg px-4 py-2.5 text-[var(--circa-text)] placeholder-[var(--circa-text-dim)] outline-none border border-[var(--circa-border)] focus:border-[var(--circa-gold-dim)] transition-all text-[13px] w-64"
            />

            <div className="flex gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-[11px] tracking-wide border transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? "bg-[var(--circa-gold)] text-[var(--circa-dark)] border-[var(--circa-gold)] font-semibold"
                      : "border-[var(--circa-border)] text-[var(--circa-text-dim)] hover:border-[var(--circa-gold-dim)] hover:text-[var(--circa-gold)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={selectAll}
              className="ml-auto text-[11px] text-[var(--circa-text-dim)] hover:text-[var(--circa-gold)] transition-colors cursor-pointer"
            >
              {selected.size === filtered.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          {/* Property Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((property) => (
              <PropertyCard
                key={property.name}
                property={property}
                isSelected={selected.has(property.name)}
                onToggle={() => toggleProperty(property.name)}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-[var(--circa-text-dim)]">
              No properties match your search.
            </div>
          )}
        </div>
      ) : (
        /* Chat View */
        <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 73px)" }}>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <p className="text-[var(--circa-text-muted)] text-[15px]" style={{ fontFamily: "var(--font-body)" }}>
                  Ask me anything about the properties - I can help you find the right ones for your client.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-6">
                  {[
                    "What's available under $600K?",
                    "Show me beachfront properties",
                    "Best options for investors",
                    "Properties with a pool",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setChatInput(s)}
                      className="chip-hover px-4 py-2 text-[12px] rounded-full border border-[var(--circa-border)] text-[var(--circa-text-dim)] cursor-pointer bg-transparent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && <AgentAvatar />}
                <div
                  className={`max-w-[80%] px-4 py-3 text-[14px] leading-[1.7] ${
                    msg.role === "user"
                      ? "bg-[var(--circa-gold)] text-[var(--circa-dark)] rounded-2xl rounded-br-md"
                      : "bg-[var(--circa-surface)] text-[var(--circa-text)] rounded-2xl rounded-bl-md border border-[var(--circa-border)]"
                  }`}
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                </div>
              </div>
            ))}

            {streamingContent && (
              <div className="flex justify-start">
                <AgentAvatar />
                <div className="max-w-[80%] px-4 py-3 bg-[var(--circa-surface)] text-[var(--circa-text)] rounded-2xl rounded-bl-md border border-[var(--circa-border)] text-[14px] leading-[1.7]" style={{ fontFamily: "var(--font-body)" }}>
                  <span className="whitespace-pre-wrap">
                    {streamingContent.replace(/\|\|\|GENERATE_PPTX\|\|\|.+?\|\|\|END_PPTX\|\|\|/s, "").replace(/\[\[(.+?)\]\]/g, "$1").trim()}
                  </span>
                  <span className="inline-block w-1.5 h-4 bg-[var(--circa-gold)] ml-0.5 animate-pulse" />
                </div>
              </div>
            )}

            {chatLoading && !streamingContent && (
              <div className="flex justify-start">
                <AgentAvatar />
                <div className="bg-[var(--circa-surface)] rounded-2xl rounded-bl-md border border-[var(--circa-border)] px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--circa-gold)]" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--circa-gold)]" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--circa-gold)]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="px-6 pb-6 pt-2">
            <form onSubmit={handleChatSubmit} className="flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about properties..."
                className="flex-1 bg-[var(--circa-surface)] rounded-xl px-5 py-3.5 text-[var(--circa-text)] placeholder-[var(--circa-text-dim)] outline-none border border-[var(--circa-border)] focus:border-[var(--circa-gold-dim)] transition-all text-[14px]"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="bg-[var(--circa-gold)] text-[var(--circa-dark)] w-12 h-12 rounded-xl flex items-center justify-center hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AgentAvatar() {
  return (
    <div className="flex-shrink-0 w-7 h-7 rounded-full border border-[var(--circa-border-active)] flex items-center justify-center mr-3 mt-0.5">
      <span className="text-xs text-[var(--circa-gold)]" style={{ fontFamily: "var(--font-display)" }}>C</span>
    </div>
  );
}

function PropertyCard({
  property,
  isSelected,
  onToggle,
}: {
  property: Property;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const price = property.price
    ? property.price.startsWith("$") ? property.price : `$${property.price}`
    : "Price on request";

  return (
    <div
      onClick={onToggle}
      className={`rounded-xl border overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? "border-[var(--circa-gold)] bg-[var(--circa-surface)] ring-1 ring-[var(--circa-gold)]/30"
          : "border-[var(--circa-border)] bg-[var(--circa-surface)] hover:border-[var(--circa-border-active)]"
      }`}
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        {property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={property.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const fallbacks = [
                "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=500&fit=crop",
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=500&fit=crop",
                "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop",
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
                "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop",
                "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop",
                "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&h=500&fit=crop",
                "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=500&fit=crop",
              ];
              const idx = property.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % fallbacks.length;
              (e.target as HTMLImageElement).src = fallbacks[idx];
            }}
          />
        ) : (
          <img
            src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=500&fit=crop"
            alt={property.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* Selection indicator */}
        <div className={`absolute top-3 left-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          isSelected
            ? "bg-[var(--circa-gold)] border-[var(--circa-gold)]"
            : "border-white/40 bg-black/30 backdrop-blur-sm"
        }`}>
          {isSelected && (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--circa-dark)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>

        {/* Category badge */}
        <div className="absolute top-3 right-3 bg-[var(--circa-dark)]/80 backdrop-blur-sm text-[var(--circa-gold)] text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full border border-[var(--circa-border-active)]">
          {property.category}
        </div>

        {/* Status badge */}
        {property.status && property.status !== "Available" && (
          <div className="absolute bottom-3 left-3 bg-emerald-500/90 text-white text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full">
            {property.status}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--circa-gold)]" style={{ fontFamily: "var(--font-display)" }}>
              {property.name}
            </h3>
            <p className="text-[11px] text-[var(--circa-text-dim)] mt-0.5">{property.location}</p>
          </div>
          <span className="text-[14px] font-semibold text-[var(--circa-text)]">{price}</span>
        </div>

        <div className="flex items-center gap-3 mt-3 text-[12px] text-[var(--circa-text-muted)]">
          {property.bedrooms && (
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v9" />
              </svg>
              {property.bedrooms} bed
            </span>
          )}
          {property.bathrooms && <span>{property.bathrooms} bath</span>}
          {property.constructionSize && <span>{property.constructionSize} m²</span>}
          {property.lotSize && <span>{property.lotSize} m² lot</span>}
        </div>

        {property.amenities && (
          <div className="flex flex-wrap gap-1 mt-3">
            {property.amenities.split(",").slice(0, 3).map((a) => (
              <span key={a} className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--circa-border)] text-[var(--circa-text-dim)]">
                {a.trim()}
              </span>
            ))}
            {property.amenities.split(",").length > 3 && (
              <span className="text-[10px] px-2 py-0.5 text-[var(--circa-text-dim)]">
                +{property.amenities.split(",").length - 3}
              </span>
            )}
          </div>
        )}

        {property.roiEstimate && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ROI {property.roiEstimate}
            </span>
            {property.totalUnits && (
              <span className="text-[10px] text-[var(--circa-text-dim)]">{property.totalUnits} units</span>
            )}
          </div>
        )}

        {property.notes && (
          <p className="text-[11px] text-[var(--circa-text-dim)] mt-2 italic">{property.notes}</p>
        )}
      </div>
    </div>
  );
}
