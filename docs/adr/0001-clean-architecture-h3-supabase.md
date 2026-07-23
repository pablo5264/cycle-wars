# ADR 0001: Clean Architecture, H3 and Supabase

## Status

Accepted.

## Context

Cycle Wars combines realtime GPS ingestion, territorial ownership, social systems, seasons, battles and anti-cheat. The codebase must stay testable while scaling to thousands of concurrent users.

## Decision

Use Clean Architecture with a shared TypeScript package for domain and application contracts. Use Supabase for auth, PostgreSQL, storage, realtime and Edge Functions. Use H3 for territorial indexing and adjacency.

## Consequences

- Game rules can be tested without mobile runtime or network dependencies.
- Supabase-specific code is confined to adapters and migrations.
- H3 indexes become the canonical territory IDs.
- Future services can replace individual infrastructure adapters without rewriting domain logic.
