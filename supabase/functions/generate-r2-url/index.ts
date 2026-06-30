Deno.serve(() => {
  return new Response(
    JSON.stringify({ error: "generate-r2-url is not implemented in this checkout" }),
    {
      status: 501,
      headers: { "Content-Type": "application/json" },
    },
  );
});
