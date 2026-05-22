import {
  parsePositiveAmount,
  validateHubbleSecret,
} from "./hubble-wallet.ts";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

Deno.test("invalid X-Hubble-Secret is rejected", () => {
  Deno.env.set("HUBBLE_SECRET", "expected-secret");

  const request = new Request("http://localhost/functions/v1/debit", {
    headers: {
      "X-Hubble-Secret": "wrong-secret",
    },
  });

  assert(!validateHubbleSecret(request), "wrong secret should fail validation");
});

Deno.test("valid X-Hubble-Secret is accepted", () => {
  Deno.env.set("HUBBLE_SECRET", "expected-secret");

  const request = new Request("http://localhost/functions/v1/debit", {
    headers: {
      "X-Hubble-Secret": "expected-secret",
    },
  });

  assert(validateHubbleSecret(request), "matching secret should pass validation");
});

Deno.test("coins must be positive", () => {
  let failed = false;

  try {
    parsePositiveAmount(0, "coins");
  } catch (_error) {
    failed = true;
  }

  assert(failed, "zero coins should fail validation");
});
