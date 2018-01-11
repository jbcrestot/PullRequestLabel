// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let label = [];

// This extension loads the saved background color for the current tab if one
// exists. The user can select a new background color from the dropdown for the
// current page, and it will be saved as part of the extension's isolated
// storage. The chrome.storage API is used for this purpose. This is different
// from the window.localStorage API, which is synchronous and stores data bound
// to a document's origin. Also, using chrome.storage.sync instead of
// chrome.storage.local allows the extension data to be synced across multiple
// user devices.
document.addEventListener('DOMContentLoaded', () => {
  console.log('$$$$$$$$$$ LOADING $$$$$$$$$$');
  let token = undefined;
  // let isGithubReachable = true;
  // if (!isGithubReachable) {
  //   chrome.browserAction.disable();
  // }
  testGithubAPI();

  const githubUrl = 'https://api.github.com/repos/canaltp/adm/issues';

  // filter by type
    const continueplz = () => {
      console.log('token', token);

      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {

        if (xhr.readyState == XMLHttpRequest.DONE && xhr.status === 200) {
          console.log('======', xhr.status)

        }
        else {
            console.log('get', xhr.readyState, xhr.status, xhr.responseText);
        }
      }; // Implemented elsewhere.
      xhr.open("GET", githubUrl, true);
      xhr.setRequestHeader('Authorization', 'token '+token);
      xhr.send();
    }

    chrome.storage.sync.get({labels: '', oauthToken: ''}, (items) => {
      console.log('split d unités', items.labels.split(',').map(item => item.trim()));
      token = items.oauthToken;
      console.log('token', token);
      // continueplz();

    });
    const pr = document.querySelector('#pr');

  // tests de modification de l'icon
  document.querySelector('#icon').addEventListener('click', () => {
    chrome.browserAction.setIcon({path: 'gear.png'});
    chrome.browserAction.setBadgeText({text: '2'});
    chrome.browserAction.setBadgeBackgroundColor({color: '#ff00ff'});
    // chrome.browserAction.disable();
  });

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
