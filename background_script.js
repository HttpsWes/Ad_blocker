console.log("Background script loaded!");

let blockedUrls = []; // in-memory list used by shouldBlock()

//loadBlockfile now RETURNS the array (doesn't set blockedUrls directly)
function loadBlockfile() {
  return fetch(browser.runtime.getURL("blocklist.txt"))
    .then((response) => response.text())
    .then((blocklistText) => {
      return blocklistText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "" && !line.startsWith("#"));
    })
    .catch((reason) => console.error("Failed to load blocklist.txt:", reason));
}

//on install, load from file and store in local storage
async function handleInstall(details) {
  const blocked_list = await loadBlockfile();
  if (blocked_list && Array.isArray(blocked_list)) {
    await browser.storage.local.set({ blockedURLs: blocked_list });
    console.log("Saved blocklist to storage:", blocked_list);
  }
}

// update in-memory list whenever storage changes
function handleBlocklistUpdate(changes, areaName) {
  if (areaName === "local" && changes.blockedURLs) {
    blockedUrls = changes.blockedURLs.newValue || [];
    console.log("Updated blockedUrls from storage:", blockedUrls);
  }
}

// Listen for storage changes
browser.storage.onChanged.addListener(handleBlocklistUpdate);

// On startup, read the cached list from storage (fast)
browser.storage.local.get("blockedURLs").then((data) => {
  blockedUrls = data.blockedURLs || [];
  console.log("Loaded blockedUrls from storage on startup:", blockedUrls);
});

function shouldBlock(url) {
  for (const pattern of blockedUrls) {
    if (url.includes(pattern)) return true;
  }
  return false;
}

function logURL(requestDetails) {
  console.log(`Loading: ${requestDetails.url}`);
}

function logAndBlock(requestDetails) {
  logURL(requestDetails);

  if (shouldBlock(requestDetails.url)) {
    console.log("Blocking:", requestDetails.url);
    return { cancel: true };
  }
}

browser.webRequest.onBeforeRequest.addListener(
  logAndBlock,
  { urls: ["<all_urls>"] },
  ["blocking"]
);


browser.runtime.onInstalled.addListener(handleInstall);

