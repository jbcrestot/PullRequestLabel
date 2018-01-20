const VALID_CONFIG = 10;
const BAD_CONFIG = 11;
const INVALID_TOKEN = 12;
const ALARM_ICON_INDICATOR = 'iconIndicator';
const IS_DEBUG_ENABLED = true;

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
        log('[pingAPI] error with reason: ', errorReason);
        error(errorReason);
      }
    )
  });
};

const getFilteredLabels = (callback) => {
  getParameters((config) => {
    call(
      getQuery(config.owner, config.repository),
      config.oauthToken,
      (response) => {
        const orderedPRByLabel = orderPRByLabel(response);
        const filteredPRByLabel = filterPRByLabel(config.labels, orderedPRByLabel);
        log('[getFilteredLabels] filteredPRByLabel: ', filteredPRByLabel)
        // if no object found
        !filteredPRByLabel.length
          ? callback(null)
          : callback(filteredPRByLabel);
      },
      (errorReason) => {
        log('[getFilteredLabels] error with reason: ', errorReason);
        callback(errorReason);
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
        log('[updateIconIndicator] success with response: ', response);
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
        log('[updateIconIndicator] error with reason: ', errorReason);
      }
    )
  });
}

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
      id: pr.id,
      title: pr.title,
      url: pr.url,
      author: pr.author,
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

  const filteredLabels = sortedLabels.filter(
    sortedLabel => arrayLabels.includes(sortedLabel.name.toLowerCase())
  );

  // saving data in local storage
  saveData(filteredLabels, (status) => {
    log('[filterPRByLabel] data saved with status: ', status);
  })

  return filteredLabels;
};

const getQuery = (owner, repository) => {
  return `{
      repository(owner:"${owner}", name:"${repository}") {
        pullRequests(first: 100, states: OPEN) {
          nodes {
            id
            title
            url
            author {
              login
              avatarUrl
            }
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
         log('[call] success with response: ', xhr.response)
         success(xhr.response);
       } else {
         log(`[call] fail with state: ${xhr.readyState}, status: ${xhr.status}, response: ${xhr.response}`);
         // probably bad token
         error(INVALID_TOKEN);
       }
    } else {
      // here are the not done state, if need to debug
    }
  };

  xhr.open("POST", url, true);
  xhr.setRequestHeader('Authorization', 'Bearer '+token);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.timeout = 5000;
  xhr.send(JSON.stringify({query: query}));
};

const saveData = (data, callback) => {
  chrome.storage.sync.set({
    data: data,
  }, () => {
    log('[saveData] saving data: ', data)
    callback('ok');
  });
}

const getData = (callback) => {
  chrome.storage.sync.get({
    data: '',
  }, (items) => {
    log('[getData] retrieved data: ', items.data);
    callback(items.data);
  });
}

const clearData = () => {
  chrome.stoarge.sync.clear('data', () => {
    log('[clearData] data have been cleared');
  });
}

const addPullRequestToNotificationStack = (pullRequest, callback) => {
  log('***********')
  chrome.storage.sync.get({
    notifs: [],
  }, (items) => {
    log('[addPullRequestToNotificationStack] getData notifs: ', typeof items.notifs, items.notifs);
    items.notifs.push(pullRequest)
    // save
    chrome.storage.sync.set({
      notifs: items.notifs,
    }, () => {
      log('[addPullRequestToNotificationStack] saving notifs: ', items.notifs)
      callback('ok');
    });
  });
};

/**
 * Return the next notification data to display
 */
const getNextNotif = () => {
  return 1;
};

const getParameters = (callback) => {
  chrome.storage.sync.get({
    labels: '',
    owner: '',
    repository: '',
    oauthToken: '',
  }, (items) => {
    callback(items);
  });
};

const log = function() {
  if (IS_DEBUG_ENABLED) {
    console.log(...arguments);
  }
}
