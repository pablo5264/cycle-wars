# Battles

Phase 7 turns same-H3 presence into a server-authoritative territorial battle system.

## Trigger

A battle opens when trusted GPS samples show two different riders in the same H3 cell within the recent presence window.

## Scoring

Battle scoring is calculated server-side through:

```sql
public.battle_score(...)
```

Factors:

- distance ridden in the battle
- player level
- resistance score
- historical wins/losses
- current speed
- time inside the territory

The shared TypeScript package mirrors the formula for testing and UI explanation, but only PostgreSQL decides official results.

## Battle Pulses

GPS ingestion sends trusted activity into:

```sql
public.upsert_battle_participant_pulse(...)
```

The pulse updates participant score, distance, speed and time in territory.

## Resolution

`resolve-battle` calls `public.resolve_battle(...)`, which:

- picks the winner by score
- stores a scorecard in `battle_results`
- updates wins/losses
- updates ELO
- sends result notifications

## Mobile UI

The Ride screen now shows:

- active battle status
- territory H3
- participant count
- leader score
- battle intensity
- participant ranking
- server-side resolve action

## Realtime

`battles`, `battle_participants` and `battle_results` are published through Supabase Realtime, enabling live combat views in later animation work.
