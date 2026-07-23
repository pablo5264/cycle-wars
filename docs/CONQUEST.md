# Conquest

Phase 6 implements the conquest loop: influence accumulation, shields, decay, territory levels and player-facing progress.

## Server Authority

The client never decides ownership. GPS samples produce influence only after server validation. The authoritative mutation is:

```sql
public.apply_territory_influence(...)
```

This function locks the target H3 row, records the influence event, updates player influence for that territory and decides whether ownership changes.

## Influence Model

Influence is accumulated per player and territory in:

```text
territory_player_influence
```

This prevents instant capture from a single small GPS sample. A challenger must build enough influence to exceed the current owner influence. If they do not, the territory becomes `contested`.

## Shield Model

Newly captured territory receives a shield:

```text
base shield minutes + level shield bonus
```

During shield time, non-owner influence cannot capture the territory. Owners can keep reinforcing their own territory.

## Decay

Scheduled decay runs through:

```text
decay-territories -> public.decay_territory_influence(...)
```

Decay reduces territory influence and per-player influence over time. It is protected by the internal `x-cycle-wars-secret` header.

## Territory Levels

Levels are driven by cumulative distance in the territory:

- Level 1: Puesto, 0 m
- Level 2: Campamento, 5 km
- Level 3: Base, 15 km
- Level 4: Fortaleza, 35 km
- Level 5: Ciudadela, 75 km

Rules live in `territory_level_rules` and are mirrored in the shared TypeScript domain package.

## Map Visualization

The map and ride screens display:

- influence points
- influence progress
- level name
- level progress
- shield time remaining
- contested/protected/vulnerable states

Realtime territory updates merge into the map state so captures and decay can be seen without manual refresh.

## Production Notes

- Phase 10 should tune decay rates through telemetry and load testing.
- Phase 6 stores enough history to resolve support disputes after contested captures.
- Region domination in later phases can build on `territory_ownership_history` and `region_hexes`.
