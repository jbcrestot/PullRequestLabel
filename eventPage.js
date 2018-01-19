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
        !filteredPRByLabel.length
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
        if (!filteredPRByLabel.length) {
          return;
        }

        const topLabel = filteredPRByLabel[0];
        chrome.browserAction.setBadgeText({text: topLabel.pullRequests.length.toString()});
        chrome.browserAction.setBadgeBackgroundColor({color: '#'+topLabel.color});
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
const getView = (filteredLabels) => {
  let html =
`<table>
  <tr>
    <th>label</th>
    <th>number of Pull Request</th>
  </tr>`;
  filteredLabels.forEach((label) => {
      html += `
     <tr>
       <td>${label.name}</td>
       <td>${label.pullRequests.length}</td>
     </tr>`;
  });

return html +
`
</table>`;
};

/**
 * getFilteredLabels is used to format data by regrouping PR name by labels and
 * sorting by Pull Request number
 *
 * labels: [
 *   {
 *     name: string,
 *     color: string,
 *     pullRequests: [
 *       {
 *         title: string,
 *         url: string,
 *         reviews: [
 *           author: string,
 *           state: string,
 *         ],
 *       }
 *     ]
 *   }
 * ]
 */
const orderPRByLabel = (data) => {
  let orderedPRByLabel = [];

  // loop over each PR
  data.data.repository.pullRequests.nodes.forEach((pr) => {
    const currentPullRequest = {
      title: pr.title,
      url: pr.url,
      reviews: pr.reviews.nodes.map(review => {
        return {
          author: review.author.login,
          state: review.state,
        }
      }),
    };
    // loop over each labels
    pr.labels.nodes.forEach((label) => {
      const foundLabelId = orderedPRByLabel.findIndex((el) => label.name === el.name)
      foundLabelId > -1
        ? orderedPRByLabel[foundLabelId].pullRequests.push(currentPullRequest)
        : orderedPRByLabel.push({
          name: label.name,
          color: label.color,
          pullRequests: [currentPullRequest]
        });
    });
  });

  // sorting by pull request number
  orderedPRByLabel = orderedPRByLabel.sort(
    (a, b) => b.pullRequests.length - a.pullRequests.length
  );

  return orderedPRByLabel;
};

/**
 * filterPRByLabel will return data for watched labels
 */
const filterPRByLabel = (watchedLabels, sortedLabels) => {
  const arrayLabels = watchedLabels
    .split(',')
    .map(label => label.trim().toLowerCase());

  return sortedLabels.filter(
    sortedLabel => arrayLabels.includes(sortedLabel.name.toLowerCase())
  );
};

const getQuery = (owner, repository) => {
  return `{
      repository(owner:"${owner}", name:"${repository}") {
        pullRequests(first: 100, states: OPEN) {
          nodes {
            title
            url
            labels(last: 10) {
              nodes {
                name
                color
              }
            }
            reviews(last: 10, states: APPROVED) {
              nodes {
                author {
                  login
                }
                state
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
