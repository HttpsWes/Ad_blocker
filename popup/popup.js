document.addEventListener("DOMContentLoaded", () => {
  async function updateUI() {
    let data = await browser.storage.local.get("totalBlocked");
    let count = data.totalBlocked || 0;
    document.getElementById("total-blocked").textContent = count;
  }

  document.getElementById("reset-stats").addEventListener("click", async () => {
    await browser.storage.local.set({ totalBlocked: 0 });
    updateUI();
  });

  browser.runtime.onMessage.addListener((message) => {
    if (message.action === "update_count") {
      document.getElementById("total-blocked").textContent = message.value;
    }
  });

  updateUI();
});