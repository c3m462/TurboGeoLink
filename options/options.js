// OT_DEFAULT_LINKS, otResolveLinks, otToPrefs and otReadStoredPrefs come from
// shared/default-links.js (loaded before this file).
const linkListEl = document.getElementById("link-list");
const saveButtonEl = document.getElementById("save-button");
const statusEl = document.getElementById("status");

let currentLinks = [];

function render() {
  linkListEl.innerHTML = "";
  currentLinks.forEach((link, index) => {
    const li = document.createElement("li");
    li.className = "link-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = link.enabled;
    checkbox.addEventListener("change", () => {
      currentLinks[index].enabled = checkbox.checked;
    });

    const label = document.createElement("span");
    label.textContent = link.label;
    label.className = "link-label";

    const upButton = document.createElement("button");
    upButton.textContent = "↑";
    upButton.title = "Nach oben verschieben";
    upButton.disabled = index === 0;
    upButton.addEventListener("click", () => moveLink(index, -1));

    const downButton = document.createElement("button");
    downButton.textContent = "↓";
    downButton.title = "Nach unten verschieben";
    downButton.disabled = index === currentLinks.length - 1;
    downButton.addEventListener("click", () => moveLink(index, 1));

    li.append(checkbox, label, upButton, downButton);
    linkListEl.appendChild(li);
  });
}

function moveLink(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= currentLinks.length) return;
  [currentLinks[index], currentLinks[target]] = [currentLinks[target], currentLinks[index]];
  render();
}

function load() {
  chrome.storage.sync.get({linkPrefs: null, links: null}, (data) => {
    currentLinks = otResolveLinks(otReadStoredPrefs(data));
    render();
  });
}

function save() {
  // store only preferences (id + enabled, in order); drop the legacy full-object key
  chrome.storage.sync.set({linkPrefs: otToPrefs(currentLinks)}, () => {
    chrome.storage.sync.remove("links");
    statusEl.textContent = "Gespeichert.";
    setTimeout(() => (statusEl.textContent = ""), 2000);
  });
}

saveButtonEl.addEventListener("click", save);
load();
