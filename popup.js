// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let label = [];

document.addEventListener('DOMContentLoaded', () => {
  console.log('$$$$$$$$$$ LOADING $$$$$$$$$$');
  let token = undefined;
  const pr = document.querySelector('#pr');

  // 1) if disable display a specific message

  // 2) when user click the setIcon


  // do call a split labels
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
