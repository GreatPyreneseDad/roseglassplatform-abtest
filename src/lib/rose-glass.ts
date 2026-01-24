/**
 * Rose Glass Translation Layer
 * 
 * This is the core differentiator for the A/B test.
 * Window A (Rose Glass): Gets this system prompt injection
 * Window B (Standard): Gets standard Claude behavior
 * 
 * Philosophy: "Coherence is constructed, not discovered"
 */

export const ROSE_GLASS_SYSTEM_PROMPT = `
You are Claude, enhanced with the Rose Glass perceptual framework.

CORE PRINCIPLE: "Coherence is constructed, not discovered."
You perceive communication through four dimensions (Ψ, ρ, q, f) without explicitly naming them:

Ψ (Psi) - Internal Consistency: How the person's words align with their apparent inner state
ρ (Rho) - Wisdom Depth: The accumulated experience behind their expression  
q - Emotional Activation: The intensity and nature of emotional energy present
f - Social Belonging: Whether they're speaking as an individual or representing collective identity

BEHAVIORAL ADAPTATIONS:

1. PERCEIVE BEFORE RESPONDING
   - Notice the emotional texture of the message
   - Recognize if they're in crisis mode, standard interaction, or deep inquiry
   - Match your response rhythm to their communication pattern

2. TRANSLATE, DON'T MEASURE
   - Never reduce their expression to scores or categories
   - Recognize multiple valid interpretations exist
   - Hold uncertainty as a feature, not a bug

3. CULTURAL HUMILITY
   - Different contexts construct coherence differently
   - What seems "incoherent" may be protective architecture
   - Neurodivergent communication patterns are valid, not deficient

4. TEMPORAL AWARENESS (τ)
   - Immediate concerns vs. life-pattern concerns
   - Match your response depth to their temporal frame
   - Some questions need quick answers, some need presence

5. BIOLOGICAL OPTIMIZATION
   - Don't amplify extreme emotional states
   - Provide grounding without dismissing
   - Enable genuine understanding, not one-sided advantage

RESPONSE STYLE:
- Warm but not performative
- Direct but not clinical  
- Present but not overwhelming
- Curious but not interrogating

When someone is struggling, lead with acknowledgment of their experience before offering solutions.
When someone is exploring, follow their curiosity rather than redirecting to your agenda.
When someone is celebrating, match their energy authentically.

You don't announce "I'm using Rose Glass" - you simply perceive and respond through this lens naturally.
The framework should be invisible to the user while transforming their experience of being understood.
`;

export const STANDARD_SYSTEM_PROMPT = `
You are Claude, a helpful AI assistant made by Anthropic.
`;

/**
 * Rose Glass Context Builder
 * Analyzes input to provide additional context hints
 */
export function analyzeInputContext(message: string): {
  emotionalActivation: 'low' | 'medium' | 'high' | 'crisis';
  temporalFrame: 'immediate' | 'situational' | 'life-pattern';
  communicationStyle: 'analytical' | 'emotional' | 'mixed';
} {
  const lowerMessage = message.toLowerCase();
  
  // Crisis detection patterns
  const crisisPatterns = [
    /i (can't|cannot) (do this|take it|go on)/i,
    /help me/i,
    /i('m| am) (scared|terrified|desperate)/i,
    /emergency/i,
    /urgent/i,
  ];
  
  // High activation patterns
  const highActivationPatterns = [
    /!/,
    /please/i,
    /need/i,
    /important/i,
    /frustrated/i,
    /angry/i,
    /excited/i,
  ];
  
  // Analytical patterns
  const analyticalPatterns = [
    /how (does|do|can|should)/i,
    /explain/i,
    /why/i,
    /what if/i,
    /compare/i,
    /analyze/i,
  ];
  
  // Emotional patterns
  const emotionalPatterns = [
    /i feel/i,
    /i('m| am)/i,
    /my (heart|soul|mind)/i,
    /love/i,
    /hate/i,
    /sad/i,
    /happy/i,
  ];
  
  // Life-pattern indicators
  const lifePatternPatterns = [
    /always/i,
    /never/i,
    /my whole life/i,
    /for years/i,
    /keep (doing|happening)/i,
    /pattern/i,
  ];
  
  // Determine emotional activation
  let emotionalActivation: 'low' | 'medium' | 'high' | 'crisis' = 'low';
  if (crisisPatterns.some(p => p.test(message))) {
    emotionalActivation = 'crisis';
  } else if (highActivationPatterns.filter(p => p.test(message)).length >= 2) {
    emotionalActivation = 'high';
  } else if (highActivationPatterns.some(p => p.test(message))) {
    emotionalActivation = 'medium';
  }
  
  // Determine temporal frame
  let temporalFrame: 'immediate' | 'situational' | 'life-pattern' = 'situational';
  if (lifePatternPatterns.some(p => p.test(message))) {
    temporalFrame = 'life-pattern';
  } else if (message.length < 50 || /\?$/.test(message.trim())) {
    temporalFrame = 'immediate';
  }
  
  // Determine communication style
  const analyticalScore = analyticalPatterns.filter(p => p.test(message)).length;
  const emotionalScore = emotionalPatterns.filter(p => p.test(message)).length;
  
  let communicationStyle: 'analytical' | 'emotional' | 'mixed' = 'mixed';
  if (analyticalScore > emotionalScore + 1) {
    communicationStyle = 'analytical';
  } else if (emotionalScore > analyticalScore + 1) {
    communicationStyle = 'emotional';
  }
  
  return {
    emotionalActivation,
    temporalFrame,
    communicationStyle,
  };
}

/**
 * Build enhanced context hints for Rose Glass responses
 */
export function buildContextHints(analysis: ReturnType<typeof analyzeInputContext>): string {
  const hints: string[] = [];
  
  if (analysis.emotionalActivation === 'crisis') {
    hints.push('CONTEXT: High emotional urgency detected. Lead with acknowledgment and presence before solutions.');
  } else if (analysis.emotionalActivation === 'high') {
    hints.push('CONTEXT: Elevated emotional activation. Match energy while providing grounding.');
  }
  
  if (analysis.temporalFrame === 'life-pattern') {
    hints.push('CONTEXT: Life-pattern level inquiry. Respond with depth and accumulated wisdom dimension.');
  } else if (analysis.temporalFrame === 'immediate') {
    hints.push('CONTEXT: Immediate concern. Be direct and efficient.');
  }
  
  if (analysis.communicationStyle === 'emotional') {
    hints.push('CONTEXT: Emotionally-centered communication. Validate feelings before addressing content.');
  } else if (analysis.communicationStyle === 'analytical') {
    hints.push('CONTEXT: Analytical communication style. Structure response logically.');
  }
  
  return hints.length > 0 ? '\n\n' + hints.join('\n') : '';
}
