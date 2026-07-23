# Frontend

Phase 4 turns the Expo shell into a playable mobile client structure.

## Implemented Areas

- Auth entry screen with anonymous test session support.
- Bottom navigation for Map, Ride, Profile, Clan and Shop.
- API client for Phase 3 Edge Functions.
- Auth service wrapping Supabase Auth with local fallback when environment values are missing.
- Location tracker using Expo Location.
- Ride recording screen for starting activities, sending GPS samples and finishing rides.
- Territory map screen consuming `get-territory-map`.
- Profile screen with rider stats.
- Clan command screen for roles and conquest objectives.
- Cosmetic-only shop screen wired to `purchase-shop-item` when backend is configured.

## Architecture

The mobile app keeps the same Clean Architecture direction:

- `presentation`: screens, navigation, reusable UI and theme.
- `application`: hooks and app state context.
- `domain`: mobile-facing models.
- `infrastructure`: API, auth, location and repository adapters.

## Backend Connectivity

The app reads:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

When these values exist, it talks to:

```text
{EXPO_PUBLIC_SUPABASE_URL}/functions/v1
```

When they are missing, the app stays usable in local demo mode instead of crashing.

## Map Phase Boundary

Phase 4 includes a territory grid preview and data integration. Full MapLibre/OpenStreetMap rendering, H3 polygons and viewport streaming are intentionally delivered in Phase 5.

## Production Notes

- Email, Google, Apple and GitHub auth flows should be exposed through Supabase OAuth UI in the next auth hardening pass.
- Background location and battery-aware sampling should be added after Phase 5 map work.
- The shop currently displays local catalog cards; Phase 9 will replace that with a backend catalog query and inventory state.
