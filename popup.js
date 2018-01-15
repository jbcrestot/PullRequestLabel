document.addEventListener('DOMContentLoaded', () => {
  // this is executed each time user click on icon extension
  const pr = document.getElementById('pr');
  // first time
  if (!pr.textContent.length) {
    pr.innerHTML = 'Fetching your data.';
  }

  // get labels and counts
  chrome.runtime.sendMessage({action: 'getFilteredLabels'}, function(response) {
    response === null
      ? pr.innerHTML = 'There is no opened Pull Request with those labels'
      : pr.innerHTML = response;
  });


  // do call a split labels
  // tests de modification de l'icon
  // document.querySelector('#icon').addEventListener('click', () => {
  //   chrome.browserAction.setIcon({path: 'gear.png'});
  //   chrome.browserAction.setBadgeText({text: '2'});
  //   chrome.browserAction.setBadgeBackgroundColor({color: '#ff00ff'});
    // chrome.browserAction.disable();
  // });

  // link to go to config parameters
  document.querySelector('#configButton').addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      // New way to open options pages, if supported (Chrome 42+).
      chrome.runtime.openOptionsPage();
    } else {
      // Reasonable fallback.
      window.open(chrome.runtime.getURL('options.html'));
    }
  });
});
