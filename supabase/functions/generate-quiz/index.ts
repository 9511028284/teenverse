import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { corsHeaders } from "../_shared/ai/http.ts";
import { handleQuizGeneration } from "../_shared/ai/quiz-handler.ts";

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return handleQuizGeneration(request);
});

