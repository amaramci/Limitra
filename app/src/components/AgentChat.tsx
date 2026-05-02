"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, SubWallet, ToolCallRecord } from "@/lib/types";
import { loadTransactions } from "@/lib/storage";
import {
  Send,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface Props {
  wallet: SubWallet;
}

const SUGGESTED_PROMPTS = [
  "What's your current strategy and what can you trade?",
  "Check my daily limit and portfolio",
  "Analyze performance for the last 7 days",
  "Execute a $50 SOL buy on Jupiter",
  "Should I change your spending limits?",
  "What trades have you blocked recently?",
];

function ToolCallBadge({ call }: { call: ToolCallRecord }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`mt-2 rounded-lg border text-xs overflow-hidden ${call.blocked ? "border-red-500/30 bg-red-500/5" : "border-surface-500 bg-surface-700"}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-surface-600 transition-colors"
      >
        {call.blocked ? (
          <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />
        ) : (
          <CheckCircle size={12} className="text-brand-400 flex-shrink-0" />
        )}
        <span className={`font-mono ${call.blocked ? "text-red-400" : "text-gray-300"}`}>
          {call.name}
        </span>
        {call.blocked && (
          <span className="text-red-400 font-medium">BLOCKED</span>
        )}
        <span className="ml-auto text-gray-500">
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {call.blocked && call.blockedReason && (
            <div className="text-red-400 bg-red-500/10 rounded p-2">
              {call.blockedReason}
            </div>
          )}
          <div>
            <div className="text-gray-500 mb-1">Input</div>
            <pre className="text-gray-300 bg-surface-800 rounded p-2 overflow-x-auto whitespace-pre-wrap text-xs">
              {JSON.stringify(call.input, null, 2)}
            </pre>
          </div>
          {!call.blocked && call.output != null && (
            <div>
              <div className="text-gray-500 mb-1">Output</div>
              <pre className="text-brand-300 bg-surface-800 rounded p-2 overflow-x-auto whitespace-pre-wrap text-xs">
                {JSON.stringify(call.output as Record<string, unknown>, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AgentChat({ wallet }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet,
          transactions: loadTransactions(wallet.id),
          messages: nextMessages,
        }),
      });
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.text || "No response",
        timestamp: Date.now(),
        toolCalls: data.toolCalls,
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Error: failed to reach the agent.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Suggested prompts (only before any messages) */}
      {messages.length === 0 && (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Bot size={14} className="text-brand-400" />
            <span>Try asking {wallet.name}:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-xs text-gray-300 bg-surface-700 hover:bg-surface-600 border border-surface-500 px-3 py-1.5 rounded-xl transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={13} className="text-brand-400" />
              </div>
            )}
            <div className={`max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-brand-500/20 text-white border border-brand-500/30 rounded-br-sm"
                    : "bg-surface-700 text-gray-100 border border-surface-600 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="w-full space-y-1">
                  {msg.toolCalls.map((tc, j) => (
                    <ToolCallBadge key={j} call={tc} />
                  ))}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-surface-600 border border-surface-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={13} className="text-gray-300" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center flex-shrink-0">
              <Bot size={13} className="text-brand-400" />
            </div>
            <div className="bg-surface-700 border border-surface-600 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="text-brand-400 animate-spin" />
              <span className="text-gray-400 text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-surface-700">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${wallet.name}…`}
            disabled={loading}
            className="flex-1 bg-surface-700 border border-surface-500 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-xl transition-colors flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
