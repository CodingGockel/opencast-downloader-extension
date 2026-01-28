const foundUrls = {};

chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.method === "GET") {
      const url = details.url;
      if (url.includes('presenter.smil') && url.endsWith('.ts')) {
        console.log("Gefilterte URL gefunden:", url);
        
        const lastUnderscoreIndex = url.lastIndexOf('_');
        if (lastUnderscoreIndex > -1) {
            const baseUrl = url.substring(0, lastUnderscoreIndex + 1);
            const urlTemplate = `${baseUrl}{}.ts`;

            foundUrls[details.tabId] = urlTemplate;
            chrome.runtime.sendMessage({ type: 'URL_FOUND', payload: urlTemplate });
        }
      }
    }
  },
  { urls: ["<all_urls>"] }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'get_status') {
        const tabId = sender.tab.id;
        const url = foundUrls[tabId];
        sendResponse(url ? { type: 'URL_FOUND', payload: url } : { type: 'NOT_FOUND' });
    }
    return true; 
});
