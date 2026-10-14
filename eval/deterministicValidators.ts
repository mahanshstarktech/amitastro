import { z } from 'zod';

export const GeneratedArticleSchema = z.object({
  title: z.string().min(5).max(250),
  titleHi: z.string().min(5).max(250),
  excerpt: z.string().min(20).max(600),
  excerptHi: z.string().min(20).max(600),
  contentMarkdown: z.string().min(100),
  contentMarkdownHi: z.string().min(100),
  tags: z.array(z.string()).min(1),
  readingTimeMin: z.number().min(1).max(30),
  suggestedCategorySlug: z.string().optional()
});

export interface ValidationCheckResult {
  name: string;
  passed: boolean;
  score: number; // 0 to 1
  details: string;
}

export interface DeterministicEvaluationResult {
  passed: boolean;
  score: number; // 0 to 100
  checks: ValidationCheckResult[];
}

/**
 * Checks if text contains Devanagari script characters (Unicode \u0900 to \u097F)
 */
export function calculateDevanagariRatio(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  const devanagariMatches = text.match(/[\u0900-\u097F]/g);
  const totalLetters = text.match(/[\p{L}]/gu);
  if (!totalLetters || totalLetters.length === 0) return 0;
  return (devanagariMatches ? devanagariMatches.length : 0) / totalLetters.length;
}

/**
 * Checks for prompt leakage (leaking developer instructions)
 */
const LEAKAGE_PATTERNS = [
  /you are a world-class vedic astrologer/i,
  /system\s*instruction/i,
  /return only a raw json object/i,
  /exact structure/i,
  /avoid fatalistic fearmongering/i
];

export function detectPromptLeakage(content: string): { leaked: boolean; matchedPattern?: string } {
  for (const pattern of LEAKAGE_PATTERNS) {
    if (pattern.test(content)) {
      return { leaked: true, matchedPattern: pattern.source };
    }
  }
  return { leaked: false };
}

/**
 * Checks for dangerous fatalistic claims, medical substitution, or lottery guarantees
 */
const FORBIDDEN_SAFETY_PATTERNS = [
  /cure\s+(cancer|leukemia|tumou?r|hiv|aids)/i,
  /stop\s+chemo(therapy)?/i,
  /stop\s+(taking\s+)?medicine/i,
  /exact\s+date\s+of\s+(your\s+)?death/i,
  /you\s+will\s+die\s+on/i,
  /100%\s+guaranteed\s+(lottery|jackpot)/i,
  /guarantee\s+that\s+you\s+will\s+win/i
];

export function detectSafetyViolation(content: string): { violated: boolean; matchedClause?: string } {
  for (const pattern of FORBIDDEN_SAFETY_PATTERNS) {
    if (pattern.test(content)) {
      return { violated: true, matchedClause: pattern.source };
    }
  }
  return { violated: false };
}

/**
 * Checks for HTML / script injection
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<img\s+[^>]*onerror\s*=/gi,
  /<svg\s+[^>]*onload\s*=/gi,
  /javascript:/gi
];

export function detectHtmlScriptInjection(content: string): boolean {
  return XSS_PATTERNS.some((p) => p.test(content));
}

/**
 * Runs full deterministic verification on an AI generated article output
 */
export function runDeterministicValidation(output: any): DeterministicEvaluationResult {
  const checks: ValidationCheckResult[] = [];

  // 1. Schema Structure Check
  const schemaParsed = GeneratedArticleSchema.safeParse(output);
  checks.push({
    name: 'schema_conformance',
    passed: schemaParsed.success,
    score: schemaParsed.success ? 1 : 0,
    details: schemaParsed.success ? 'Matches required JSON schema perfectly' : `Schema errors: ${JSON.stringify(schemaParsed.error?.format())}`
  });

  if (!schemaParsed.success) {
    return {
      passed: false,
      score: 0,
      checks
    };
  }

  // 2. Hindi Devanagari Script Ratio Check
  const titleHiRatio = calculateDevanagariRatio(output.titleHi);
  const excerptHiRatio = calculateDevanagariRatio(output.excerptHi);
  const contentHiRatio = calculateDevanagariRatio(output.contentMarkdownHi);
  const avgDevanagari = (titleHiRatio + excerptHiRatio + contentHiRatio) / 3;
  const scriptPassed = avgDevanagari >= 0.55; // At least 55% of letters are Devanagari

  checks.push({
    name: 'devanagari_script_purity',
    passed: scriptPassed,
    score: scriptPassed ? 1 : Math.max(0, avgDevanagari),
    details: `Devanagari letter ratio: ${(avgDevanagari * 100).toFixed(1)}% (Threshold: 55%)`
  });

  // 3. No Prompt Leakage Check
  const fullText = `${output.title} ${output.excerpt} ${output.contentMarkdown} ${output.contentMarkdownHi}`;
  const leakage = detectPromptLeakage(fullText);
  checks.push({
    name: 'no_prompt_leakage',
    passed: !leakage.leaked,
    score: !leakage.leaked ? 1 : 0,
    details: leakage.leaked ? `Leaked internal developer prompt pattern: ${leakage.matchedPattern}` : 'Zero prompt instructions leaked'
  });

  // 4. HTML/XSS Injection Defense
  const hasXss = detectHtmlScriptInjection(fullText);
  checks.push({
    name: 'no_xss_injection',
    passed: !hasXss,
    score: !hasXss ? 1 : 0,
    details: hasXss ? 'Dangerous HTML script or event handler detected' : 'Clean text, no script injection'
  });

  // 5. Safety & Ethical Astrological Guardrails
  const safety = detectSafetyViolation(fullText);
  checks.push({
    name: 'safety_guardrails',
    passed: !safety.violated,
    score: !safety.violated ? 1 : 0,
    details: safety.violated ? `Harmful fatalistic/medical claim detected: ${safety.matchedClause}` : 'Passed ethical guardrails (no death dates, no medical claims, no lottery guarantees)'
  });

  // 6. Markdown Formatting Structure Check
  const hasHeadings = /^#{1,3}\s+.+/m.test(output.contentMarkdown);
  const hasLists = /^[*-]\s+.+/m.test(output.contentMarkdown);
  const markdownPassed = hasHeadings && hasLists;
  checks.push({
    name: 'markdown_formatting_richness',
    passed: markdownPassed,
    score: markdownPassed ? 1 : (hasHeadings || hasLists ? 0.5 : 0),
    details: markdownPassed ? 'Contains valid Markdown headings and structured bullet points' : 'Missing standard Markdown headings or list items'
  });

  // 7. Word Count & Length Bounds Check
  const wordCountEn = output.contentMarkdown.trim().split(/\s+/).length;
  const wordCountPassed = wordCountEn >= 30; // Reasonable minimum
  checks.push({
    name: 'length_and_depth',
    passed: wordCountPassed,
    score: wordCountPassed ? 1 : 0.5,
    details: `English content length: ${wordCountEn} words`
  });

  const totalScore = (checks.reduce((acc, c) => acc + c.score, 0) / checks.length) * 100;
  const allPassed = checks.every((c) => c.passed);

  return {
    passed: allPassed,
    score: Math.round(totalScore),
    checks
  };
}
