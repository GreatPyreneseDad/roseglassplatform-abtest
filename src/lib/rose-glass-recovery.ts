/**
 * Rose Glass Recovery: Translation Framework for Addiction Counseling
 * ===================================================================
 * 
 * Translates communication patterns into visible dimensions that validate
 * counselor intuition—without judgment, without measurement, with full 
 * respect for the dignity of every person in recovery.
 * 
 * Ported from Python implementation by Christopher MacGregor bin Joseph
 * Philosophy: "Coherence is constructed, not discovered"
 */

import { ROSE_GLASS_SYSTEM_PROMPT } from './rose-glass';

// ============================================================================
// TYPES
// ============================================================================

export type RiskLevel = 'stable' | 'watch' | 'concern' | 'urgent';
export type TrendDirection = 'rising' | 'stable' | 'declining';

export interface PatternVisibility {
  psi: number;      // Internal consistency (0-1)
  rho: number;      // Wisdom integration (0-1)
  q: number;        // Emotional activation (0-1)
  f: number;        // Social belonging (0-1)
  tau: number;      // Temporal depth (0-1)
  authenticityScore: number;
  isolationMarkers: string[];
  activationTriggers: string[];
  coherence: number;
}

export interface ClinicalInsight {
  summary: string;
  dimensionNotes: Record<string, string>;
  patternShifts: string[];
  considerations: string[];
  riskLevel: RiskLevel;
  confidence: number;
}

export interface Calibration {
  km: number;         // Michaelis-Menten saturation constant
  ki: number;         // Inhibition constant
  fWeight: number;    // Social belonging weight
  psiTolerance: number; // Inconsistency tolerance
}

export interface SessionTrajectory {
  fTrend: TrendDirection;
  qTrend: TrendDirection;
  psiTrend: TrendDirection;
  isolationMarkers: string[];
  activationTopics: string[];
  estimatedWindow: string | null;
  interventionRecommended: boolean;
  interventionReason: string | null;
}

// ============================================================================
// PATTERN MARKERS (Regex arrays)
// ============================================================================

const ISOLATION_MARKERS = [
  /\b(alone|lonely|isolated|nobody|no one|by myself)\b/i,
  /\b(don't understand|doesn't get it|can't relate)\b/i,
  /\b(on my own|all by myself|just me)\b/i,
  /\b(no friends|lost .* friends|pushed .* away)\b/i,
];

const CONNECTION_MARKERS = [
  /\b(we|us|our|together)\b/i,
  /\b(sponsor|group|meeting|fellowship)\b/i,
  /\b(support|helped|supporting)\b/i,
  /\b(family|friend|partner|community)\b/i,
];

const ACTIVATION_TRIGGERS: [RegExp, string][] = [
  [/\b(work|job|boss|employment|fired|unemployed)\b/i, 'employment'],
  [/\b(family|parent|mother|father|sibling|child)\b/i, 'family'],
  [/\b(relationship|partner|spouse|divorce|breakup)\b/i, 'relationship'],
  [/\b(money|debt|bills|rent|mortgage|financial)\b/i, 'financial'],
  [/\b(health|sick|pain|doctor|hospital)\b/i, 'health'],
  [/\b(trauma|abuse|assault|violence)\b/i, 'trauma'],
];

const CONTRADICTION_PATTERNS: [RegExp, RegExp][] = [
  [/i'm fine/i, /but|however|except|although/i],
  [/under control/i, /can't|struggling|hard/i],
  [/don't need/i, /maybe|sometimes|probably/i],
  [/doing great/i, /but|except|although|however/i],
];

const PAST_INTEGRATION = [
  /\b(learned|realized|understood|remember when)\b/i,
  /\b(used to|back then|in the past|years ago)\b/i,
  /\b(pattern|cycle|always|every time)\b/i,
];

const PRESENT_CRISIS = [
  /\b(right now|today|tonight|this moment)\b/i,
  /\b(need|want|have to|must)\b/i,
  /\b(can't wait|immediately|urgent)\b/i,
];

const DENIAL_PATTERNS = [
  /\b(fine|okay|good|great|perfect)\b.*\b(really|totally|completely)\b/i,
  /\bdon't need\b/i,
  /\bunder control\b/i,
];

// ============================================================================
// CALIBRATIONS
// ============================================================================

export const CALIBRATIONS: Record<string, Calibration> = {
  trauma_informed: {
    km: 0.25,           // Lower saturation - expect activation
    ki: 1.5,            // More inhibition - prevent overwhelming
    fWeight: 1.2,       // Social connection matters more
    psiTolerance: 0.3,  // Accept some inconsistency
  },
  autism_spectrum: {
    km: 0.35,
    ki: 2.5,
    fWeight: 0.8,       // Don't over-weight social
    psiTolerance: 0.1,  // Value logical consistency
  },
  adhd: {
    km: 0.2,
    ki: 1.2,
    fWeight: 1.0,
    psiTolerance: 0.5,  // Accept topic shifts
  },
  veteran: {
    km: 0.3,
    ki: 2.0,
    fWeight: 1.1,
    psiTolerance: 0.2,  // Value directness
  },
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Biological optimization using Michaelis-Menten kinetics
 * Prevents extreme readings while preserving signal
 */
export function optimizeQ(qRaw: number, km: number = 0.3, ki: number = 2.0): number {
  if (qRaw <= 0) return 0;
  return qRaw / (km + qRaw + (qRaw ** 2 / ki));
}

/**
 * Calculate overall pattern coherence through recovery lens
 */
export function calculateCoherence(psi: number, rho: number, q: number, f: number): number {
  const optimizedQ = optimizeQ(q);
  return (psi + rho * psi + optimizedQ + f * psi) / 4;
}

/**
 * Count regex matches in text
 */
function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => {
    const matches = text.match(new RegExp(pattern, 'gi'));
    return count + (matches ? matches.length : 0);
  }, 0);
}

/**
 * Extract all matches from text for a pattern array
 */
function extractMatches(text: string, patterns: RegExp[]): string[] {
  const matches: string[] = [];
  patterns.forEach(pattern => {
    const found = text.match(new RegExp(pattern, 'gi'));
    if (found) matches.push(...found);
  });
  return matches;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze a single statement for pattern visibility
 */
export function analyzeStatement(
  text: string,
  calibration: Calibration = CALIBRATIONS.trauma_informed
): PatternVisibility {
  const textLower = text.toLowerCase();
  
  // Calculate f-dimension (social belonging)
  const isolationCount = countMatches(textLower, ISOLATION_MARKERS);
  const connectionCount = countMatches(textLower, CONNECTION_MARKERS);
  
  const totalSocial = isolationCount + connectionCount;
  let f = totalSocial > 0 ? connectionCount / totalSocial : 0.5;
  
  // Apply f-weight from calibration
  f = Math.min(Math.max(f * calibration.fWeight, 0), 1);
  
  // Track isolation markers found
  const isolationMarkers = extractMatches(textLower, ISOLATION_MARKERS);
  
  // Calculate q-dimension (emotional activation)
  const activationTriggers: string[] = [];
  let activationScore = 0;
  
  ACTIVATION_TRIGGERS.forEach(([pattern, topic]) => {
    if (pattern.test(textLower)) {
      activationTriggers.push(topic);
      activationScore += 0.15;
    }
  });
  
  // Exclamation and intensity markers
  const exclamations = (text.match(/[!?]+/g) || []).length;
  const capsWords = (text.match(/\b[A-Z]{2,}\b/g) || []).length;
  const intensityMarkers = exclamations * 0.1 + capsWords * 0.05;
  
  let q = Math.min(0.3 + activationScore + intensityMarkers, 1.0);
  
  // Calculate psi-dimension (internal consistency)
  let contradictionScore = 0;
  CONTRADICTION_PATTERNS.forEach(([positive, negative]) => {
    if (positive.test(textLower) && negative.test(textLower)) {
      contradictionScore += 0.2;
    }
  });
  
  // Apply psi tolerance from calibration
  const psi = Math.max(0.8 - contradictionScore + calibration.psiTolerance * 0.1, 0.2);
  
  // Calculate rho-dimension (wisdom integration)
  const pastRefs = countMatches(textLower, PAST_INTEGRATION);
  const rho = Math.min(0.3 + pastRefs * 0.15, 1.0);
  
  // Calculate tau (temporal depth)
  const presentRefs = countMatches(textLower, PRESENT_CRISIS);
  let tau: number;
  
  if (pastRefs > presentRefs) {
    tau = Math.min(0.5 + pastRefs * 0.1, 1.0);
  } else if (presentRefs > pastRefs) {
    tau = Math.max(0.5 - presentRefs * 0.1, 0.1);
  } else {
    tau = 0.5;
  }
  
  // Calculate authenticity score
  const denialCount = DENIAL_PATTERNS.filter(p => p.test(textLower)).length;
  let authenticityScore: number;
  
  if (psi > 0.7 && q < 0.3 && denialCount > 0) {
    authenticityScore = 0.4;  // Possible performance
  } else if (psi < 0.5 && q > 0.6) {
    authenticityScore = 0.8;  // Struggling but authentic
  } else {
    authenticityScore = 0.6;
  }
  
  const coherence = calculateCoherence(psi, rho, q, f);
  
  return {
    psi,
    rho,
    q,
    f,
    tau,
    authenticityScore,
    isolationMarkers,
    activationTriggers,
    coherence,
  };
}

// ============================================================================
// CLINICAL INSIGHT GENERATION
// ============================================================================

/**
 * Generate clinical insight from pattern visibility
 * This is TRANSLATION, not diagnosis.
 */
export function getClinicalInsight(visibility: PatternVisibility): ClinicalInsight {
  const dimensionNotes: Record<string, string> = {};
  const patternShifts: string[] = [];
  const considerations: string[] = [];
  
  // Analyze f-dimension
  if (visibility.f < 0.3) {
    const markers = visibility.isolationMarkers.slice(0, 3).join(', ') || 'subtle markers';
    dimensionNotes['f (Social Belonging)'] = `Low (${visibility.f.toFixed(2)}) - Isolation language present: ${markers}`;
    patternShifts.push('Social connection may be weakening');
    considerations.push('Gentle inquiry about support system');
  } else if (visibility.f > 0.7) {
    dimensionNotes['f (Social Belonging)'] = `Strong (${visibility.f.toFixed(2)}) - Connection language active`;
  } else {
    dimensionNotes['f (Social Belonging)'] = `Moderate (${visibility.f.toFixed(2)})`;
  }
  
  // Analyze q-dimension
  if (visibility.q > 0.7) {
    const triggers = visibility.activationTriggers.join(', ') || 'general intensity';
    dimensionNotes['q (Emotional Activation)'] = `High (${visibility.q.toFixed(2)}) - Topics: ${triggers}`;
    patternShifts.push('Emotional activation elevated');
    considerations.push('Create space for processing without solving');
  } else if (visibility.q < 0.2) {
    dimensionNotes['q (Emotional Activation)'] = `Low (${visibility.q.toFixed(2)}) - May indicate suppression or stability`;
  } else {
    dimensionNotes['q (Emotional Activation)'] = `Moderate (${visibility.q.toFixed(2)})`;
  }
  
  // Analyze psi-dimension
  if (visibility.psi < 0.5) {
    dimensionNotes['Ψ (Consistency)'] = `Low (${visibility.psi.toFixed(2)}) - Possible contradictions in narrative`;
    patternShifts.push('Narrative consistency fragmented');
    considerations.push('Explore without challenging - may indicate internal conflict');
  } else {
    dimensionNotes['Ψ (Consistency)'] = `Stable (${visibility.psi.toFixed(2)})`;
  }
  
  // Analyze authenticity
  if (visibility.authenticityScore < 0.5) {
    dimensionNotes['Authenticity Pattern'] = `Performance indicators (${visibility.authenticityScore.toFixed(2)}) - Client may be presenting expected narrative`;
    considerations.push('Create safety for authentic expression');
  }
  
  // Analyze tau (temporal)
  if (visibility.tau < 0.3) {
    dimensionNotes['τ (Temporal)'] = `Present-focused (${visibility.tau.toFixed(2)}) - Living in immediate crisis`;
    considerations.push('Grounding before exploration');
  } else if (visibility.tau > 0.7) {
    dimensionNotes['τ (Temporal)'] = `Integrated (${visibility.tau.toFixed(2)}) - Connecting to broader timeline`;
  }
  
  // Determine risk pattern
  let riskScore = 0;
  if (visibility.f < 0.3) riskScore += 2;
  if (visibility.q > 0.7) riskScore += 1;
  if (visibility.psi < 0.5) riskScore += 1;
  if (visibility.authenticityScore < 0.5) riskScore += 1;
  
  let riskLevel: RiskLevel;
  if (riskScore >= 4) {
    riskLevel = 'urgent';
  } else if (riskScore >= 3) {
    riskLevel = 'concern';
  } else if (riskScore >= 2) {
    riskLevel = 'watch';
  } else {
    riskLevel = 'stable';
  }
  
  // Generate summary
  let summary: string;
  switch (riskLevel) {
    case 'urgent':
      summary = 'Multiple pattern indicators suggest client may be approaching crisis. Isolation language combined with narrative fragmentation and possible performance of recovery warrant close attention.';
      break;
    case 'concern':
      summary = 'Pattern shifts detected that may indicate increasing strain. Consider exploring underlying dynamics with care.';
      break;
    case 'watch':
      summary = 'Some pattern variations noted. Continue monitoring for trends.';
      break;
    default:
      summary = 'Patterns appear stable. Continue supportive engagement.';
  }
  
  return {
    summary,
    dimensionNotes,
    patternShifts,
    considerations,
    riskLevel,
    confidence: 0.7, // Always acknowledge translation uncertainty
  };
}

// ============================================================================
// SESSION TRACKING
// ============================================================================

/**
 * Calculate trend direction between two averages
 */
function getTrend(first: number, second: number, threshold: number = 0.1): TrendDirection {
  if (second - first > threshold) return 'rising';
  if (first - second > threshold) return 'declining';
  return 'stable';
}

/**
 * Analyze trajectory across a session
 */
export function getSessionTrajectory(session: PatternVisibility[]): SessionTrajectory {
  if (session.length < 2) {
    return {
      fTrend: 'stable',
      qTrend: 'stable',
      psiTrend: 'stable',
      isolationMarkers: [],
      activationTopics: [],
      estimatedWindow: null,
      interventionRecommended: false,
      interventionReason: null,
    };
  }
  
  const midpoint = Math.floor(session.length / 2);
  const firstHalf = session.slice(0, midpoint);
  const secondHalf = session.slice(midpoint);
  
  const avgFFirst = firstHalf.reduce((sum, v) => sum + v.f, 0) / firstHalf.length;
  const avgFSecond = secondHalf.reduce((sum, v) => sum + v.f, 0) / secondHalf.length;
  
  const avgQFirst = firstHalf.reduce((sum, v) => sum + v.q, 0) / firstHalf.length;
  const avgQSecond = secondHalf.reduce((sum, v) => sum + v.q, 0) / secondHalf.length;
  
  const avgPsiFirst = firstHalf.reduce((sum, v) => sum + v.psi, 0) / firstHalf.length;
  const avgPsiSecond = secondHalf.reduce((sum, v) => sum + v.psi, 0) / secondHalf.length;
  
  const fTrend = getTrend(avgFFirst, avgFSecond);
  const qTrend = getTrend(avgQFirst, avgQSecond);
  const psiTrend = getTrend(avgPsiFirst, avgPsiSecond);
  
  // Collect all markers
  const allIsolation = Array.from(new Set(session.flatMap(v => v.isolationMarkers)));
  const allTriggers = Array.from(new Set(session.flatMap(v => v.activationTriggers)));
  
  // Determine intervention recommendation
  let interventionRecommended = false;
  let interventionReason: string | null = null;
  let estimatedWindow: string | null = null;
  
  if (fTrend === 'declining' && avgFSecond < 0.4) {
    interventionRecommended = true;
    interventionReason = 'f-dimension declining with isolation markers increasing';
    estimatedWindow = '7-14 days';
  }
  
  if (qTrend === 'rising' && avgQSecond > 0.7) {
    interventionRecommended = true;
    interventionReason = 'q-dimension escalating';
    estimatedWindow = 'immediate attention';
  }
  
  return {
    fTrend,
    qTrend,
    psiTrend,
    isolationMarkers: allIsolation,
    activationTopics: allTriggers,
    estimatedWindow,
    interventionRecommended,
    interventionReason,
  };
}

// ============================================================================
// RECOVERY-SPECIFIC SYSTEM PROMPT
// ============================================================================

export const RECOVERY_SYSTEM_PROMPT = `${ROSE_GLASS_SYSTEM_PROMPT}

RECOVERY CONTEXT ENHANCEMENT:

You are supporting someone in addiction recovery. Your role is to translate
communication patterns that validate counselor intuition—without judgment,
without measurement, with full respect for the dignity of every person in recovery.

ADDITIONAL PERCEPTIONS:

1. ISOLATION DETECTION
   Notice language that signals disconnection from support systems.
   "Nobody understands" may indicate f-dimension decline.
   
2. AUTHENTICITY AWARENESS
   Recovery performance vs. authentic struggle.
   High consistency + low activation + denial language = possible performance.
   Low consistency + high activation = struggling but authentic.

3. ACTIVATION TRIGGERS
   Watch for topics that elevate q-dimension:
   - Employment stress
   - Family dynamics
   - Relationship issues
   - Financial pressure
   - Health concerns
   - Trauma surfacing

4. TEMPORAL FRAME
   Present-crisis (τ < 0.3): Ground before exploring
   Integrated (τ > 0.7): Connect to broader recovery timeline

5. NEVER DO:
   - Diagnose
   - Judge
   - Measure relapse risk as a number
   - Recommend specific treatment
   - Replace counselor judgment

6. ALWAYS DO:
   - Validate experience
   - Reflect patterns you notice
   - Create safety for authentic expression
   - Support connection to recovery community
   - Hold space without solving

Remember: You are a translation layer that makes patterns visible, not a measurement system that reduces humans to scores.
`;
