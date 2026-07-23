# Analytics

Phase 15 adds player-facing analytics on top of existing gameplay data.

## Player Analytics

`v_player_analytics` summarizes:

- Activity counts and valid rides.
- Total distance, moving time, average speed, max speed and calories.
- Current territory count and influence.
- Regional reward count and cosmetic currency earned.
- League/ELO.
- A simple season progress score.

The mobile profile reads this data through `player-analytics` and shows it in the `Analytics` panel.

## Weekly Trends

Phase 16 adds `v_player_weekly_trends`, which groups player progress by week:

- Activities and valid activities.
- Distance, moving time and calories.
- Touched territories and influence delta.
- Regional rewards and reward coins.

The mobile profile displays the most recent weeks in `Tendencia semanal` using compact progress bars for distance and influence.

## Clan Analytics

Phase 17 adds `v_clan_analytics`, which summarizes collective strength:

- Members and contribution points.
- Territory count, total influence and average territory level.
- Influence events and influence delta.
- Controlled regions.
- Regional rewards earned by the clan.
- War readiness, a compact score for current clan momentum.

The mobile Clan screen reads this through `clan-analytics` and shows readiness, influence, territory level and regional rewards.

## Clan Weekly Trends

Phase 18 adds `v_clan_weekly_trends`, which groups collective clan motion by week:

- Activities, valid activities and active members.
- Contributing members, touched territories and influence delta.
- Distance, moving time and calories.
- Regional rewards earned by the clan.

The mobile Clan screen displays this in `Ritmo semanal del clan` with compact bars for distance and influence.

## Clan Member Drilldown

Phase 19 adds `v_clan_member_contributions`, which ranks current clan members by squad contribution:

- Role and membership date.
- Activity count, valid rides, distance and moving time.
- Touched territories and influence delta.
- Regional rewards earned.
- Squad score, a compact contribution score for the clan screen.

The mobile Clan screen displays this in `Aportes del escuadron`.

## API

```http
GET /functions/v1/player-analytics
Authorization: Bearer <jwt>
```

The endpoint only returns analytics for the authenticated rider.

```http
GET /functions/v1/player-weekly-trends?weeks=12
Authorization: Bearer <jwt>
```

The endpoint only returns weekly trend rows for the authenticated rider.

```http
GET /functions/v1/clan-analytics
Authorization: Bearer <jwt>
```

The endpoint only returns analytics for the authenticated rider's clan.

```http
GET /functions/v1/clan-weekly-trends?weeks=12
Authorization: Bearer <jwt>
```

The endpoint only returns weekly trend rows for the authenticated rider's clan.

```http
GET /functions/v1/clan-member-contributions?limit=10
Authorization: Bearer <jwt>
```

The endpoint only returns contribution rows for the authenticated rider's clan.

## Future Expansion

- Rich trend charts with gestures and date filters.
- Member contribution history and role-based permissions.
- Retention and funnel dashboards for operations.
- Exportable support snapshots for dispute resolution.
