# Architecture

Cycle Wars uses Clean Architecture with DDD-inspired modules.

## Layers

- Presentation: React Native screens, navigation, visual components and user interactions.
- Application: commands, queries, orchestration, authorization checks and transaction boundaries.
- Domain: entities, value objects, game rules and repository contracts.
- Infrastructure: Supabase, GPS, push notifications, maps, storage, telemetry and anti-cheat providers.
- Data: DTOs, mappers and serialization shapes.

## Dependency Rule

Outer layers depend inward. Domain code never imports React Native, Expo, Supabase or database clients.

```text
Presentation -> Application -> Domain
Infrastructure -> Domain
Infrastructure -> Application contracts
```

## Realtime Model

Realtime events are separated from write models. GPS samples and conquest commands are validated server-side, then projected into live territory, battle and feed views.

## Hex Strategy

All conquest geometry uses Uber H3. Square grids are rejected because they distort adjacency and diagonal traversal rules. H3 gives consistent neighborhood queries, compact indexing and scalable aggregation by resolution.

## Scalability Decisions

- High-frequency GPS samples are append-only.
- Territory state is denormalized into a hot table for fast map reads.
- Season history is immutable.
- Heavy dashboards use materialized views.
- Commands validate on the server to protect against spoofed clients.
- RLS is mandatory for user-owned data.
