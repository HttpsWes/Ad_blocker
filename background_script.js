console.log("Background script loaded!");

let blockedUrls = [];
let totalBlocked = 0;
let blockedCounts = {}; // { pattern: count }

// load blocklist file
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

async function handleInstall() {
  const blocked_list = await loadBlockfile();
  if (blocked_list && Array.isArray(blocked_list)) {
    await browser.storage.local.set({
      blockedURLs: blocked_list,
      totalBlocked: 0,
      blockedCounts: {}
    });
    console.log("Installed: saved blocklist + initialized counters.");
  }
}

function handleStorageUpdate(changes, areaName) {
  if (areaName !== "local") return;

  if (changes.blockedURLs) blockedUrls = changes.blockedURLs.newValue || [];
  if (changes.totalBlocked) totalBlocked = changes.totalBlocked.newValue ?? 0;
  if (changes.blockedCounts) blockedCounts = changes.blockedCounts.newValue || {};
}

browser.storage.onChanged.addListener(handleStorageUpdate);

async function loadFromStorage() {
  const data = await browser.storage.local.get([
    "blockedURLs",
    "totalBlocked",
    "blockedCounts"
  ]);

  blockedUrls = data.blockedURLs || [];
  totalBlocked = data.totalBlocked ?? 0;
  blockedCounts = data.blockedCounts || {};

  console.log("Startup loaded from storage:", {
    blockedUrls,
    totalBlocked,
    blockedCounts
  });
}
loadFromStorage();

function getMatchedPattern(url) {
  for (const pattern of blockedUrls) {
    if (url.includes(pattern)) return pattern;
  }
  return null;
}

async function recordBlock(matchedPattern, tabId) {
  totalBlocked += 1;

  if (matchedPattern) {
    blockedCounts[matchedPattern] = (blockedCounts[matchedPattern] || 0) + 1;
  }

  await browser.storage.local.set({
    totalBlocked,
    blockedCounts
  });

  // Update popup if open
  browser.runtime.sendMessage({
    action: "update_count",
    value: totalBlocked
  }).catch(() => {
    // popup may not be open
  });

  // Tell the content script to show a toast on the page
  if (tabId >= 0) {
    browser.tabs.sendMessage(tabId, {
      action: "show_toast",
      value: matchedPattern
    }).catch(() => {
      // some pages may not have a content script available
    });
  }
}

function logURL(requestDetails) {
  console.log(`Loading: ${requestDetails.url}`);
}

function logAndBlock(requestDetails) {
  logURL(requestDetails);

  const matched = getMatchedPattern(requestDetails.url);
  if (matched) {
    console.log("Blocking:", requestDetails.url, "matched:", matched);

    recordBlock(matched, requestDetails.tabId).catch(console.error);

    return { cancel: true };
  }
}

browser.webRequest.onBeforeRequest.addListener(
  logAndBlock,
  { urls: ["<all_urls>"] },
  ["blocking"]
);

browser.runtime.onInstalled.addListener(handleInstall);