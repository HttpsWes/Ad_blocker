document.addEventListener("DOMContentLoaded", () => {
  function getPrivacyGrade(count) {
    if (count >= 6) return "A";
    if (count >= 1) return "B";
    return "C";
  }

  async function updateUI() {
    let data = await browser.storage.local.get("totalBlocked");
    let count = data.totalBlocked || 0;

    document.getElementById("total-blocked").textContent = count;
    document.getElementById("privacy-grade").textContent = getPrivacyGrade(count);
  }

  document.getElementById("reset-stats").addEventListener("click", async () => {
    await browser.storage.local.set({ totalBlocked: 0, blockedCounts: {} });

    browser.runtime.sendMessage({
      action: "reset_stats"
    }).catch(() => {});

    updateUI();
  });

  browser.runtime.onMessage.addListener((message) => {
    if (message.action === "update_count") {
      document.getElementById("total-blocked").textContent = message.value;
      document.getElementById("privacy-grade").textContent = getPrivacyGrade(message.value);
    }
  });

  updateUI();
});