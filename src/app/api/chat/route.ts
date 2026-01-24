import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { 
  ROSE_GLASS_SYSTEM_PROMPT, 
  STANDARD_SYSTEM_PROMPT,
  analyzeInputContext,
  buildContextHints 
} from '@/lib/rose-glass';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, mode, conversationHistory = [] } = body;
    
    if (!message) {
      return Response.json({ error: 'Message required' }, { status: 400 });
    }
    
    if (!mode || !['roseglass', 'standard'].includes(mode)) {
      return Response.json({ error: 'Mode must be "roseglass" or "standard"' }, { status: 400 });
    }
    
    // Build the system prompt based on mode
    let systemPrompt: string;
    
    if (mode === 'roseglass') {
      // Rose Glass mode: full perceptual framework injection
      const analysis = analyzeInputContext(message);
      const contextHints = buildContextHints(analysis);
      systemPrompt = ROSE_GLASS_SYSTEM_PROMPT + contextHints;
    } else {
      // Standard mode: minimal system prompt
      systemPrompt = STANDARD_SYSTEM_PROMPT;
    }
    
    // Build messages array with conversation history
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ];
    
    // Track timing for metrics
    const startTime = Date.now();
    
    // Make the API call
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Extract text content
    const textContent = response.content.find(block => block.type === 'text');
    const responseText = textContent?.type === 'text' ? textContent.text : '';
    
    return Response.json({
      response: responseText,
      mode,
      metrics: {
        responseTime,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        timestamp: new Date().toISOString(),
      },
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
