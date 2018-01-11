let token = '';
let labels = [];

const testGithubAPI = () => {
  getParameters((config) => {
    call(
      ['repos', config.owner, config.repository, 'issues'],
      config.oauthToken
    )
  });
};

const call = (options, token) => {
  // add url to options
  const url = ['https://api.github.com'].concat(options).join('/');

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {

    if (xhr.readyState == XMLHttpRequest.DONE) {
       if (xhr.status === 200) {
         console.log('success', xhr.status)
       } else {
         console.log('[fail] get', xhr.readyState, xhr.status, xhr.responseText);
         chrome.browserAction.disable();
       }
    } else {
      // here are the not done state, if need to debug
    }
  };

  // Implemented elsewhere.
  xhr.open("GET", url, true);
  xhr.setRequestHeader('Authorization', 'token '+token);
  xhr.timeout = 2000;
  xhr.send();
};

const getParameters = (callback) => {
  chrome.storage.sync.get({
    labels: '',
    owner: '',
    repository: '',
    oauthToken: '',
  }, (items) => {
    callback(items)
  });
};

// tests at init
chrome.runtime.onInstalled.addListener(() => {
  console.log('installation');
  testGithubAPI()
});
