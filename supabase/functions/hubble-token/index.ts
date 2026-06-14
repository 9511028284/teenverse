import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";
import { importPKCS8, SignJWT } from "npm:jose@5";

const TOKEN_TTL_SECONDS = 60;
const ALLOWED_WEB_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://app.teenversehub.in",
  "https://teenversehub.in",
  "https://www.teenversehub.in",
]);

function getCorsHeaders(req: Request) {
  const requestOrigin = req.headers.get("Origin");
  const allowedOrigin =
    requestOrigin && ALLOWED_WEB_ORIGINS.has(requestOrigin)
      ? requestOrigin
      : "http://localhost:5173";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

function json(body: unknown, corsHeaders: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizePem(privateKeyPem: string) {
  return privateKeyPem.includes("\\n")
    ? privateKeyPem.replaceAll("\\n", "\n")
    : privateKeyPem;
}

function pemToBase64(pem: string) {
  return pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
}

function base64ToBytes(base64: string) {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function encodeDerLength(length: number) {
  if (length < 128) {
    return new Uint8Array([length]);
  }

  const bytes = [];
  let value = length;

  while (value > 0) {
    bytes.unshift(value & 0xff);
    value >>= 8;
  }

  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

function derSequence(...parts: Uint8Array[]) {
  const bodyLength = parts.reduce((sum, part) => sum + part.length, 0);
  const length = encodeDerLength(bodyLength);
  const output = new Uint8Array(1 + length.length + bodyLength);

  output[0] = 0x30;
  output.set(length, 1);

  let offset = 1 + length.length;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}

function derOctetString(bytes: Uint8Array) {
  const length = encodeDerLength(bytes.length);
  const output = new Uint8Array(1 + length.length + bytes.length);

  output[0] = 0x04;
  output.set(length, 1);
  output.set(bytes, 1 + length.length);

  return output;
}

function pemWrap(label: string, bytes: Uint8Array) {
  const base64 = bytesToBase64(bytes);
  const lines = base64.match(/.{1,64}/g) ?? [];

  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

function convertPkcs1RsaPrivateKeyToPkcs8(pem: string) {
  const pkcs1Der = base64ToBytes(pemToBase64(pem));
  const version = new Uint8Array([0x02, 0x01, 0x00]);
  const rsaEncryptionAlgorithm = derSequence(
    new Uint8Array([
      0x06,
      0x09,
      0x2a,
      0x86,
      0x48,
      0x86,
      0xf7,
      0x0d,
      0x01,
      0x01,
      0x01,
    ]),
    new Uint8Array([0x05, 0x00]),
  );
  const pkcs8Der = derSequence(
    version,
    rsaEncryptionAlgorithm,
    derOctetString(pkcs1Der),
  );

  return pemWrap("PRIVATE KEY", pkcs8Der);
}

function normalizePrivateKey(privateKeyPem: string) {
  const normalizedPem = normalizePem(privateKeyPem).trim();

  if (normalizedPem.includes("-----BEGIN RSA PRIVATE KEY-----")) {
    return convertPkcs1RsaPrivateKeyToPkcs8(normalizedPem);
  }

  return normalizedPem;
}

function normalizeIndianMobileNumber(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "";
  }

  const digits = String(value).replace(/\D/g, "");

  if (/^91[6-9]\d{9}$/.test(digits)) {
    return digits.slice(2);
  }

  if (/^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  return "";
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const hubbleClientId = Deno.env.get("HUBBLE_CLIENT_ID");
    const privateKeyPem = Deno.env.get("HUBBLE_PRIVATE_KEY");

    if (!hubbleClientId) {
      return json({ error: "Missing HUBBLE_CLIENT_ID secret" }, corsHeaders, 500);
    }

    if (!privateKeyPem) {
      return json({ error: "Missing HUBBLE_PRIVATE_KEY secret" }, corsHeaders, 500);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization");

    let authUser: any = null;
    let profile: any = null;

    if (authHeader && supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      });

      const { data, error } = await supabase.auth.getUser();

      if (!error) {
        authUser = data?.user ?? null;
      }

      if (authUser?.id) {
        const { data: freelancerProfile } = await supabase
          .from("freelancers")
          .select("name,email,phone")
          .eq("id", authUser.id)
          .maybeSingle();

        if (freelancerProfile) {
          profile = freelancerProfile;
        } else {
          const { data: clientProfile } = await supabase
            .from("clients")
            .select("name,email,phone")
            .eq("id", authUser.id)
            .maybeSingle();

          profile = clientProfile ?? null;
        }
      }
    }

    if (!authUser?.id) {
      return json(
        {
          error: "Authentication required",
          message: "Sign in before opening the Hubble Store.",
        },
        corsHeaders,
        401,
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const metadata = authUser?.user_metadata ?? {};
    const userId = authUser.id;
    const email =
      profile?.email ||
      authUser?.email ||
      metadata.email;
    const name =
      profile?.name ||
      metadata.full_name ||
      metadata.name ||
      email?.split("@")[0] ||
      "TeenVerse User";
    const phoneNumber = normalizeIndianMobileNumber(
      profile?.phone ||
        metadata.phoneNumber ||
        metadata.phone_number ||
        metadata.phone ||
        authUser?.phone,
    );
    const cohorts = Array.isArray(metadata.cohorts)
      ? metadata.cohorts
      : ["teenversehub"];

    if (!phoneNumber) {
      return json(
        {
          error: "Invalid phone number",
          message:
            "Add a valid 10-digit Indian mobile number to your TeenVerse profile before opening the Hubble Store.",
        },
        corsHeaders,
        400,
      );
    }

    const privateKey = await importPKCS8(
      normalizePrivateKey(privateKeyPem),
      "RS256",
    );

    const token = await new SignJWT({
      phoneNumber,
      name,
      email,
      cohorts,
    })
      .setProtectedHeader({
        alg: "RS256",
        typ: "JWT",
      })
      .setSubject(userId)
      .setIssuer(hubbleClientId)
      .setIssuedAt(now)
      .setExpirationTime(now + TOKEN_TTL_SECONDS)
      .sign(privateKey);

    return json(
      {
        token,
        clientId: hubbleClientId,
        expiresIn: TOKEN_TTL_SECONDS,
      },
      corsHeaders,
    );
  } catch (error) {
    console.error("Hubble token generation failed:", error);

    return json(
      {
        error: "Failed to generate Hubble token",
        message: error instanceof Error ? error.message : String(error),
      },
      corsHeaders,
      500,
    );
  }
});
