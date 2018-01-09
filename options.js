// Saves options to chrome.storage.sync.
function save_options() {
  const labels = document.getElementById('labels').value;
  const oauthToken = document.getElementById('oauthToken').value;
  console.log('labels to save', labels);

  chrome.storage.sync.set({
    labels: labels,
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
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    labels: '',
    oauthToken: '',
  }, function(items) {
    console.log('labels restored :', items.labels);
    document.getElementById('labels').value = items.labels;
    document.getElementById('oauthToken').value = items.oauthToken;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
