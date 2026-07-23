# Load Test Plan

## Goal

Validate that Cycle Wars stays responsive when many riders record GPS samples, read the map and use social actions at the same time.

## Scenarios

- GPS ingestion: authenticated riders send one sample every 5 seconds for 15 minutes.
- Map reads: public clients request visible H3 windows every 3 seconds.
- Social writes: authenticated users create posts, comments and chat messages.
- Economy writes: authenticated users purchase and equip cosmetics.

## Ramp Profile

- 5 minutes warm-up at 50 virtual users.
- 20 minutes at 500 virtual users.
- 20 minutes at 2,000 virtual users.
- 10 minutes spike at 5,000 virtual users.
- 10 minutes cool-down.

## Success Gates

- P95 Edge Function latency below 600 ms for reads and 900 ms for writes.
- Error rate below 1 percent, excluding expected `429` rate-limit responses.
- GPS ingestion accepts trusted samples without duplicate influence.
- Database CPU has enough headroom to run territory decay and ranking refresh jobs.
- No mobile performance event reports GPS roundtrip P95 above 1,500 ms.

## Required Observability

- Query `public.v_operational_health` during and after the run.
- Review `edge_function_logs` by function and status code.
- Review `rate_limit_events` for buckets with repeated throttling.
- Review `mobile_performance_events` for `gps_sample_roundtrip`.
