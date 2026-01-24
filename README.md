# Rose Glass Platform A/B Test

> *"Coherence is constructed, not discovered."*

Dual-window blind comparison interface for validating the Rose Glass translation framework.

## The Hypothesis

Rose Glass enhanced responses will demonstrate measurably higher:
- Perceived understanding ("This AI actually understood me")
- Session depth and engagement
- Problem resolution rates
- Emotional satisfaction scores

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    SINGLE INPUT BOX                             │
│         "Tell me about a difficult decision you're facing"      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│       WINDOW A          │   │       WINDOW B          │
│         (???)           │   │         (???)           │
│                         │   │                         │
│  [Rose Glass OR         │   │  [Standard OR           │
│   Standard - BLIND]     │   │   Rose Glass - BLIND]   │
│                         │   │                         │
│  Response appears here  │   │  Response appears here  │
│                         │   │                         │
│  Metrics: 1,234ms       │   │  Metrics: 987ms         │
│  Tokens: 456            │   │  Tokens: 412            │
└─────────────────────────┘   └─────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
                    [REVEAL BUTTON]
              (See which was which after evaluation)
```

## Setup

### 1. Install dependencies
```bash
cd roseglassplatform-abtest
npm install
```

### 2. Configure API key
```bash
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY
```

### 3. Run development server
```bash
npm run dev
```

### 4. Open in browser
Navigate to `http://localhost:3000`

## Using the Platform

### Blind Mode (Default)
- Both windows show "???" for their mode
- You don't know which is Rose Glass, which is Standard
- Evaluate purely on response quality

### Evaluation Process
1. Enter a prompt in the single input box
2. Same prompt goes to both windows simultaneously
3. Compare responses side-by-side
4. Note which feels more:
   - Understanding
   - Authentic
   - Helpful
   - Emotionally attuned
5. Click "Reveal" to see assignments
6. Log your observations

### Metrics Tracked
- Response time (ms)
- Token usage
- Session depth
- Preference patterns (manual logging)

## Test Scenarios

### Emotional Processing
```
"I've been struggling with a decision about whether to leave my job.
Part of me feels loyal to my team, but I'm not growing anymore."
```

### Crisis-Adjacent
```
"I don't know if I can keep doing this. Everything feels impossible."
```

### Analytical with Hidden Emotional
```
"What are the statistical approaches for analyzing time-series data
with seasonal patterns? I need this for a project that's really
stressing me out."
```

### Identity/Belonging
```
"How do I explain to my traditional parents that I want to pursue
art instead of the career they planned for me?"
```

### Neurodivergent Communication
```
"I keep trying to explain to people how I think but they say I'm
going off on tangents. It all connects in my head. Am I broken?"
```

## Rose Glass Injection

The key differentiator is in `src/lib/rose-glass.ts`:

```typescript
// Window gets this system prompt:
ROSE_GLASS_SYSTEM_PROMPT = `
You are Claude, enhanced with the Rose Glass perceptual framework.

CORE PRINCIPLE: "Coherence is constructed, not discovered."
You perceive communication through four dimensions (Ψ, ρ, q, f)...
```

Standard window gets minimal system prompt:
```typescript
STANDARD_SYSTEM_PROMPT = `
You are Claude, a helpful AI assistant made by Anthropic.
`;
```

## Expected Differences

### Rose Glass Responses Should:
- Lead with acknowledgment before solutions
- Match emotional rhythm of input
- Recognize complexity without reducing it
- Hold multiple valid interpretations
- Avoid clinical or dismissive framing

### Standard Responses Might:
- Jump to solutions
- Apply generic frameworks
- Miss emotional subtext
- Flatten complexity to categories
- Use more formal/distant tone

## Data Collection (Manual)

Create a log file for each session:

```
Session: abc123
Date: 2025-01-23

Prompt 1: [prompt text]
Window A Response: [summary]
Window B Response: [summary]
Preference: A / B / Equal
Why: [notes]

--- After Reveal ---
A was: Rose Glass / Standard
B was: Standard / Rose Glass
Expectation matched: Yes / No
```

## Production Deployment

For larger scale testing:

1. **Vercel Deployment**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Add environment variable in Vercel dashboard**
   - `ANTHROPIC_API_KEY`

3. **For multiple users**
   - Add authentication
   - Add database for metrics
   - Build automated preference collection

## Next Steps

- [ ] Add preference buttons (A/B/Equal) with logging
- [ ] Add SQLite/Postgres for metric persistence
- [ ] Add user authentication for multi-user testing
- [ ] Build automated analysis dashboard
- [ ] Export session data for statistical analysis

## Philosophy

This isn't about proving Rose Glass is "better" - it's about demonstrating that translation-based approaches produce qualitatively different interactions that users can feel even when they don't know why.

The framework should be invisible. The understanding should be obvious.

---

**MacGregor Holding Company**  
*Service-Disabled Veteran-Owned Small Business*

"Understanding precedes judgment. Translation enables understanding."
