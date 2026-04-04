// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  const { name } = await req.json()
  const data = {
    message: `Hello ${name}!`,
  }

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/broadcast-discord-offer' \
    --header 'Authorization: Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6ImFkNDkwMzAwLTk0NWMtNDQ4Mi1iNjY5LTdmZWUwZGExODkzYiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjIwOTA2ODg4NjZ9.SSu87dOL0m8uCel2z4RJdaxAkexZ1P2456zXBVoR3WV9bW9wTH69oRS1ebqEejM46sMSuTfhwhoPqpugtKHKkQ' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
