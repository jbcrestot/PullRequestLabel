// Saves options to chrome.storage.sync.
function save_options() {
  const labels = document.getElementById('labels').value;
  const owner = document.getElementById('owner').value;
  const repository = document.getElementById('repository').value;
  const oauthToken = document.getElementById('oauthToken').value;
  // chrome.runtime.getBackgroundPage((window) => {
  //   console.log('gbpage', window, testGithubAPI)
  // });

  chrome.storage.sync.set({
    labels: labels,
    owner: owner,
    repository: repository,
    oauthToken: oauthToken,
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
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
