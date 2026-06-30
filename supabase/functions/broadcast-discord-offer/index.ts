Deno.serve(() => {
  return new Response(
    JSON.stringify({ error: "broadcast-discord-offer is not implemented in this checkout" }),
    {
      status: 501,
      headers: { "Content-Type": "application/json" },
    },
  );
});
