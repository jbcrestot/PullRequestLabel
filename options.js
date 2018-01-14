// Saves options to chrome.storage.sync.
function save_options() {
  const labels = document.getElementById('labels').value;
  const owner = document.getElementById('owner').value;
  const repository = document.getElementById('repository').value;
  const oauthToken = document.getElementById('oauthToken').value;
  // clean callback message
  document.querySelector('#testConfig').textContent = '';

  chrome.storage.sync.set({
    labels: labels,
    owner: owner,
    repository: repository,
    oauthToken: oauthToken,
  }, function() {
    // Update status to let user know options were saved.
    var status = document.querySelector('#status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 1000);

    // test config
    var testConfig = document.querySelector('#testConfig');
    testConfig.textContent = 'Testing your configuration';
    chrome.runtime.sendMessage({action: 'pingAPI'}, function(response) {
      if (response === VALID_CONFIG) {
        testConfig.textContent = "You're all setup!";
        chrome.browserAction.enable();
        setTimeout(function() {
          testConfig.textContent = '';
        }, 5000);
      } else if (response === BAD_CONFIG) {
        testConfig.textContent = "API reached, but can't find your repo ; plz check your configuration.";
        chrome.browserAction.disable();
      } else if (response === INVALID_TOKEN) {
        testConfig.textContent = "API can't be reach, you probably have a pb with your token";
        chrome.browserAction.disable();
      } else {
        console.log('wtf', response);
      }
    });
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    labels: '',
    owner: '',
    repository: '',
    oauthToken: '',
  }, function(items) {
    document.getElementById('labels').value = items.labels;
    document.getElementById('owner').value = items.owner;
    document.getElementById('repository').value = items.repository;
    document.getElementById('oauthToken').value = items.oauthToken;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
