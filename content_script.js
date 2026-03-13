console.log("Content script loaded!");
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "show_toast") {
    showToast("Tracker blocked");
  }
});

function showToast(text) {
  const toast = document.createElement("div");
  toast.className = "tracker-toast";
  toast.textContent = text;

  document.body.appendChild(toast);


  setTimeout(() => {
    toast.classList.add("fade-out");
  }, 2000);

  setTimeout(() => {
    toast.remove();
  }, 2500);
}