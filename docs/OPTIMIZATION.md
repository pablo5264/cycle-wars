# Optimization and Observability

Phase 10 adds production-oriented guardrails for traffic, performance, battery use and operational visibility.

## Database Tuning

- `gps_samples_recent_h3_trusted_idx` speeds same-cell trusted sample lookups for conquest and battles.
- `territories_updated_status_idx` helps map refreshes and operational scans.
- `feed_posts_recent_public_idx` keeps the public feed fast as social usage grows.
- `v_operational_health` exposes recent function latency, status codes, rate-limit volume and mobile telemetry volume.

## Rate Limits

Edge Functions use `check_rate_limit` through `supabase/functions/_shared/ops.ts`.

| Bucket | Limit | Window | Used by |
| --- | ---: | ---: | --- |
| `gps_ingest` | 90 | 300 seconds | GPS samples |
| `read_map` | 240 | 300 seconds | Territory map reads |
| `write_social` | 60 | 300 seconds | Feed writes |
| `chat_write` | 80 | 300 seconds | Chat messages |
| `shop_write` | 30 | 300 seconds | Cosmetic purchases |

Expected `429` responses should be treated as healthy protection during bursts, not application errors.

## Mobile Performance

The ride screen now uses adaptive GPS accuracy:

- Moving or first sample: `BestForNavigation`.
- Slow movement after a previous sample: `Balanced`.

The app records `gps_sample_roundtrip` events after successful sample ingestion. These events include duration, anti-cheat status and influence delta.

Phase 11 adds a retry queue for GPS samples. Recoverable failures, including rate-limit and backend/network interruptions, are queued and flushed in order before the next fresh sample is sent.

Phase 12 persists that queue with AsyncStorage. On ride screen startup, pending samples are hydrated from device storage, counted in the UI and flushed before sending fresh GPS data.

## Load Testing

Use `scripts/load-test-plan.md` as the scenario plan. The minimum production gate is:

- P95 read latency below 600 ms.
- P95 write latency below 900 ms.
- GPS roundtrip P95 below 1,500 ms.
- Error rate below 1 percent, excluding expected rate limits.

## CI and Smoke Checks

`npm run smoke:static` verifies that core app files, Edge Functions, migrations, OpenAPI coverage and Fase 10 telemetry hooks exist. CI runs typecheck, lint, tests, format check and this smoke check.

## Operational Queries

```sql
select *
from public.v_operational_health
order by checked_at desc;

select function_name, status_code, count(*), avg(duration_ms)
from public.edge_function_logs
where created_at > now() - interval '1 hour'
group by function_name, status_code
order by function_name, status_code;

select bucket, count(*)
from public.rate_limit_events
where created_at > now() - interval '1 hour'
group by bucket
order by count(*) desc;
```
