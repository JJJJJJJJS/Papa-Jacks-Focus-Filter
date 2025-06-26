chrome.action.onClicked.addListener((tab) => {
  if (!tab.url.startsWith("http")) {
    console.warn("Cannot run Papa Jack's Focus Filter on this page.");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});