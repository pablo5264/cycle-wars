# Release Readiness

Phase 11 prepares Cycle Wars for a controlled beta launch.

## Release Gates

- `npm run quality` passes locally or in CI.
- `npm run smoke:static` confirms core migrations, Edge Functions, OpenAPI and telemetry hooks.
- `npm run release:check` confirms release artifacts, environment keys and operational docs.
- Supabase migrations apply cleanly in a staging project.
- `health-check` returns `status: ok` from the target Supabase project.
- Load-test gates in `scripts/load-test-plan.md` are met.

## Mobile Gates

- Auth flow works for anonymous and email sessions.
- Route start, GPS sample, queue recovery and finish flow work on a physical device.
- Map renders a visible territory window.
- Shop purchase and equip flow do not affect rider power.
- Social feed, private chat and clan chat can recover from a brief network interruption.

## Backend Gates

- Service-role secrets are present only in Supabase Edge Function environment variables.
- `CYCLE_WARS_INTERNAL_SECRET` is rotated before launch.
- Scheduled jobs call `refresh-rankings` and `decay-territories`.
- Operational tables are monitored for repeated `429` spikes and 5xx errors.

## Operational Checks

```sql
select *
from public.v_operational_health
order by checked_at desc;

select event_name, count(*), percentile_cont(0.95) within group (order by duration_ms)
from public.mobile_performance_events
where created_at > now() - interval '1 hour'
group by event_name;
```

## Rollback

- Disable new mobile rollout in the store console first.
- Revert Edge Function deployments to the previous known-good bundle.
- Keep migrations forward-only; ship corrective migrations instead of destructive rollback.
- Temporarily lower rate-limit thresholds only when abuse is active and documented.
- Announce degraded modes for map reads, social posting or shop writes independently.

## Known Beta Limits

- Offline GPS queue is durable for pending samples, but conflict resolution is still intentionally server-authoritative.
- Map rendering has a fallback grid, but deeper device profiling is still needed for low-end Android hardware.
