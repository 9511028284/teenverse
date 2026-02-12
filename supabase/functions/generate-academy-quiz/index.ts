// supabase/functions/generate-academy-quiz/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { category, subCategory } = await req.json();

    const prompt = `
    Generate a low-difficulty skill quiz for a teen freelancer.
    Category: ${category} (${subCategory || 'General'})
    
    STRICT JSON OUTPUT FORMAT (Array of 8 objects):
    {
      "title": "Creative Title for Quiz",
      "questions": [
        {
          "q": "Question text here",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "a": "Exact text of correct option"
        }
      ]
    }
    
    Rules:
    1. Output valid JSON only.
    2. No markdown formatting.
    3. Questions must be beginner level but practical.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast and cheap
      messages: [
        { role: "system", content: "You are a JSON generator for a teen freelance academy." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const quizData = JSON.parse(completion.choices[0].message.content || "{}");

    return new Response(JSON.stringify(quizData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});