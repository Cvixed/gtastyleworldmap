import './style.css'
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

async function initMap() {
  const response = await fetch('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json');
  const style = await response.json();

  // Premium GTA Map palette
  const gtaWaterColor = '#1f303a'; 
  const gtaWaterCoastline = '#5b7d90';
  const gtaLandColor = '#0b0c10';
  const gtaParkColor = '#0a0d11';
  
  // Roads
  const gtaRoadHighwayFill = '#ffffff';
  const gtaRoadHighwayCase = '#000000';
  const gtaRoadMajorFill = '#8c8c8c';
  const gtaRoadMajorCase = '#000000';
  const gtaRoadMinorFill = '#333333';

  style.layers.forEach(layer => {
    // 1. Modify background (land)
    if (layer.id === 'background') {
      layer.paint['background-color'] = gtaLandColor;
    }
    
    // 2. Modify landcover
    if (layer.source === 'carto' && (layer['source-layer'] === 'landcover' || layer['source-layer'] === 'landuse' || layer['source-layer'] === 'park')) {
       if (layer.paint && layer.paint['fill-color']) {
         layer.paint['fill-color'] = layer.id.includes('park') ? gtaParkColor : gtaLandColor;
         if (layer.paint['fill-opacity']) {
             layer.paint['fill-opacity'] = 1;
         }
       }
    }
    
    // 3. Modify water
    if (layer.id === 'water' || layer.id === 'waterway' || layer.id === 'water_shadow' || layer.id.includes('watername')) {
      if (layer.paint && layer.paint['fill-color']) {
         layer.paint['fill-color'] = gtaWaterColor;
      }
      if (layer.paint && layer.paint['line-color']) {
         layer.paint['line-color'] = gtaWaterColor;
      }
    }

    // 4. Modify roads (Add casing & fills)
    if (layer.source === 'carto' && layer['source-layer'] === 'transportation') {
       const isCase = layer.id.includes('case');
       const isMinor = layer.id.includes('minor') || layer.id.includes('service') || layer.id.includes('path') || layer.id.includes('sec') || layer.id.includes('tertiary');
       const isHighway = layer.id.includes('trunk') || layer.id.includes('mot') || layer.id.includes('pri');

       if (layer.paint && layer.paint['line-color']) {
           if (isMinor) {
              layer.paint['line-color'] = isCase ? gtaLandColor : gtaRoadMinorFill;
           } else if (isHighway) {
              layer.paint['line-color'] = isCase ? gtaRoadHighwayCase : gtaRoadHighwayFill;
           } else {
              layer.paint['line-color'] = isCase ? gtaRoadMajorCase : gtaRoadMajorFill;
           }
       }
    }

    // Hide boundaries and labels for a cleaner GTA look
    if (layer.id.includes('boundary') || layer.id.includes('place') || layer.id.includes('poi') || layer.id.includes('tunnel')) {
        layer.layout = layer.layout || {};
        layer.layout.visibility = 'none';
    }
  });
  
  // Add coastline glow effect
  const waterIndex = style.layers.findIndex(l => l.id === 'water');
  if (waterIndex !== -1) {
     style.layers.splice(waterIndex, 0, {
       id: 'water-glow',
       type: 'line',
       source: 'carto',
       'source-layer': 'water',
       filter: ['==', '$type', 'Polygon'],
       paint: {
         'line-color': gtaWaterCoastline,
         'line-width': {
           stops: [[5, 2], [10, 6], [15, 12]]
         },
         'line-blur': {
             stops: [[5, 1], [10, 3], [15, 6]]
         },
         'line-opacity': 0.9
       }
     });
     
     style.layers.splice(waterIndex + 1, 0, {
       id: 'water-shoreline',
       type: 'line',
       source: 'carto',
       'source-layer': 'water',
       filter: ['==', '$type', 'Polygon'],
       paint: {
         'line-color': '#111b21',
         'line-width': 1.5,
         'line-opacity': 1
       }
     });
  }

  const map = new maplibregl.Map({
    container: 'map',
    style: style,
    center: [-118.261683, 34.058235], // Los Angeles (Real life Los Santos)
    zoom: 12.5,
    pitch: 45,
    bearing: -15,
    antialias: true
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');

  map.on('load', () => {
    // 1. Add 3D Terrain
    map.addSource('terrain', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 14
    });
    map.setTerrain({ source: 'terrain', exaggeration: 1.5 });

    // 2. Add Hillshade layer to give shadows to mountains
    map.addLayer({
        id: 'hillshade',
        type: 'hillshade',
        source: 'terrain',
        layout: { visibility: 'visible' },
        paint: {
            'hillshade-shadow-color': '#000000',
            'hillshade-highlight-color': '#111111',
            'hillshade-exaggeration': 0.8
        }
    }, 'water-glow'); // Insert before water glow so it only shades land

    // 3. Add fake GPS route
    map.addSource('gps-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [-118.261683, 34.058235],
            [-118.258000, 34.061000],
            [-118.254000, 34.060000],
            [-118.252000, 34.054000],
            [-118.246000, 34.050000]
          ]
        }
      }
    });

    // Outer glow for GPS route
    map.addLayer({
      id: 'gps-route-glow',
      type: 'line',
      source: 'gps-route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#712d91', // Darker purple
        'line-width': 10,
        'line-blur': 4
      }
    });

    // Core GPS route
    map.addLayer({
      id: 'gps-route-line',
      type: 'line',
      source: 'gps-route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#b859e6', // GTA V Waypoint Purple
        'line-width': 5
      }
    });

    // 4. Add Player Blip
    const playerEl = document.createElement('div');
    playerEl.className = 'player-blip';
    new maplibregl.Marker({ element: playerEl })
      .setLngLat([-118.261683, 34.058235])
      .addTo(map);

    // 5. Add POI Markers
    const pois = [
      { lngLat: [-118.246000, 34.050000], type: 'waypoint', icon: '📍' },
      { lngLat: [-118.265000, 34.052000], type: 'safehouse', icon: '🏠' },
      { lngLat: [-118.250000, 34.065000], type: 'ammunation', icon: '🔫' },
      { lngLat: [-118.275000, 34.060000], type: 'lscustoms', icon: '🔧' }
    ];

    pois.forEach(poi => {
      const el = document.createElement('div');
      el.className = `poi-icon ${poi.type}`;
      el.innerText = poi.icon;
      new maplibregl.Marker({ element: el })
        .setLngLat(poi.lngLat)
        .addTo(map);
    });
  });
}

initMap();
