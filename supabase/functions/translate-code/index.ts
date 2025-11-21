import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

// RTL languages list
const RTL_LANGUAGES = ['Arabic', 'العربية', 'Hebrew', 'עברית', 'Persian', 'فارسی', 'Urdu', 'اردو'];

// Post-processing function to ensure dir="rtl" for RTL languages
function ensureRTLDirective(code: string, targetLang: string): string {
  const isRTL = RTL_LANGUAGES.some(lang => targetLang.toLowerCase().includes(lang.toLowerCase()));
  
  if (!isRTL) return code;
  
  // Check if HTML contains lang attribute for RTL without dir="rtl"
  const htmlTagRegex = /<html([^>]*lang=["'](ar|he|fa|ur)["'][^>]*)>/i;
  const match = code.match(htmlTagRegex);
  
  if (match && !match[1].includes('dir=')) {
    // Add dir="rtl" to the html tag
    return code.replace(htmlTagRegex, (fullMatch, attrs) => {
      return `<html${attrs} dir="rtl">`;
    });
  }
  
  return code;
}

// Primary: Groq Cloud (السرعة)
async function translateWithGroq(code: string, sourceLang: string, targetLang: string): Promise<string> {
  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');

  console.log(`🚀 Attempting Groq translation: ${sourceLang} → ${targetLang}`);

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
          content: `أنت مترجم كود احترافي. ترجم النصوص القابلة للترجمة فقط من ${sourceLang} إلى ${targetLang}.

**قواعد مهمة للترجمة:**

✅ ترجم فقط:
- النصوص المرئية للمستخدم داخل tags
- محتوى placeholder، title، alt

❌ لا تترجم أبداً:
- محتوى href (الروابط الداخلية والخارجية)
- محتوى id (المعرفات)
- محتوى class (الفئات)
- محتوى src (مصادر الملفات)
- أسماء المتغيرات والدوال
- أي HTML/CSS/JS attributes تقنية

🔄 إذا كانت الترجمة للعربية أو أي لغة RTL:
- أضف dir="rtl" مع lang في tag الـ <html>
- مثال: <html lang="ar" dir="rtl">

حافظ على:
- بنية الكود وتنسيقه
- التعليقات البرمجية
- أكواد HTML/CSS/JS السليمة`
        },
        {
          role: 'user',
          content: `ترجم هذا الكود من ${sourceLang} إلى ${targetLang}:\n\n${code}`
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Secondary: Google AI Studio (الدقة والذكاء)
async function translateWithGoogle(code: string, sourceLang: string, targetLang: string): Promise<string> {
  const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!GOOGLE_AI_API_KEY) throw new Error('GOOGLE_AI_API_KEY not configured');

  console.log(`🛡️ Attempting Google AI translation: ${sourceLang} → ${targetLang}`);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `أنت مترجم كود احترافي. ترجم النصوص القابلة للترجمة فقط من ${sourceLang} إلى ${targetLang}.

**قواعد مهمة للترجمة:**

✅ ترجم فقط:
- النصوص المرئية للمستخدم داخل tags
- محتوى placeholder، title، alt

❌ لا تترجم أبداً:
- محتوى href (الروابط الداخلية والخارجية)
- محتوى id (المعرفات)
- محتوى class (الفئات)
- محتوى src (مصادر الملفات)
- أسماء المتغيرات والدوال
- أي HTML/CSS/JS attributes تقنية

🔄 إذا كانت الترجمة للعربية أو أي لغة RTL:
- أضف dir="rtl" مع lang في tag الـ <html>
- مثال: <html lang="ar" dir="rtl">

حافظ على:
- بنية الكود وتنسيقه
- التعليقات البرمجية
- أكواد HTML/CSS/JS السليمة

الكود المطلوب ترجمته:

${code}`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4000,
        }
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google AI error: ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Tertiary: Cloudflare Workers AI (الطوارئ)
async function translateWithCloudflare(code: string, sourceLang: string, targetLang: string): Promise<string> {
  const CLOUDFLARE_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
  const CLOUDFLARE_API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN');
  
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    throw new Error('Cloudflare credentials not configured');
  }

  console.log(`⚠️ Attempting Cloudflare AI translation: ${sourceLang} → ${targetLang}`);

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
            content: `You are a professional code translator. Translate only translatable text from ${sourceLang} to ${targetLang}.

**Important Translation Rules:**

✅ Translate ONLY:
- User-visible text inside tags
- Content of placeholder, title, alt attributes

❌ NEVER translate:
- Content of href (internal and external links)
- Content of id (identifiers)
- Content of class (CSS classes)
- Content of src (file sources)
- Variable and function names
- Any technical HTML/CSS/JS attributes

🔄 If translating to Arabic or any RTL language:
- Add dir="rtl" with lang in <html> tag
- Example: <html lang="ar" dir="rtl">

Preserve:
- Code structure and formatting
- Code comments
- Valid HTML/CSS/JS syntax`
          },
          {
            role: 'user',
            content: `Translate this code from ${sourceLang} to ${targetLang}:\n\n${code}`
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
  return data.result.response;
}

// Three-tier fallback system
async function translateCode(code: string, sourceLang: string, targetLang: string): Promise<TranslationResponse> {
  // Try Groq first (Primary - Speed)
  try {
    let translatedCode = await translateWithGroq(code, sourceLang, targetLang);
    translatedCode = ensureRTLDirective(translatedCode, targetLang);
    console.log('✅ Groq translation successful');
    return {
      translatedCode,
      provider: 'Groq Cloud',
      success: true,
    };
  } catch (groqError) {
    console.error('❌ Groq failed:', groqError);

    // Try Google AI Studio (Secondary - Accuracy)
    try {
      let translatedCode = await translateWithGoogle(code, sourceLang, targetLang);
      translatedCode = ensureRTLDirective(translatedCode, targetLang);
      console.log('✅ Google AI translation successful (fallback)');
      return {
        translatedCode,
        provider: 'Google AI Studio',
        success: true,
      };
    } catch (googleError) {
      console.error('❌ Google AI failed:', googleError);

      // Try Cloudflare Workers AI (Tertiary - Emergency)
      try {
        let translatedCode = await translateWithCloudflare(code, sourceLang, targetLang);
        translatedCode = ensureRTLDirective(translatedCode, targetLang);
        console.log('✅ Cloudflare AI translation successful (emergency fallback)');
        return {
          translatedCode,
          provider: 'Cloudflare Workers AI',
          success: true,
        };
      } catch (cloudflareError) {
        console.error('❌ All providers failed');
        const errorMessage = cloudflareError instanceof Error ? cloudflareError.message : 'Unknown error';
        return {
          translatedCode: '',
          provider: 'None',
          success: false,
          error: `All translation providers failed. Last error: ${errorMessage}`,
        };
      }
    }
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
      const results = await Promise.all(
        targetLang.map(lang => translateCode(code, sourceLang, lang))
      );

      return new Response(
        JSON.stringify({ translations: results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle single-language translation
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
