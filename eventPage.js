// test at init
chrome.runtime.onInstalled.addListener(() => {
  log('[OnInstalled] ');
  // need to indicate that extension need  config
});

chrome.runtime.onStartup.addListener(() => {
  log('[onStartup]');
})

chrome.runtime.onSuspend.addListener(() => {
  log('[onSuspend]');
})

chrome.alarms.onAlarm.addListener((alarm) => {
  log('[onAlarm] with alarm: ', alarm);

  switch(alarm.name) {
    case ALARM_ICON_INDICATOR:
      updateIconIndicator();
      break;
    default:
      log('[onAlarm] default alarm triggered for alarm: ', alarm);
      break;
  }
});

// extension calls
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('[onMessage] action:', request.action);
  switch(request.action) {
    case 'pingAPI':
      pingAPI(sendResponse, sendResponse);
      break;
    case 'refreshData':
      getFilteredLabels(sendResponse);
      break;
  }

  // we need to return true, to indicate sendResponse will be handle asynchronously
  return true;
});

// periodic calls
chrome.alarms.create(ALARM_ICON_INDICATOR, {
  delayInMinutes: 0,
  periodInMinutes: 5,
});

// notifications
chrome.notifications.onClosed.addListener((id, byUser) => {
  console.log('lets clear it', id, byUser);
  
});

chrome.notifications.onClicked.addListener((id) => {
  console.log('click!', id);
});
