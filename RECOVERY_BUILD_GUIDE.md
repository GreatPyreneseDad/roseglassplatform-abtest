# Rose Glass Recovery + Platform Integration Build Guide
## For Next Chat Session

**Date:** January 24, 2026
**Goal:** Combine rose-glass-recovery with roseglassplatform-abtest and deploy live on Vercel

---

## WHAT EXISTS NOW

### 1. roseglassplatform-abtest (LIVE on Vercel)
**Location:** `/Users/chris/roseglassplatform-abtest`
**URL:** https://roseglassplatform-abtest.vercel.app
**Stack:** Next.js, TypeScript, Tailwind

**Key Files:**
- `src/lib/rose-glass.ts` - Core system prompt + context analysis
- `src/components/DualChatInterface.tsx` - A/B comparison UI
- `src/app/api/` - API routes to Claude
- `src/app/page.tsx` - Main page

**What it does:** Side-by-side A/B testing of Rose Glass vs Standard Claude

### 2. rose-glass-recovery (Python, NOT deployed)
**Location:** `/Users/chris/rose-glass-recovery`
**Stack:** Python

**Key Files:**
- `src/core/recovery_translator.py` - 610 lines of recovery-specific logic
- `src/calibrations/` - Calibration profiles (trauma_informed, autism_spectrum, adhd, veteran)
- `src/integrations/rose_glass_bridge.py` - Bridge layer

**What it does:** Recovery-specific pattern detection with:
- Isolation markers
- Connection markers
- Activation triggers (employment, family, relationship, financial, health, trauma)
- Contradiction detection
- Risk level assessment (stable/watch/concern/urgent)
- Session trajectory tracking

---

## WHAT TO BUILD

### Architecture: Add `/recovery` mode to existing platform

```
roseglassplatform-abtest/
├── src/
│   ├── lib/
│   │   ├── rose-glass.ts (existing - general)
│   │   └── rose-glass-recovery.ts (NEW - port from Python)
│   ├── components/
│   │   ├── DualChatInterface.tsx (existing)
│   │   └── RecoveryInterface.tsx (NEW - single conversation + insights panel)
│   ├── app/
│   │   ├── page.tsx (existing - A/B test)
│   │   ├── recovery/
│   │   │   └── page.tsx (NEW - recovery mode)
│   │   └── api/
│   │       ├── chat/route.ts (existing)
│   │       └── recovery/route.ts (NEW - recovery-specific endpoint)
```

---

## PORT FROM PYTHON TO TYPESCRIPT

### From `recovery_translator.py`, port these:

#### 1. Pattern Markers (regex arrays)
```typescript
// Isolation markers
const ISOLATION_MARKERS = [
  /\b(alone|lonely|isolated|nobody|no one|by myself)\b/i,
  /\b(don't understand|doesn't get it|can't relate)\b/i,
  /\b(on my own|all by myself|just me)\b/i,
  /\b(no friends|lost .* friends|pushed .* away)\b/i,
];

// Connection markers
const CONNECTION_MARKERS = [
  /\b(we|us|our|together)\b/i,
  /\b(sponsor|group|meeting|fellowship)\b/i,
  /\b(support|helped|supporting)\b/i,
  /\b(family|friend|partner|community)\b/i,
];

// Activation triggers
const ACTIVATION_TRIGGERS: [RegExp, string][] = [
  [/\b(work|job|boss|employment|fired|unemployed)\b/i, 'employment'],
  [/\b(family|parent|mother|father|sibling|child)\b/i, 'family'],
  [/\b(relationship|partner|spouse|divorce|breakup)\b/i, 'relationship'],
  [/\b(money|debt|bills|rent|mortgage|financial)\b/i, 'financial'],
  [/\b(health|sick|pain|doctor|hospital)\b/i, 'health'],
  [/\b(trauma|abuse|assault|violence)\b/i, 'trauma'],
];

// Contradiction patterns
const CONTRADICTION_PATTERNS: [RegExp, RegExp][] = [
  [/i'm fine/i, /but|however|except|although/i],
  [/under control/i, /can't|struggling|hard/i],
  [/don't need/i, /maybe|sometimes|probably/i],
  [/doing great/i, /but|except|although|however/i],
];

// Temporal markers
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
```

#### 2. Types
```typescript
type RiskLevel = 'stable' | 'watch' | 'concern' | 'urgent';
type TrendDirection = 'rising' | 'stable' | 'declining';

interface PatternVisibility {
  psi: number;
  rho: number;
  q: number;
  f: number;
  tau: number;
  authenticityScore: number;
  isolationMarkers: string[];
  activationTriggers: string[];
  coherence: number;
}

interface ClinicalInsight {
  summary: string;
  dimensionNotes: Record<string, string>;
  patternShifts: string[];
  considerations: string[];
  riskLevel: RiskLevel;
  confidence: number;
}

interface Calibration {
  km: number;
  ki: number;
  fWeight: number;
  psiTolerance: number;
}
```

#### 3. Core Functions to Port
- `analyzeStatement(text: string): PatternVisibility`
- `getClinicalInsight(visibility: PatternVisibility): ClinicalInsight`
- `calculateCoherence(psi, rho, q, f): number`
- `optimizeQ(qRaw: number, km: number, ki: number): number` (Michaelis-Menten)

#### 4. Calibrations Object
```typescript
const CALIBRATIONS: Record<string, Calibration> = {
  trauma_informed: { km: 0.25, ki: 1.5, fWeight: 1.2, psiTolerance: 0.3 },
  autism_spectrum: { km: 0.35, ki: 2.5, fWeight: 0.8, psiTolerance: 0.1 },
  adhd: { km: 0.2, ki: 1.2, fWeight: 1.0, psiTolerance: 0.5 },
  veteran: { km: 0.3, ki: 2.0, fWeight: 1.1, psiTolerance: 0.2 },
};
```

---

## RECOVERY-SPECIFIC SYSTEM PROMPT

Create new system prompt for recovery mode that extends base Rose Glass:

```typescript
export const RECOVERY_SYSTEM_PROMPT = `
${ROSE_GLASS_SYSTEM_PROMPT}

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
`;
```

---

## NEW UI: RecoveryInterface.tsx

Single conversation interface with insights panel:

```
┌─────────────────────────────────────────────────────────────┐
│  ROSE GLASS RECOVERY                    [Calibration: ▼]    │
├───────────────────────────────────┬─────────────────────────┤
│                                   │  PATTERN VISIBILITY     │
│  Chat Interface                   │  ────────────────────   │
│                                   │  Ψ ████████░░ 0.82      │
│  User: I'm doing fine, really.    │  ρ ██████░░░░ 0.61      │
│  Everything is under control.     │  q ████░░░░░░ 0.45      │
│                                   │  f ███░░░░░░░ 0.33      │
│  Rose Glass: I hear you saying    │  τ █████░░░░░ 0.52      │
│  things are under control...      │                         │
│                                   │  INSIGHT                │
│                                   │  ────────────────────   │
│                                   │  Risk: WATCH            │
│                                   │  Isolation markers: 2   │
│                                   │  Activation: none       │
│                                   │                         │
│                                   │  Consider: Gentle       │
│                                   │  inquiry about support  │
│                                   │  system                 │
├───────────────────────────────────┴─────────────────────────┤
│  [Type message...]                              [Send]      │
└─────────────────────────────────────────────────────────────┘
```

---

## API ROUTE: /api/recovery/route.ts

```typescript
// Receives message + calibration
// Analyzes with recovery translator
// Builds recovery-enhanced system prompt
// Calls Claude API
// Returns response + PatternVisibility + ClinicalInsight
```

---

## DEPLOYMENT STEPS

1. **Port TypeScript module**
   - Create `src/lib/rose-glass-recovery.ts`
   - Port all markers, types, functions from Python

2. **Create Recovery UI**
   - Create `src/components/RecoveryInterface.tsx`
   - Chat + insights panel layout

3. **Create Recovery Route**
   - Create `src/app/recovery/page.tsx`
   - Import RecoveryInterface

4. **Create API Endpoint**
   - Create `src/app/api/recovery/route.ts`
   - Wire up translator + Claude API

5. **Test Locally**
   ```bash
   cd /Users/chris/roseglassplatform-abtest
   npm run dev
   # Visit http://localhost:3000/recovery
   ```

6. **Deploy to Vercel**
   ```bash
   git add .
   git commit -m "Add recovery mode"
   git push
   # Vercel auto-deploys
   ```

7. **Live URLs**
   - A/B Test: https://roseglassplatform-abtest.vercel.app
   - Recovery: https://roseglassplatform-abtest.vercel.app/recovery

---

## FOR DEA DEMONSTRATION

The recovery mode demonstrates:
1. ✅ Perceive emotional states beneath surface communication
2. ✅ Recognize crisis signals in casual questions
3. ✅ Adapt response mode to context appropriately
4. ✅ Articulate perceptual process for transparency
5. ✅ Pattern visibility without measurement/judgment

**This is the "perfect foot in the door" for federal validation.**

---

## CONTEXT FOR NEXT CHAT

Start the next chat with:

"Read this build guide and execute it: /Users/chris/roseglassplatform-abtest/RECOVERY_BUILD_GUIDE.md

The goal is to add a /recovery route to the existing Rose Glass A/B platform that ports the Python recovery translator to TypeScript and deploys to Vercel."

---

## FILES TO READ FIRST

1. `/Users/chris/rose-glass-recovery/src/core/recovery_translator.py` (source to port)
2. `/Users/chris/roseglassplatform-abtest/src/lib/rose-glass.ts` (existing TS patterns)
3. `/Users/chris/roseglassplatform-abtest/src/components/DualChatInterface.tsx` (UI patterns)
4. `/Users/chris/roseglassplatform-abtest/src/app/api/chat/route.ts` (API patterns)

---

**End of Build Guide**
