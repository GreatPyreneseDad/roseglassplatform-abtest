'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metrics?: {
    responseTime: number;
    inputTokens: number;
    outputTokens: number;
  };
}

interface ChatWindowProps {
  title: string;
  messages: Message[];
  isLoading: boolean;
  label: string;
  color: string;
}

function ChatWindow({ title, messages, isLoading, label, color }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white shadow-lg">
      {/* Header */}
      <div className={`px-4 py-3 ${color} text-white font-semibold flex items-center justify-between`}>
        <span>{title}</span>
        <span className="text-xs opacity-75 font-mono">{label}</span>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-gray-400 text-center mt-8">
            Waiting for input...
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.metrics && (
                <div className="mt-2 text-xs opacity-60 font-mono">
                  {msg.metrics.responseTime}ms • {msg.metrics.outputTokens} tokens
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

interface MetricsSummary {
  sessionId: string;
  windowA: {
    totalMessages: number;
    avgResponseTime: number;
    totalTokens: number;
  };
  windowB: {
    totalMessages: number;
    avgResponseTime: number;
    totalTokens: number;
  };
}

export default function DualChatInterface() {
  const [input, setInput] = useState('');
  const [messagesA, setMessagesA] = useState<Message[]>([]);
  const [messagesB, setMessagesB] = useState<Message[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [blindMode, setBlindMode] = useState(true);
  const [windowAssignments, setWindowAssignments] = useState<{ A: string; B: string }>(() => {
    // Randomly assign which window gets Rose Glass
    const isAGlass = Math.random() > 0.5;
    return {
      A: isAGlass ? 'roseglass' : 'standard',
      B: isAGlass ? 'standard' : 'roseglass',
    };
  });
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const [metrics, setMetrics] = useState<MetricsSummary>({
    sessionId,
    windowA: { totalMessages: 0, avgResponseTime: 0, totalTokens: 0 },
    windowB: { totalMessages: 0, avgResponseTime: 0, totalTokens: 0 },
  });
  
  const sendMessage = useCallback(async () => {
    if (!input.trim() || loadingA || loadingB) return;
    
    const userMessage = input.trim();
    setInput('');
    
    const userMsgId = uuidv4();
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    
    // Add user message to both windows
    setMessagesA((prev) => [...prev, userMsg]);
    setMessagesB((prev) => [...prev, userMsg]);
    
    setLoadingA(true);
    setLoadingB(true);
    
    // Build conversation history for context
    const historyA = messagesA.map((m) => ({ role: m.role, content: m.content }));
    const historyB = messagesB.map((m) => ({ role: m.role, content: m.content }));
    
    // Send to both APIs in parallel
    const [responseA, responseB] = await Promise.allSettled([
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          mode: windowAssignments.A,
          conversationHistory: historyA,
        }),
      }).then((r) => r.json()),
      
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          mode: windowAssignments.B,
          conversationHistory: historyB,
        }),
      }).then((r) => r.json()),
    ]);
    
    // Handle Window A response
    if (responseA.status === 'fulfilled' && responseA.value.response) {
      const assistantMsgA: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: responseA.value.response,
        timestamp: new Date(),
        metrics: responseA.value.metrics,
      };
      setMessagesA((prev) => [...prev, assistantMsgA]);
      
      // Update metrics
      setMetrics((prev) => ({
        ...prev,
        windowA: {
          totalMessages: prev.windowA.totalMessages + 1,
          avgResponseTime:
            (prev.windowA.avgResponseTime * prev.windowA.totalMessages +
              responseA.value.metrics.responseTime) /
            (prev.windowA.totalMessages + 1),
          totalTokens: prev.windowA.totalTokens + responseA.value.metrics.totalTokens,
        },
      }));
    } else {
      const errorMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Error: Failed to get response',
        timestamp: new Date(),
      };
      setMessagesA((prev) => [...prev, errorMsg]);
    }
    setLoadingA(false);
    
    // Handle Window B response
    if (responseB.status === 'fulfilled' && responseB.value.response) {
      const assistantMsgB: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: responseB.value.response,
        timestamp: new Date(),
        metrics: responseB.value.metrics,
      };
      setMessagesB((prev) => [...prev, assistantMsgB]);
      
      // Update metrics
      setMetrics((prev) => ({
        ...prev,
        windowB: {
          totalMessages: prev.windowB.totalMessages + 1,
          avgResponseTime:
            (prev.windowB.avgResponseTime * prev.windowB.totalMessages +
              responseB.value.metrics.responseTime) /
            (prev.windowB.totalMessages + 1),
          totalTokens: prev.windowB.totalTokens + responseB.value.metrics.totalTokens,
        },
      }));
    } else {
      const errorMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Error: Failed to get response',
        timestamp: new Date(),
      };
      setMessagesB((prev) => [...prev, errorMsg]);
    }
    setLoadingB(false);
    
    // Focus back on input
    inputRef.current?.focus();
  }, [input, loadingA, loadingB, messagesA, messagesB, windowAssignments]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const resetSession = () => {
    setMessagesA([]);
    setMessagesB([]);
    setMetrics({
      sessionId: uuidv4(),
      windowA: { totalMessages: 0, avgResponseTime: 0, totalTokens: 0 },
      windowB: { totalMessages: 0, avgResponseTime: 0, totalTokens: 0 },
    });
    // Re-randomize assignments
    const isAGlass = Math.random() > 0.5;
    setWindowAssignments({
      A: isAGlass ? 'roseglass' : 'standard',
      B: isAGlass ? 'standard' : 'roseglass',
    });
  };
  
  const revealAssignments = () => {
    setBlindMode(false);
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-rose-600 to-pink-600 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Rose Glass A/B Testing Platform</h1>
            <p className="text-rose-200 text-sm mt-1">
              {blindMode ? 'Blind comparison mode active' : 'Assignments revealed'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-mono bg-rose-800 px-3 py-1 rounded">
              Session: {sessionId.slice(0, 8)}
            </span>
            <button
              onClick={resetSession}
              className="bg-rose-700 hover:bg-rose-800 px-4 py-2 rounded text-sm font-medium transition"
            >
              New Session
            </button>
            {blindMode && (
              <button
                onClick={revealAssignments}
                className="bg-white text-rose-600 hover:bg-rose-50 px-4 py-2 rounded text-sm font-medium transition"
              >
                Reveal
              </button>
            )}
          </div>
        </div>
      </header>
      
      {/* Metrics Bar */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between text-sm">
        <div className="flex space-x-8">
          <div>
            <span className="text-gray-500">Window A:</span>{' '}
            <span className="font-mono">
              {metrics.windowA.avgResponseTime.toFixed(0)}ms avg
            </span>
            {!blindMode && (
              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                windowAssignments.A === 'roseglass' 
                  ? 'bg-rose-100 text-rose-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {windowAssignments.A === 'roseglass' ? '🌹 Rose Glass' : '📊 Standard'}
              </span>
            )}
          </div>
          <div>
            <span className="text-gray-500">Window B:</span>{' '}
            <span className="font-mono">
              {metrics.windowB.avgResponseTime.toFixed(0)}ms avg
            </span>
            {!blindMode && (
              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                windowAssignments.B === 'roseglass' 
                  ? 'bg-rose-100 text-rose-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {windowAssignments.B === 'roseglass' ? '🌹 Rose Glass' : '📊 Standard'}
              </span>
            )}
          </div>
        </div>
        <div className="text-gray-500">
          Total exchanges: {metrics.windowA.totalMessages}
        </div>
      </div>
      
      {/* Dual Chat Windows */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        <div className="flex-1 min-w-0">
          <ChatWindow
            title="Window A"
            messages={messagesA}
            isLoading={loadingA}
            label={blindMode ? '???' : (windowAssignments.A === 'roseglass' ? 'ROSE GLASS' : 'STANDARD')}
            color={blindMode ? 'bg-gray-600' : (windowAssignments.A === 'roseglass' ? 'bg-rose-600' : 'bg-slate-600')}
          />
        </div>
        <div className="flex-1 min-w-0">
          <ChatWindow
            title="Window B"
            messages={messagesB}
            isLoading={loadingB}
            label={blindMode ? '???' : (windowAssignments.B === 'roseglass' ? 'ROSE GLASS' : 'STANDARD')}
            color={blindMode ? 'bg-gray-600' : (windowAssignments.B === 'roseglass' ? 'bg-rose-600' : 'bg-slate-600')}
          />
        </div>
      </div>
      
      {/* Input Area */}
      <div className="bg-white border-t px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-4">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message to send to both windows..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            rows={2}
            disabled={loadingA || loadingB}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loadingA || loadingB}
            className="bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition"
          >
            Send
          </button>
        </div>
        <p className="text-center text-gray-400 text-xs mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
