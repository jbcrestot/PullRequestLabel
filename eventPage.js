const VALID_CONFIG = 10;
const BAD_CONFIG = 11;
const INVALID_TOKEN = 12;
const ALARM_ICON_INDICATOR = 'iconIndicator';

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

chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('onAlarm', alarm);

  switch(alarm.name) {
    case ALARM_ICON_INDICATOR:
      updateIconIndicator();
      break;
    default:
      console.log('default alarm switch', alarm);
      break;
  }
});

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

// periodic calls
chrome.alarms.create(ALARM_ICON_INDICATOR, {
  delayInMinutes: 0,
  periodInMinutes: 5,
});

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
        !filteredPRByLabel.size
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

const updateIconIndicator = () => {
  getParameters((config) => {
    call(
      getQuery(config.owner, config.repository),
      config.oauthToken,
      (response) => {
        const orderedPRByLabel = orderPRByLabel(response);
        const filteredPRByLabel = filterPRByLabel(config.labels, orderedPRByLabel);
        // if no object found
        if (!filteredPRByLabel.size) {
          return;
        }

        chrome.browserAction.setBadgeText({text: [...filteredPRByLabel.values()][0].length.toString()});
        // chrome.browserAction.setBadgeBackgroundColor({color: '#ff00ff'});
      },
      (errorReason) => {
        console.log('updateIconIndicator error with reason: ', errorReason);

      }
    )
  });
}

/**
 * getView return an html view for popup
 */
const getView = (data) => {
  let html =
`<table>
  <tr>
    <th>label</th>
    <th>number of Pull Request</th>
  </tr>`;
  data.forEach((value, key) => {
      html += `
     <tr>
       <td>${key}</td>
       <td>${value.length}</td>
     </tr>`;
  });
  console.log(html);

return html +
`
</table>`;
};

/**
 * getFilteredLabels is used to format data by regrouping PR name by labels and
 * sorting by Pull Request number
 */
const orderPRByLabel = (data) => {
  let orderedPRByLabel = new Map();

  // loop over each PR
  data.data.repository.pullRequests.nodes.forEach((pr) => {
    // loop over each labels
    pr.labels.edges.forEach((label) => {
      orderedPRByLabel.has(label.node.name)
        ? orderedPRByLabel.get(label.node.name).push(pr.title)
        : orderedPRByLabel.set(label.node.name, [pr.title]);
    });
  });

  // sorting by pull request number
  orderedPRByLabel = new Map([...orderedPRByLabel.entries()].sort(
    (a, b) => b[1].length - a[1].length
  ));

  return orderedPRByLabel;
};

/**
 * filterPRByLabel will return data for watched labels
 */
const filterPRByLabel = (watchedLabels, labels) => {
  const arrayLabels = watchedLabels
    .split(',')
    .map(label => label.trim().toLowerCase());

  return new Map([...labels.entries()].filter(
    el => arrayLabels.includes(el[0].toLowerCase())
  ));
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
