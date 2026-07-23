# Security Baseline

## Principles

- Server authority for conquest, battles, rewards and season changes.
- Row Level Security on every user-facing table.
- JWT validation for authenticated requests.
- Refresh-token rotation through Supabase Auth.
- MFA-ready account model.
- Audit logs for privileged and game-state-changing actions.
- Rate limits for GPS ingestion, battle actions, chat and economy writes.

## Anti-Cheat Baseline

The client records GPS data, but the server decides whether a sample is trustworthy.

Signals:

- Accuracy and timestamp drift.
- Impossible velocity and acceleration.
- Teleport jumps.
- Route duplication.
- Root or jailbreak indicators.
- Mock-location indicators where the platform exposes them.
- Clock manipulation.
- Vehicle-like speed profiles.

Suspicious activity is quarantined before it affects territory ownership.
