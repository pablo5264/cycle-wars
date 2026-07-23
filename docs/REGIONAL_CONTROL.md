# Regional Control

Phase 13 turns individual H3 conquest into aggregate regional objectives.

## Model

The base schema already contains:

- `admin_regions`: named geographic areas such as commune, city, region or country.
- `region_hexes`: H3 cells assigned to each region.
- `region_control_snapshots`: point-in-time control results.

Phase 13 adds `refresh_region_control`, which calculates the current controller for each region from owned territories.

## Control Rules

- Only territories with an owner count toward control.
- The leading contender is the owner/clan with the most controlled H3 cells in the region.
- `controlled_hexes / total_hexes` becomes `control_percent`.
- Snapshots are append-only so region history can be audited later.

## Operations

Refresh all regions:

```http
POST /functions/v1/refresh-region-control
x-cycle-wars-secret: <internal secret>

{}
```

Refresh one region:

```json
{
  "regionId": "uuid"
}
```

Read regional control:

```http
GET /functions/v1/get-region-control?limit=25
```

## Mobile

The mobile app includes a `Zonas` tab that displays region name, controller, controlled hexes and progress percentage.

## Season Rewards

Phase 14 adds idempotent cosmetic rewards for regional controllers.

- `settle_region_season_rewards` selects the latest snapshot per region for the target season.
- Regions must meet the minimum control threshold, defaulting to 50 percent.
- Rewards are granted as cosmetic currency through the existing economy ledger.
- The unique key on season, region, player and reason prevents duplicate payouts when jobs are retried.

Settle rewards:

```http
POST /functions/v1/settle-region-rewards
x-cycle-wars-secret: <internal secret>

{
  "seasonId": "uuid",
  "minControlPercent": 50,
  "baseAmount": 250
}
```

Read player rewards:

```http
GET /functions/v1/player-region-rewards?limit=20
Authorization: Bearer <jwt>
```

## Future Expansion

- Add parent rollups, such as commune to city to country.
- Add map overlays for region boundaries when geometry tiles are available.
