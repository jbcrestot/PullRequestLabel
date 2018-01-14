

// test at init
chrome.runtime.onInstalled.addListener(() => {
  console.log('OnInstalled');
  // need to indicate that extension need  config
});

chrome.runtime.onStartup.addListener(() => {
  console.log('onStartup');
})

chrome.runtime.onSuspend.addListener(() => {
  console.log('onSuspend');
})

// recurent calls



// extension calls
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('inMessage');
  switch(request.action) {
    case 'pingAPI':
      pingAPI(sendResponse, sendResponse);
      break;
    case 'getFilteredLabels':
      getFilteredLabels();
      break;
  }

  // we need to return true, to indicate sendResponse will be handle asynchronously
  return true;
});

let token = '';
let labels = [];

const VALID_CONFIG = 10;
const BAD_CONFIG = 11;
const INVALID_TOKEN = 12;

/**
 * pingAPI will test if user params are ok and disable icon if not
 */
const pingAPI = (success, error) => {
  getParameters((config) => {
    call(
      ['repos', config.owner, config.repository, 'issues'],
      config.oauthToken,
      (response) => {
        if (!response.errors) {
          success(VALID_CONFIG);
        } else {
          error(BAD_CONFIG);
        }
      },
      (errorReason) => {
        console.log('pingAPI error with reason: '+ errorReason);
        error(errorReason);
      }
    )
  });
};

const getFilteredLabels = (success, error) => {
  console.log(error);
  getParameters((config) => {
    call(
      ['repos', config.owner, config.repository, 'issues'],
      config.oauthToken,
      (response) => {

        filterResponse(config.labels, response);

        success('ok');
      },
      (errorStatus, errorResponse) => {
        console.log(error);
        error('ko');
      }
    )
  });
};

const filterResponse = (watchedLabels, response) => {
  const arrayLabels = watchedLabels.split(',').map(label => label.trim())
  console.log(arrayLabels, response);
};

const call = (options, token, success, error) => {
  const url = 'https://api.github.com/graphql';
  const query = `{
      repository(owner:"${options[1]}", name:"${options[2]}") {
        pullRequests(last:100, states:OPEN) {
          nodes {
            title
            labels(last:100) {
              edges {
                node {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }`;

  var xhr = new XMLHttpRequest();
  xhr.responseType = 'json';
  xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
       if (xhr.status === 200) {
         console.log('call/success: ', xhr.status)
         success(xhr.response);
       } else {
         console.log('call/fail: ', xhr.readyState, xhr.status, xhr.response);
         // probably bad token
         error(INVALID_TOKEN);
       }
    } else {
      // here are the not done state, if need to debug
    }
  };

  // Implemented elsewhere.
  xhr.open("POST", url, true);
  xhr.setRequestHeader('Authorization', 'Bearer '+token);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.timeout = 5000;
  xhr.send(JSON.stringify({query: query}));
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
