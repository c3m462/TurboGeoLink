// Shared default link configuration, used by both content.js and options.js.
// {lat} / {lon} are replaced with the popup's coordinates before insertion.
const OT_DEFAULT_LINKS = [
  {
    id: "bing_maps",
    label: "Bing Maps",
    enabled: true,
    urlTemplate: "https://www.bing.com/maps?cp={lat}~{lon}&lvl=19.2&style=h"
  },
  {
    id: "dual_maps",
    label: "Dual Maps",
    enabled: true,
    urlTemplate: "https://data.mapchannels.com/dualmaps8/map.htm?lat={lat}&lng={lon}"
  },
  {
    id: "google_earth",
    label: "Google Earth",
    enabled: true,
    urlTemplate: "https://earth.google.com/web/@{lat},{lon},699.1419278a,15000d,1y,0h,0t,0r"
  },
  {
    id: "google",
    label: "Google Maps",
    enabled: true,
    urlTemplate: "https://www.google.com/maps/@{lat},{lon},120m/data=!3m1!1e3?entry=ttu"
  },
  {
    id: "google_streetview",
    label: "Google StreetView",
    enabled: true,
    urlTemplate: "https://maps.google.com/maps?q=&layer=c&cbll={lat},{lon}"
  },
  {
    id: "instant_streetview",
    label: "InstantStreetView",
    enabled: true,
    urlTemplate: "https://www.instantstreetview.com/@{lat},{lon},242.16h,-2.34p,0z"
  },
  {
    id: "map_channels",
    label: "Map Channels",
    enabled: true,
    urlTemplate: "https://mapchannels.com/quadviewmaps/map.htm?lat={lat}&lng={lon}"
  },
  {
    id: "map_compare",
    label: "Map Compare",
    enabled: true,
    urlTemplate: "https://mc.bbbike.org/mc/?lon={lon}&lat={lat}&zoom=22&num=3&mt0=mapnik-german&mt1=cyclemap&mt2=bing-hybrid"
  },
  {
    id: "satellites_pro",
    label: "Satellites Pro",
    enabled: true,
    urlTemplate: "https://satellites.pro/Russia_map#{lat},{lon},18"
  },
  {
    id: "yandex_maps",
    label: "Yandex Maps",
    enabled: true,
    urlTemplate: "https://yandex.ru/maps/?l=sat%2Cskl&ll={lon}%2C{lat}&z=18"
  },
  {
    id: "yandex_streetview",
    label: "Yandex StreetView",
    enabled: true,
    urlTemplate:
      "https://yandex.ru/maps/?l=sat%2Cskl%2Cstv%2Csta&ll={lon}%2C{lat}&panorama%5Bdirection%5D=0%2C0.000000&panorama%5Bfull%5D=true&panorama%5Bpoint%5D={lon}%2C{lat}&panorama%5Bspan%5D=0%2C60.000000&z=18"
  },
  {
    id: "mapillary",
    label: "Mapillary",
    enabled: true,
    urlTemplate: "https://www.mapillary.com/app/?lat={lat}&lng={lon}&z=17"
  },
  {
    id: "geohack",
    label: "GeoHack",
    enabled: true,
    urlTemplate: "https://geohack.toolforge.org/geohack.php?params={latAbs}_{latHem}_{lonAbs}_{lonHem}"
  },
  {
    id: "suncalc",
    label: "SunCalc",
    enabled: true,
    urlTemplate: "https://www.suncalc.org/#/{lat},{lon},15/{date}/{time}/1/3"
  },
  {
    id: "wikimapia",
    label: "Wikimapia",
    enabled: true,
    urlTemplate: "https://wikimapia.org/#lang=en&lat={lat}&lon={lon}&z=18&m=b"
  }
];

// Storage only holds user *preferences* (id + enabled, in the user's order) —
// never labels or URL templates. Those always come from OT_DEFAULT_LINKS above,
// so code updates propagate automatically and no attacker-controlled URL can be
// smuggled in via tampered storage. otResolveLinks reconciles stored prefs with
// the current defaults: it keeps the saved order/on-off state, appends any newly
// added default links at the end, and drops links that no longer exist.
function otResolveLinks(storedPrefs) {
  const byId = new Map(OT_DEFAULT_LINKS.map((link) => [link.id, link]));
  const seen = new Set();
  const result = [];

  if (Array.isArray(storedPrefs)) {
    for (const pref of storedPrefs) {
      const def = pref && byId.get(pref.id);
      if (def && !seen.has(def.id)) {
        result.push({...def, enabled: pref.enabled !== false});
        seen.add(def.id);
      }
    }
  }
  for (const def of OT_DEFAULT_LINKS) {
    if (!seen.has(def.id)) {
      result.push({...def});
      seen.add(def.id);
    }
  }
  return result;
}

// Reduce full link objects to the minimal preference form that gets stored.
function otToPrefs(links) {
  return links.map((link) => ({id: link.id, enabled: link.enabled !== false}));
}

// Read prefs out of a storage result, migrating the legacy v1.0 format
// (which stored full link objects under "links") to the new prefs form.
function otReadStoredPrefs(data) {
  if (data && Array.isArray(data.linkPrefs)) return data.linkPrefs;
  if (data && Array.isArray(data.links)) {
    return data.links.map((link) => ({id: link.id, enabled: link.enabled !== false}));
  }
  return null;
}
