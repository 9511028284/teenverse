import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { fileName, fileType } = await req.json();

    // Initialize the S3 Client pointed at Cloudflare R2
    const S3 = new S3Client({
      region: "auto",
      endpoint: Deno.env.get("R2_ENDPOINT"), // e.g., https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com
      credentials: {
        accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
        secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
      },
    });

    const command = new PutObjectCommand({
      Bucket: "project-files", // Your exact R2 bucket name
      Key: fileName,
      ContentType: fileType,
    });

    // Generate a URL that expires in 1 hour
    const signedUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });
    
    // Construct the public read-only URL 
    const publicUrl = `${Deno.env.get("R2_PUBLIC_URL")}/${fileName}`;

    return new Response(JSON.stringify({ signedUrl, publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 400, headers: corsHeaders 
    });
  }
});