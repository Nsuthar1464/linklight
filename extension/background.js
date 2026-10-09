chrome.runtime.onInstalled.addListener(async details=>{
 // Remove legacy personal keys when upgrading to server-backed checks.
 await chrome.storage.local.remove('apiKey');
 if(details.reason==='install')await chrome.tabs.create({url:chrome.runtime.getURL('camera-permission.html')});
});
