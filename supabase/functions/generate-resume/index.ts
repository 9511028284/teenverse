import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { roughText } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!roughText) throw new Error("No text provided")

    // Complex prompt to force JSON structure for a Resume
    const prompt = `
      You are an expert CV writer. 
      Task: Convert the following rough career notes into a structured professional resume.
      Rough Notes: "${roughText}"
      
      Output Requirements:
      Return ONLY valid JSON (no markdown). The JSON must match this structure exactly:
      {
        "full_name": "Extract or infer from context (or use placeholder)",
        "professional_title": "e.g. Senior React Developer",
        "summary": "A professional 3-sentence executive summary.",
        "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
        "experience": [
          {
            "role": "Job Title",
            "company": "Company Name",
            "period": "Dates (e.g. 2020 - Present)",
            "description": "3 bullet points of achievements, quantified if possible."
          }
        ],
        "education": [
          {
            "degree": "Degree Name",
            "school": "School/University Name",
            "year": "Graduation Year"
          }
        ]
      }
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );

    const data = await response.json();
    const rawString = data.candidates[0].content.parts[0].text;
    const cleanJsonString = rawString.replace(/```json/g, '').replace(/```/g, '').trim();
    const resultObj = JSON.parse(cleanJsonString);

    return new Response(JSON.stringify(resultObj), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})