import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { roughText } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!roughText) throw new Error("No text provided")

    // 2. Prepare the prompt for Google Gemini
    // We ask for JSON specifically to make it easy to display in your UI
    const prompt = `
      You are an expert career coach and portfolio writer.
      Task: Rewrite the following rough notes into a professional portfolio case study.
      
      Rough Notes: "${roughText}"
      
      Output Requirements:
      Return ONLY valid JSON with no markdown formatting (no \`\`\`json).
      The JSON must have exactly these two fields:
      {
        "title": "A short, punchy, professional title for this project",
        "content": "A 3-4 sentence professional summary of the work, focusing on results and technologies used."
      }
    `;

    // 3. Call Google Gemini API (REST version to keep it lightweight)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    
    // 4. Parse Gemini's response
    // Gemini returns nested objects, we need to extract the text
    const rawString = data.candidates[0].content.parts[0].text;
    
    // Clean up any potential markdown code blocks if the AI adds them
    const cleanJsonString = rawString.replace(/```json/g, '').replace(/```/g, '').trim();
    const resultObj = JSON.parse(cleanJsonString);

    return new Response(JSON.stringify(resultObj), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})