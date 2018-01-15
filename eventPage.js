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
      getFilteredLabels(sendResponse, sendResponse);
      break;
  }

  // we need to return true, to indicate sendResponse will be handle asynchronously
  return true;
});

const VALID_CONFIG = 10;
const BAD_CONFIG = 11;
const INVALID_TOKEN = 12;

/**
 * pingAPI will test if user params are ok and disable icon if not
 */
const pingAPI = (success, error) => {
  getParameters((config) => {
    call(
      getQuery(config.owner, config.repository),
      config.oauthToken,
      (response) => {
        if (!response.errors) {
          success(VALID_CONFIG);
        } else {
          error(BAD_CONFIG);
        }
      },
      (errorReason) => {
        console.log('pingAPI error with reason: ', errorReason);
        error(errorReason);
      }
    )
  });
};

const getFilteredLabels = (success, error) => {
  getParameters((config) => {
    call(
      getQuery(config.owner, config.repository),
      config.oauthToken,
      (response) => {
        const orderedPRByLabel = orderPRByLabel(response);
        const filteredPRByLabel = filterPRByLabel(config.labels, orderedPRByLabel);
        // if no object found
        !Object.keys(filteredPRByLabel).length
          ? success(null)
          : success(getView(filteredPRByLabel));
      },
      (errorReason) => {
        console.log('getFilteredLabels error with reason: ', errorReason);
        error(errorReason);
      }
    )
  });
};

const getView = (data) => {
  let html =
`<table>
  <tr>
    <th>label</th>
    <th>number of Pull Request</th>
  </tr>`;
  Object.keys(data).forEach((label) => {
      html += `
     <tr>
       <td>${label}</td>
       <td>${data[label].length}</td>
     </tr>`;
  });

return html +
`
</table>
`;
};

const orderPRByLabel = (data) => {
  let orderedPRByLabel = {};

  // loop over each PR
  data.data.repository.pullRequests.nodes.forEach((pr) => {
    // loop over each labels
    pr.labels.edges.forEach((label) => {
      orderedPRByLabel[label.node.name]
        ? orderedPRByLabel[label.node.name].push(pr.title)
        : orderedPRByLabel[label.node.name] = [pr.title];
    });
  });

  return orderedPRByLabel;
};

const filterPRByLabel = (watchedLabels, labels) => {
  const arrayLabels = watchedLabels
    .split(',')
    .map(label => label.trim());

  const filteredPRByLabel = {};
  Object.keys(labels).forEach(label => {
    if (arrayLabels.includes(label)) {
      filteredPRByLabel[label] = labels[label];
    }
  });

  return filteredPRByLabel
};

const getQuery = (owner, repository) => {
  return `{
      repository(owner:"${owner}", name:"${repository}") {
        pullRequests(last:100, states:OPEN) {
          nodes {
            title
            labels(last:100) {
              edges {
                node {
                  id
                  name
                  color
                }
              }
            }
          }
        }
      }
    }`;
};

const call = (query, token, success, error) => {
  const url = 'https://api.github.com/graphql';

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
