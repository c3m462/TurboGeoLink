// Runs in the page's own JS context ("world": "MAIN" in manifest.json).
// overpass-turbo.eu exposes Leaflet globally as window.L. Every result popup
// is created via `L.popup(...).setLatLng(latlng).setContent(...)`, so hooking
// L.Popup.prototype.onAdd lets us read the exact coordinate Leaflet already
// computed for that popup (node position, way/relation center marker, or the
// clicked point on a line/polygon) without touching any network traffic.
(function () {
  function patchLeafletPopup(L) {
    if (!L || !L.Popup || L.Popup.prototype.__otPatched) return;
    const originalOnAdd = L.Popup.prototype.onAdd;
    L.Popup.prototype.onAdd = function (map) {
      originalOnAdd.call(this, map);
      try {
        const latlng = this.getLatLng();
        if (latlng && this._contentNode) {
          this._contentNode.dataset.otLat = latlng.lat;
          this._contentNode.dataset.otLon = latlng.lng;
        }
      } catch (err) {
        // no coordinate available for this popup - the content script will
        // simply skip adding extra links for it
      }
    };
    L.Popup.prototype.__otPatched = true;
  }

  const timer = setInterval(() => {
    if (window.L) {
      patchLeafletPopup(window.L);
      clearInterval(timer);
    }
  }, 50);
  // give up after 30s in case overpass-turbo ever stops exposing window.L
  setTimeout(() => clearInterval(timer), 30000);
})();
