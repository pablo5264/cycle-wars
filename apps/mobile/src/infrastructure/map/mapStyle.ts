export function openStreetMapRasterStyle(tileUrl: string) {
  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        attribution: "OpenStreetMap contributors"
      }
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm"
      }
    ]
  };
}
