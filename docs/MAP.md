# Map

Phase 5 integrates the geospatial surface for Cycle Wars.

## Implemented

- MapLibre React Native dependency and Expo plugin configuration.
- OpenStreetMap raster style through `EXPO_PUBLIC_MAP_TILE_URL`.
- H3 viewport service that derives visible cells from map center, resolution and ring size.
- H3 polygon conversion using `h3-js`.
- Territory feature styling by state:
  - neutral
  - protected
  - vulnerable
  - contested
- Territory loading by visible H3 indexes through `get-territory-map`.
- Realtime subscription to `public.territories`.
- MapLibre component with fallback H3 renderer for local/dev environments where the native MapLibre module is not installed yet.
- Selected territory inspector.
- Center-on-rider action using Expo Location.

## Why MapLibre

MapLibre keeps the map stack open and avoids proprietary lock-in. OpenStreetMap raster tiles provide a reliable baseline, while the H3 overlay remains game-owned data rendered above the base map.

## Viewport Strategy

The app generates a compact H3 disk around the current map center:

```text
center latitude/longitude -> H3 cell -> grid disk -> backend territory lookup
```

This limits backend reads and keeps the map responsive. Phase 10 can replace the disk strategy with exact screen-bound polygon coverage if profiling shows it is necessary.

## Realtime Strategy

The mobile app subscribes to `territories` changes and merges incoming rows into the current map state. This allows conquest, shield and contested-state changes to appear without a manual refresh.

## Fallback Renderer

The fallback renderer uses the same feature collection and styling as MapLibre. It exists so development can continue before native packages are installed or when running in environments that cannot load MapLibre.

## Next Work

Phase 6 will use the same H3 map service for conquest visualization, influence animation, shield timers and territory level upgrades.

Status: Phase 6 now uses the map service for influence progress, shield markers and territory level visualization.
