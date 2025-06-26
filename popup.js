const toggleFilter = document.getElementById("toggleFilter");
const opacitySlider = document.getElementById("opacitySlider");

async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

// Restore saved state when popup opens
(async () => {
  const result = await chrome.storage.local.get(["focusfilterEnabled", "focusfilterOpacity"]);
  toggleFilter.checked = !!result.focusfilterEnabled;
  opacitySlider.value = result.focusfilterOpacity ?? 1;
})();

toggleFilter.addEventListener("change", async () => {
  const enabled = toggleFilter.checked;
  const tab = await getCurrentTab();

  if (enabled) {
    // Inject content.js to create filter if not there
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
  } else {
    // Remove filter by executing content.js to toggle off
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const overlay = document.getElementById("focusfilter-overlay");
        const rect = document.getElementById("focusfilter-rect");
        if (overlay) overlay.remove();
        if (rect) rect.remove();
      },
    });
  }

  await chrome.storage.local.set({ focusfilterEnabled: enabled });
});

opacitySlider.addEventListener("input", async () => {
  const opacity = opacitySlider.value;
  const tab = await getCurrentTab();

  // Send message to content script to update opacity live
  chrome.tabs.sendMessage(tab.id, { action: "setOpacity", value: opacity });

  await chrome.storage.local.set({ focusfilterOpacity: opacity });
});
