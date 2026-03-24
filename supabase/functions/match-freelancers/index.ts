import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query) throw new Error("Missing query");

    // 1. AI PARSING (Fast, cheap, strict JSON)
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const aiPrompt = `
      Extract the project requirements from the following text.
      Return ONLY a valid JSON object with no markdown formatting or extra text.
      Schema:
      {
        "skills": ["skill1", "skill2"],
        "budget": number (total budget, default 0 if none),
        "urgency": "low" | "medium" | "high",
        "estimated_hours": number (default 5 if unspecified)
      }
      User Text: "${query}"
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
      generationConfig: { responseMimeType: "application/json" } // Forces strict JSON
    });

    const parsedQuery = JSON.parse(result.response.text());
    const maxHourlyRate = parsedQuery.budget > 0 ? (parsedQuery.budget / parsedQuery.estimated_hours) : 9999;

    // 2. DATABASE FILTERING
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let dbQuery = supabaseAdmin
      .from('freelancers')
      .select('*')
      .lt('current_active_jobs', 3) // Hard cap: Must have capacity
      .lte('hourly_rate', maxHourlyRate);

    // If urgent, strictly require availability
    if (parsedQuery.urgency === 'high') {
      dbQuery = dbQuery.eq('is_available_for_urgent', true);
    }

    // Filter by overlapping skills
    if (parsedQuery.skills.length > 0) {
      dbQuery = dbQuery.overlaps('skills', parsedQuery.skills);
    }

    const { data: freelancers, error } = await dbQuery;
    if (error) throw error;

    // 3. SCORING ENGINE
    const now = new Date().getTime();

    const scoredFreelancers = freelancers.map(f => {
      // A. Skill Match (0-100)
      const matchingSkills = f.skills.filter((s: string) => parsedQuery.skills.includes(s.toLowerCase()));
      const skillMatchScore = parsedQuery.skills.length > 0 
        ? (matchingSkills.length / parsedQuery.skills.length) * 100 
        : 100;

      // B. Rating (0-100)
      const ratingScore = (f.rating / 5) * 100;

      // C. Response Speed (0-100, drops as hours increase)
      const speedScore = Math.max(0, 100 - (f.response_speed_hours * 2));

      // D. Recent Activity (0-100, drops by 2 points per day inactive)
      const daysInactive = (now - new Date(f.last_active_at).getTime()) / (1000 * 3600 * 24);
      const activityScore = Math.max(0, 100 - (daysInactive * 2));

      // Base Formula
      let finalScore = 
        (skillMatchScore * 0.40) + 
        (ratingScore * 0.25) + 
        (f.completion_rate * 0.15) + 
        (speedScore * 0.10) + 
        (activityScore * 0.10);

      // Startup Tweaks: Newbie Boost & Overexposure Penalty
      if (f.total_jobs < 3) finalScore += 12; // Give new teens a chance
      if (f.current_active_jobs === f.max_active_jobs - 1) finalScore -= 15; // Don't overload busy devs

      return { ...f, match_score: Math.round(finalScore) };
    });

    // 4. SORT & LIMIT
    const topMatches = scoredFreelancers
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 15);

    return new Response(JSON.stringify({ parsed: parsedQuery, results: topMatches }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});