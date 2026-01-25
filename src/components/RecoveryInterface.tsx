'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { 
  PatternVisibility, 
  ClinicalInsight, 
  RiskLevel,
  Calibration 
} from '@/lib/rose-glass-recovery';
import { CALIBRATIONS } from '@/lib/rose-glass-recovery';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  visibility?: PatternVisibility;
  insight?: ClinicalInsight;
  metrics?: {
    responseTime: number;
    inputTokens: number;
    outputTokens: number;
  };
}

interface DimensionBarProps {
  label: string;
  value: number;
  color: string;
}

function DimensionBar({ label, value, color }: DimensionBarProps) {
  const percentage = Math.round(value * 100);
  const filled = Math.round(value * 10);
  const empty = 10 - filled;
  
  return (
    <div className="flex items-center gap-2 text-sm font-mono">
      <span className="w-4 text-gray-400">{label}</span>
      <div className="flex gap-0.5">
        {Array(filled).fill(0).map((_, i) => (
          <div key={`f-${i}`} className={`w-2 h-4 ${color} rounded-sm`} />
        ))}
        {Array(empty).fill(0).map((_, i) => (
          <div key={`e-${i}`} className="w-2 h-4 bg-gray-200 rounded-sm" />
        ))}
      </div>
      <span className="w-10 text-right text-gray-600">{value.toFixed(2)}</span>
    </div>
  );
}

function getRiskColor(risk: RiskLevel): string {
  switch (risk) {
    case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
    case 'concern': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'watch': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    default: return 'bg-green-100 text-green-800 border-green-300';
  }
}

function getRiskLabel(risk: RiskLevel): string {
  return risk.toUpperCase();
}

export default function RecoveryInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [calibration, setCalibration] = useState<string>('trauma_informed');
  const [currentVisibility, setCurrentVisibility] = useState<PatternVisibility | null>(null);
  const [currentInsight, setCurrentInsight] = useState<ClinicalInsight | null>(null);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput('');
    
    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    
    // Build conversation history
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    
    try {
      const response = await fetch('/api/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          calibration,
          conversationHistory: history,
        }),
      });
      
      const data = await response.json();
      
      if (data.response) {
        const assistantMsg: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          visibility: data.visibility,
          insight: data.insight,
          metrics: data.metrics,
        };
        
        setMessages((prev) => [...prev, assistantMsg]);
        setCurrentVisibility(data.visibility);
        setCurrentInsight(data.insight);
      }
    } catch (error) {
      console.error('Recovery API error:', error);
      setMessages((prev) => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: 'Error: Failed to get response',
        timestamp: new Date(),
      }]);
    }
    
    setLoading(false);
    inputRef.current?.focus();
  }, [input, loading, messages, calibration]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const resetSession = () => {
    setMessages([]);
    setCurrentVisibility(null);
    setCurrentInsight(null);
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-700 to-teal-600 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">🌹</span>
              Rose Glass Recovery
            </h1>
            <p className="text-emerald-200 text-sm mt-1">
              Translation framework for addiction counseling
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={calibration}
              onChange={(e) => setCalibration(e.target.value)}
              className="bg-emerald-800 text-white px-3 py-2 rounded text-sm border border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {Object.keys(CALIBRATIONS).map((key) => (
                <option key={key} value={key}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </option>
              ))}
            </select>
            <span className="text-xs font-mono bg-emerald-800 px-3 py-1 rounded">
              Session: {sessionId.slice(0, 8)}
            </span>
            <button
              onClick={resetSession}
              className="bg-emerald-800 hover:bg-emerald-900 px-4 py-2 rounded text-sm font-medium transition"
            >
              New Session
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col border-r bg-white">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-gray-400 text-center mt-8">
                <p className="text-lg mb-2">Welcome to Rose Glass Recovery</p>
                <p className="text-sm">
                  This interface translates communication patterns to support counselor intuition.
                </p>
                <p className="text-sm mt-4 text-emerald-600">
                  &quot;Coherence is constructed, not discovered.&quot;
                </p>
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
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
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
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={2}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
        
        {/* Insights Panel */}
        <div className="w-80 bg-gray-50 overflow-y-auto p-4 space-y-4">
          <h2 className="font-semibold text-gray-700 text-lg border-b pb-2">
            Pattern Visibility
          </h2>
          
          {currentVisibility ? (
            <>
              {/* Dimension Bars */}
              <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
                <DimensionBar label="Ψ" value={currentVisibility.psi} color="bg-blue-500" />
                <DimensionBar label="ρ" value={currentVisibility.rho} color="bg-purple-500" />
                <DimensionBar label="q" value={currentVisibility.q} color="bg-orange-500" />
                <DimensionBar label="f" value={currentVisibility.f} color="bg-green-500" />
                <DimensionBar label="τ" value={currentVisibility.tau} color="bg-cyan-500" />
              </div>
              
              {/* Coherence */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Coherence</div>
                <div className="text-2xl font-mono font-bold text-gray-800">
                  {currentVisibility.coherence.toFixed(2)}
                </div>
              </div>
              
              {/* Markers */}
              {(currentVisibility.isolationMarkers.length > 0 || currentVisibility.activationTriggers.length > 0) && (
                <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
                  {currentVisibility.isolationMarkers.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Isolation Markers
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {currentVisibility.isolationMarkers.map((marker, i) => (
                          <span key={i} className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">
                            {marker}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {currentVisibility.activationTriggers.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Activation Topics
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {currentVisibility.activationTriggers.map((trigger, i) => (
                          <span key={i} className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs">
                            {trigger}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-400 text-sm text-center py-4">
              No patterns analyzed yet
            </div>
          )}
          
          <h2 className="font-semibold text-gray-700 text-lg border-b pb-2 pt-4">
            Clinical Insight
          </h2>
          
          {currentInsight ? (
            <>
              {/* Risk Level */}
              <div className={`rounded-lg p-3 border ${getRiskColor(currentInsight.riskLevel)}`}>
                <div className="text-xs uppercase tracking-wide opacity-75 mb-1">Risk Pattern</div>
                <div className="font-bold text-lg">{getRiskLabel(currentInsight.riskLevel)}</div>
              </div>
              
              {/* Summary */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Summary</div>
                <p className="text-sm text-gray-700">{currentInsight.summary}</p>
              </div>
              
              {/* Dimension Notes */}
              {Object.keys(currentInsight.dimensionNotes).length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    Dimension Notes
                  </div>
                  <div className="space-y-2 text-sm">
                    {Object.entries(currentInsight.dimensionNotes).map(([dim, note]) => (
                      <div key={dim}>
                        <span className="font-medium text-gray-600">{dim}:</span>
                        <span className="text-gray-700 ml-1">{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Considerations */}
              {currentInsight.considerations.length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    Considerations
                  </div>
                  <ul className="space-y-1">
                    {currentInsight.considerations.map((c, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-emerald-600">→</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Confidence */}
              <div className="text-xs text-gray-400 text-center">
                Translation confidence: {(currentInsight.confidence * 100).toFixed(0)}%
              </div>
            </>
          ) : (
            <div className="text-gray-400 text-sm text-center py-4">
              No insights generated yet
            </div>
          )}
          
          {/* Disclaimer */}
          <div className="mt-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
            <strong>Note:</strong> This is a translation layer, not a diagnostic tool. 
            Patterns are meant to validate counselor intuition, not replace clinical judgment.
          </div>
        </div>
      </div>
    </div>
  );
}
