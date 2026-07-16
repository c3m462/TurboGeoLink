// Isolated-world content script. Watches the DOM for Leaflet result popups
// on overpass-turbo.eu and appends configurable map-service links to them.
// OT_DEFAULT_LINKS / otResolveLinks / otReadStoredPrefs come from
// shared/default-links.js (loaded before this file).
(function () {
  // ---- link configuration (cached, refreshed when the options change) -------
  let cachedLinks = null;

  function loadLinks(callback) {
    if (cachedLinks) {
      callback(cachedLinks);
      return;
    }
    chrome.storage.sync.get({linkPrefs: null, links: null}, (data) => {
      cachedLinks = otResolveLinks(otReadStoredPrefs(data));
      callback(cachedLinks);
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && (changes.linkPrefs || changes.links)) {
      cachedLinks = null; // force a reload on the next popup
    }
  });

  // ---- coordinate extraction -------------------------------------------------
  function getLatLonFromPopup(contentNode) {
    const {otLat, otLon} = contentNode.dataset;
    if (otLat !== undefined && otLon !== undefined) {
      const lat = parseFloat(otLat);
      const lon = parseFloat(otLon);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) return {lat, lon};
    }
    // fallback: nodes render a "geo:" link directly in the popup text
    const geoLink = contentNode.querySelector('a[href^="geo:"]');
    if (geoLink) {
      const match = geoLink.getAttribute("href").match(/^geo:(-?[0-9.]+),(-?[0-9.]+)/);
      if (match) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) return {lat, lon};
      }
    }
    return null;
  }

  // ---- URL building ----------------------------------------------------------
  function pad2(n) {
    return n < 10 ? `0${n}` : `${n}`;
  }

  // extra tokens beyond {lat}/{lon}, needed by services with hemisphere-letter
  // (GeoHack) or current-date/time (SunCalc) URL formats
  function buildTokens(latlon) {
    const now = new Date();
    return {
      lat: latlon.lat,
      lon: latlon.lon,
      latAbs: Math.abs(latlon.lat),
      lonAbs: Math.abs(latlon.lon),
      latHem: latlon.lat >= 0 ? "N" : "S",
      lonHem: latlon.lon >= 0 ? "E" : "W",
      date: `${now.getFullYear()}.${pad2(now.getMonth() + 1)}.${pad2(now.getDate())}`,
      time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`
    };
  }

  function fillTemplate(template, tokens) {
    return template.replace(/{(\w+)}/g, (whole, key) =>
      Object.prototype.hasOwnProperty.call(tokens, key) ? tokens[key] : whole
    );
  }

  // defense-in-depth: only ever emit http(s) links, even though every template
  // is code-defined and coordinates are parsed as numbers
  function isSafeHttpUrl(url) {
    return /^https?:\/\//i.test(url);
  }

  function buildLinksList(latlon, links) {
    const list = document.createElement("ul");
    list.className = "ot-extra-links";
    const tokens = buildTokens(latlon);
    links
      .filter((link) => link.enabled)
      .forEach((link) => {
        const url = fillTemplate(link.urlTemplate, tokens);
        if (!isSafeHttpUrl(url)) return;
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = link.label;
        li.appendChild(a);
        list.appendChild(li);
      });
    return list;
  }

  // ---- popup handling --------------------------------------------------------
  function processPopupContent(contentNode) {
    if (!contentNode || contentNode.dataset.otProcessed) return;

    const latlon = getLatLonFromPopup(contentNode);
    if (!latlon) return; // no coordinate available (e.g. click on a bare line/polygon edge)
    contentNode.dataset.otProcessed = "true";

    loadLinks((links) => {
      if (!links.some((link) => link.enabled)) return;
      // guard against the popup being torn down before storage resolved
      if (!contentNode.isConnected) return;
      contentNode.appendChild(buildLinksList(latlon, links));
    });
  }

  function scanNode(node) {
    if (!(node instanceof Element)) return;
    if (node.matches(".leaflet-popup-content")) processPopupContent(node);
    node.querySelectorAll?.(".leaflet-popup-content").forEach(processPopupContent);
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(scanNode);
    }
  });
  observer.observe(document.body, {childList: true, subtree: true});

  // in case a popup is already open when this script starts running
  document.querySelectorAll(".leaflet-popup-content").forEach(processPopupContent);
})();
