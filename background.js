// Minimal service worker: clicking the toolbar icon opens the options page.
// (No persistent state, no extra permissions — the worker stays dormant until
// the icon is clicked.)
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
