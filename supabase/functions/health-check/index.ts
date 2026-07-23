Deno.serve(() => {
  return Response.json({
    status: "ok",
    service: "cycle-wars",
    timestamp: new Date().toISOString()
  });
});
