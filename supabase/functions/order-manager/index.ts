import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // 1. Setup Admin Client (Bypasses RLS)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 2. Get User Info (Who is trying to do this?)
  const authHeader = req.headers.get('Authorization')!
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user } } = await userClient.auth.getUser()

  if (!user) return new Response("Unauthorized", { status: 401 })

  const { action, appId, payload } = await req.json()

  // 3. THE STATE MACHINE LOGIC
  try {
    // Fetch current application state
    const { data: app, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', appId)
      .single()

    if (fetchError || !app) throw new Error("Application not found")

    let updates = {}

    switch (action) {
      case 'ACCEPT_APPLICATION':
        // Rule: Only Client can accept. Status must be 'Pending'.
        if (app.client_id !== user.id) throw new Error("Only client can accept")
        if (app.status !== 'Pending') throw new Error("Job already started")
        
        updates = { status: 'Accepted', started_at: new Date().toISOString() }
        break;

      case 'SUBMIT_WORK':
        // Rule: Only Freelancer can submit. Status must be 'Accepted'.
        if (app.freelancer_id !== user.id) throw new Error("Only freelancer can submit")
        if (app.status !== 'Accepted') throw new Error("Job not in progress")
        
        updates = { 
          status: 'Submitted', 
          submitted_at: new Date().toISOString(),
          work_link: payload.work_link,
          work_message: payload.message,
          work_files: payload.files // Array of URLs
        }
        break;

      case 'APPROVE_WORK':
        // Rule: Only Client can approve. Status must be 'Submitted'.
        if (app.client_id !== user.id) throw new Error("Only client can approve")
        if (app.status !== 'Submitted') throw new Error("No work to approve")
        
        updates = { status: 'Completed', completed_at: new Date().toISOString() }
        break;

      // NOTE: 'PAID' status is NOT here. That only comes via Webhook!
      
      default:
        throw new Error("Invalid Action")
    }

    // 4. Apply Updates
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update(updates)
      .eq('id', appId)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ success: true, status: updates.status }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})