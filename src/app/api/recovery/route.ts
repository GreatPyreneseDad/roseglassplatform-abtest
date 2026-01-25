import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { 
  RECOVERY_SYSTEM_PROMPT,
  analyzeStatement,
  getClinicalInsight,
  CALIBRATIONS,
  type Calibration,
} from '@/lib/rose-glass-recovery';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, calibration = 'trauma_informed', conversationHistory = [] } = body;
    
    if (!message) {
      return Response.json({ error: 'Message required' }, { status: 400 });
    }
    
    // Get calibration parameters
    const calibrationParams: Calibration = CALIBRATIONS[calibration] || CALIBRATIONS.trauma_informed;
    
    // Analyze the user's message for pattern visibility
    const visibility = analyzeStatement(message, calibrationParams);
    const insight = getClinicalInsight(visibility);
    
    // Build context hints based on analysis
    let contextHints = '\n\n[PATTERN CONTEXT FOR RESPONSE]:\n';
    
    if (visibility.f < 0.3) {
      contextHints += '- Isolation language detected. Lead with connection.\n';
    }
    
    if (visibility.q > 0.7) {
      contextHints += '- High emotional activation. Ground before exploring.\n';
    }
    
    if (visibility.authenticityScore < 0.5) {
      contextHints += '- Possible performance patterns. Create safety for authenticity.\n';
    }
    
    if (visibility.tau < 0.3) {
      contextHints += '- Present-crisis focus. Stay grounded in the moment.\n';
    }
    
    if (visibility.psi < 0.5) {
      contextHints += '- Narrative fragmentation. Explore gently without challenging.\n';
    }
    
    if (insight.riskLevel === 'urgent' || insight.riskLevel === 'concern') {
      contextHints += `- Risk pattern: ${insight.riskLevel.toUpperCase()}. Prioritize safety and connection.\n`;
    }
    
    const systemPrompt = RECOVERY_SYSTEM_PROMPT + contextHints;
    
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
    
    // Track timing
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
      visibility,
      insight,
      calibration,
      metrics: {
        responseTime,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        timestamp: new Date().toISOString(),
      },
    });
    
  } catch (error) {
    console.error('Recovery API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
