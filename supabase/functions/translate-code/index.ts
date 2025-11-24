import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://esm.sh/linkedom@0.16.10";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationRequest {
  code: string;
  sourceLang: string;
  targetLang: string | string[];
}

interface TranslationResponse {
  translatedCode: string;
  provider: string;
  success: boolean;
  error?: string;
}

interface TextNode {
  type: 'text' | 'attribute';
  text: string;
  path: string; // XPath-like identifier
  attributeName?: string;
}

// RTL languages list
const RTL_LANGUAGES = ['arabic', 'عربية', 'hebrew', 'עברית', 'persian', 'فارسی', 'urdu', 'اردو', 'ar', 'he', 'fa', 'ur'];

// Translatable attributes
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'alt', 'aria-label', 'aria-description'];

// Tags to ignore completely
const IGNORE_TAGS = ['SCRIPT', 'STYLE', 'CODE', 'PRE'];

/**
 * Extract all translatable texts from HTML
 * Returns array of TextNode objects with their locations
 */
function extractTexts(html: string): TextNode[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const texts: TextNode[] = [];
  let nodeIndex = 0;

  function traverse(node: any, path: string) {
    // Skip ignored tags
    if (node.nodeType === 1 && IGNORE_TAGS.includes(node.tagName)) {
      return;
    }

    // Extract text nodes
    if (node.nodeType === 3) { // Text node
      const text = node.textContent?.trim();
      if (text && text.length > 0) {
        texts.push({
          type: 'text',
          text: text,
          path: `${path}[${nodeIndex}]`,
        });
        nodeIndex++;
      }
    }

    // Extract translatable attributes
    if (node.nodeType === 1) { // Element node
      TRANSLATABLE_ATTRIBUTES.forEach(attr => {
        const value = node.getAttribute(attr);
        if (value && value.trim().length > 0) {
          texts.push({
            type: 'attribute',
            text: value.trim(),
            path: `${path}[${nodeIndex}]`,
            attributeName: attr,
          });
          nodeIndex++;
        }
      });

      // Traverse children
      node.childNodes.forEach((child: any, index: number) => {
        traverse(child, `${path}/${node.tagName}[${index}]`);
      });
    }
  }

  traverse(doc.documentElement, '');
  return texts;
}

/**
 * Inject translated texts back into HTML
 * Uses the paths to find exact locations
 */
function injectTexts(html: string, originalTexts: TextNode[], translatedTexts: string[]): string {
  if (originalTexts.length !== translatedTexts.length) {
    throw new Error('Mismatch between original and translated texts count');
  }

  let result = html;

  // Replace texts in reverse order to maintain indices
  for (let i = originalTexts.length - 1; i >= 0; i--) {
    const original = originalTexts[i];
    const translated = translatedTexts[i];

    // Simple string replacement (works well for most cases)
    // For attributes, we need to handle them carefully
    if (original.type === 'attribute' && original.attributeName) {
      const attrPattern = new RegExp(
        `${original.attributeName}=["']${original.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`,
        'gi'
      );
      result = result.replace(attrPattern, `${original.attributeName}="${translated}"`);
    } else {
      // For text nodes, find and replace the exact text
      // We need to be careful not to replace texts in tags or attributes
      const textPattern = new RegExp(`>${original.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<`, 'g');
      result = result.replace(textPattern, `>${translated}<`);
    }
  }

  return result;
}

/**
 * Add RTL directive to HTML tag if needed
 */
function ensureRTLDirective(html: string, targetLang: string): string {
  const isRTL = RTL_LANGUAGES.some(lang => 
    targetLang.toLowerCase().includes(lang.toLowerCase())
  );

  if (!isRTL) return html;

  // Check if HTML tag exists and add dir="rtl" if missing
  const htmlTagRegex = /<html([^>]*)>/i;
  const match = html.match(htmlTagRegex);

  if (match) {
    const attrs = match[1];
    if (!attrs.includes('dir=')) {
      return html.replace(htmlTagRegex, `<html${attrs} dir="rtl">`);
    }
  }

  return html;
}

// Primary: Groq Cloud (السرعة)
async function translateTextsWithGroq(texts: string[], sourceLang: string, targetLang: string): Promise<string[]> {
  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');

  console.log(`🚀 Groq: Translating ${texts.length} texts from ${sourceLang} → ${targetLang}`);

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the array of texts from ${sourceLang} to ${targetLang}.

CRITICAL RULES:
- Return ONLY a JSON array of translated strings
- Maintain the EXACT SAME array length
- Preserve HTML entities and special characters
- Keep formatting like \\n, spaces, etc.
- Do NOT add any explanation or markdown
- Output format: ["translated text 1", "translated text 2", ...]`
        },
        {
          role: 'user',
          content: JSON.stringify(texts)
        }
      ],
      temperature: 0.3,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  // Parse JSON response
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse Groq response:', content);
    throw new Error('Invalid JSON response from Groq');
  }
}

// Secondary: Google AI Studio (الدقة والذكاء)
async function translateTextsWithGoogle(texts: string[], sourceLang: string, targetLang: string): Promise<string[]> {
  const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!GOOGLE_AI_API_KEY) throw new Error('GOOGLE_AI_API_KEY not configured');

  console.log(`🛡️ Google AI: Translating ${texts.length} texts from ${sourceLang} → ${targetLang}`);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a professional translator. Translate the array of texts from ${sourceLang} to ${targetLang}.

CRITICAL RULES:
- Return ONLY a JSON array of translated strings
- Maintain the EXACT SAME array length
- Preserve HTML entities and special characters
- Keep formatting like \\n, spaces, etc.
- Do NOT add any explanation or markdown
- Output format: ["translated text 1", "translated text 2", ...]

Array to translate:
${JSON.stringify(texts)}`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8000,
        }
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google AI error: ${error}`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text.trim();
  
  // Parse JSON response, handling markdown code blocks
  try {
    let jsonStr = content;
    if (content.startsWith('```')) {
      jsonStr = content.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse Google response:', content);
    throw new Error('Invalid JSON response from Google AI');
  }
}

// Tertiary: Cloudflare Workers AI (الطوارئ)
async function translateTextsWithCloudflare(texts: string[], sourceLang: string, targetLang: string): Promise<string[]> {
  const CLOUDFLARE_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
  const CLOUDFLARE_API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN');
  
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    throw new Error('Cloudflare credentials not configured');
  }

  console.log(`⚠️ Cloudflare AI: Translating ${texts.length} texts from ${sourceLang} → ${targetLang}`);

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the array of texts from ${sourceLang} to ${targetLang}.

CRITICAL RULES:
- Return ONLY a JSON array of translated strings
- Maintain the EXACT SAME array length
- Preserve HTML entities and special characters
- Keep formatting like \\n, spaces, etc.
- Do NOT add any explanation
- Output format: ["translated text 1", "translated text 2", ...]`
          },
          {
            role: 'user',
            content: JSON.stringify(texts)
          }
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudflare AI error: ${error}`);
  }

  const data = await response.json();
  const content = data.result.response.trim();
  
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse Cloudflare response:', content);
    throw new Error('Invalid JSON response from Cloudflare AI');
  }
}

// Scientific translation with three-tier fallback
async function translateCode(code: string, sourceLang: string, targetLang: string): Promise<TranslationResponse> {
  try {
    // Step 1: Extract texts
    console.log('📊 Step 1: Extracting texts from HTML...');
    const textNodes = extractTexts(code);
    const textsToTranslate = textNodes.map(node => node.text);
    
    console.log(`📝 Extracted ${textsToTranslate.length} translatable texts`);

    if (textsToTranslate.length === 0) {
      return {
        translatedCode: code,
        provider: 'None (no texts to translate)',
        success: true,
      };
    }

    // Step 2: Translate texts (with fallback)
    let translatedTexts: string[] = [];
    let provider = '';

    try {
      translatedTexts = await translateTextsWithGroq(textsToTranslate, sourceLang, targetLang);
      provider = 'Groq Cloud';
      console.log('✅ Groq translation successful');
    } catch (groqError) {
      console.error('❌ Groq failed:', groqError);

      try {
        translatedTexts = await translateTextsWithGoogle(textsToTranslate, sourceLang, targetLang);
        provider = 'Google AI Studio';
        console.log('✅ Google AI translation successful (fallback)');
      } catch (googleError) {
        console.error('❌ Google AI failed:', googleError);

        try {
          translatedTexts = await translateTextsWithCloudflare(textsToTranslate, sourceLang, targetLang);
          provider = 'Cloudflare Workers AI';
          console.log('✅ Cloudflare AI translation successful (emergency fallback)');
        } catch (cloudflareError) {
          console.error('❌ All providers failed');
          throw new Error('All translation providers failed');
        }
      }
    }

    // Step 3: Inject translated texts back
    console.log('💉 Step 3: Injecting translated texts back into HTML...');
    let translatedCode = injectTexts(code, textNodes, translatedTexts);

    // Step 4: Add RTL support if needed
    translatedCode = ensureRTLDirective(translatedCode, targetLang);

    console.log('✅ Translation complete!');
    return {
      translatedCode,
      provider,
      success: true,
    };

  } catch (error) {
    console.error('❌ Translation failed:', error);
    return {
      translatedCode: '',
      provider: 'None',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, sourceLang, targetLang }: TranslationRequest = await req.json();

    if (!code || !sourceLang || !targetLang) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: code, sourceLang, targetLang' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle multi-language translation
    if (Array.isArray(targetLang)) {
      console.log(`🌍 Multi-language translation to ${targetLang.length} languages`);
      const results = await Promise.all(
        targetLang.map(lang => translateCode(code, sourceLang, lang))
      );

      return new Response(
        JSON.stringify({ translations: results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle single-language translation
    console.log(`🔄 Single translation: ${sourceLang} → ${targetLang}`);
    const result = await translateCode(code, sourceLang, targetLang);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
