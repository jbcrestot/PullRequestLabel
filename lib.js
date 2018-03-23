const VALID_CONFIG = 10;
const BAD_CONFIG = 11;
const INVALID_TOKEN = 12;
const ALARM_ICON_INDICATOR = "iconIndicator";
const GITHUB_URI = "https://github.com";

let IS_DEBUG_ENABLED = false;
let params = {
  owner: undefined,
  repository: undefined,
  oauthToken: undefined,
  labels: undefined
};

/**
 * pingAPI will test if user params are ok and disable icon if not
 */
const pingAPI = (success, error) => {
  getParameters(config => {
    call(
      getQuery(config.owner, config.repository),
      config.oauthToken,
      response => {
        if (!response.errors) {
          success(VALID_CONFIG);
        } else {
          error(BAD_CONFIG);
        }
      },
      errorReason => {
        log("[pingAPI] error with reason: ", errorReason);
        error(errorReason);
      }
    );
  });
};

const getFilteredLabels = callback => {
  getParameters(config => {
    call(
      getQuery(config.owner, config.repository),
      config.oauthToken,
      response => {
        const orderedPRByLabel = orderPRByLabel(response);
        const filteredPRByLabel = filterPRByLabel(
          config.labels,
          orderedPRByLabel
        );
        log("[getFilteredLabels] filteredPRByLabel: ", filteredPRByLabel);
        log(
          "[getFilteredLabels] filteredPRByLabel.length: ",
          filteredPRByLabel.length
        );
        // if no object found
        !filteredPRByLabel.length
          ? callback(null)
          : callback(filteredPRByLabel);
      },
      errorReason => {
        log("[getFilteredLabels] error with reason: ", errorReason);
        callback(errorReason);
      }
    );
  });
};

const updateIconIndicator = () => {
  getParameters(config => {
    call(
      getQuery(config.owner, config.repository),
      config.oauthToken,
      response => {
        log("[updateIconIndicator] success with response: ", response);
        const orderedPRByLabel = orderPRByLabel(response);
        const filteredPRByLabel = filterPRByLabel(
          config.labels,
          orderedPRByLabel
        );
        // if no object found
        if (!filteredPRByLabel.length) {
          return;
        }

        const topLabel = filteredPRByLabel[0];
        chrome.browserAction.setBadgeText({
          text: topLabel.pullRequests.length.toString()
        });
        chrome.browserAction.setBadgeBackgroundColor({
          color: "#" + topLabel.color
        });
      },
      errorReason => {
        log("[updateIconIndicator] error with reason: ", errorReason);
      }
    );
  });
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
const orderPRByLabel = data => {
  let orderedPRByLabel = [];
  // loop over each PR
  data.data.repository.pullRequests.nodes.forEach(pr => {
    const currentPullRequest = {
      id: pr.id,
      title: pr.title,
      url: pr.url,
      author: pr.author,
      reviews: pr.reviews.nodes.map(review => {
        return {
          author: review.author.login,
          state: review.state
        };
      })
    };
    // loop over each labels
    pr.labels.nodes.forEach(label => {
      const foundLabelId = orderedPRByLabel.findIndex(
        el => label.name === el.name
      );
      foundLabelId > -1
        ? orderedPRByLabel[foundLabelId].pullRequests.push(currentPullRequest)
        : orderedPRByLabel.push({
            name: label.name,
            color: label.color,
            url: getLabelUrl(label.name),
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
    .split(",")
    .map(label => label.trim().toLowerCase());

  const filteredLabels = sortedLabels.filter(sortedLabel =>
    arrayLabels.includes(sortedLabel.name.toLowerCase())
  );

  // saving data in local storage
  saveData(filteredLabels, status => {
    log("[filterPRByLabel] data saved with status: ", status);
  });

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

const getRateLimitQuery = () => `query {
  viewer {
    login
  }
  rateLimit {
    limit
    cost
    remaining
    resetAt
  }
}`;

const githubMock = JSON.parse(`
[{"name":"need QA validation","color":"cc317c","pullRequests":[{"id":"MDExOlB1bGxSZXF1ZXN0MTYxMTU2Mzk5","title":"[POC] Veery SDK","url":"https://github.com/CanalTP/ADM/pull/594","reviews":[{"author":"staifn","state":"APPROVED"},{"author":"jbcrestot","state":"APPROVED"},{"author":"MoOx","state":"APPROVED"}]},{"id":"MDExOlB1bGxSZXF1ZXN0MTYyOTkwNjk2","title":"Rcu 778 center button","url":"https://github.com/CanalTP/ADM/pull/615","reviews":[{"author":"MoOx","state":"APPROVED"},{"author":"staifn","state":"APPROVED"},{"author":"VincentCATILLON","state":"APPROVED"},{"author":"jbcrestot","state":"APPROVED"}]}]},{"name":"need reviews","color":"fbca04","pullRequests":[{"id":"MDExOlB1bGxSZXF1ZXN0MTY0MDMwNDQx","title":"RCU-866 track events with a minimal edit in files","url":"https://github.com/CanalTP/ADM/pull/626","reviews":[{"author":"staifn","state":"APPROVED"}]},
{"id":"MDExOlB1bGxSZXF1ZXN0MTY0MDMwNDQjb","title":"RCU-866 track events with a minimal edit in files","url":"https://github.com/CanalTP/ADM/pull/626","reviews":[{"author":"staifn","state":"APPROVED"}]}
]}]
`);

const call = (query, token, success, error) => {
  const url = "https://api.github.com/graphql";

  var xhr = new XMLHttpRequest();
  xhr.responseType = "json";
  xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        log("[call] success with response: ", xhr.response);
        success(xhr.response);
      } else {
        log(
          `[call] fail with state: ${xhr.readyState}, status: ${
            xhr.status
          }, response: ${xhr.response}`
        );
        // probably bad token
        error(INVALID_TOKEN);
      }
    } else {
      // here are the not done state, if need to debug
    }
  };

  xhr.open("POST", url, true);
  xhr.setRequestHeader("Authorization", "Bearer " + token);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.timeout = 5000;
  xhr.send(JSON.stringify({ query: query }));
};

const saveData = (data, callback) => {
  chrome.storage.sync.set(
    {
      data: data
    },
    () => {
      log("[saveData] saving data: ", data);
      callback("ok");
    }
  );
};

const getData = callback => {
  chrome.storage.sync.get(
    {
      data: ""
    },
    items => {
      log("[getData] retrieved data: ", items.data);
      callback(items.data);
    }
  );
};

const clearData = () => {
  chrome.storage.sync.clear(() => {
    log("[clearData] data have been cleared");
  });
};

const addPullRequestToNotificationStack = (pullRequest, callback) => {
  log("[addPullRequestToNotificationStack] incoming - pr: ", pullRequest);
  chrome.storage.sync.get(
    {
      notifs: []
    },
    items => {
      log("[addPullRequestToNotificationStack] getData notifs: ", items.notifs);
      items.notifs.push(pullRequest);
      // save
      chrome.storage.sync.set(
        {
          notifs: items.notifs
        },
        () => {
          log(
            "[addPullRequestToNotificationStack] saving notifs: ",
            items.notifs
          );
          callback && callback("ok");
        }
      );
    }
  );
};

/**
 * Return the next notification data to display
 */
const getNextNotif = callback => {
  log("[getNextNotif] incoming - cb: ", callback);
  chrome.storage.sync.get(
    {
      notifs: []
    },
    items => {
      log("[getNextNotif] getData notifs: ", items.notifs);
      const firstPullRequest = items.notifs.shift();

      // now we save back the notifications
      chrome.storage.sync.set(
        {
          notifs: items.notifs
        },
        () => {
          log("[getNextNotif] saving notifs: ", items.notifs);
        }
      );

      callback && callback(firstPullRequest);
    }
  );
};

const getParameters = callback => {
  chrome.storage.sync.get(
    {
      labels: "",
      owner: "",
      repository: "",
      oauthToken: "",
      debug: ""
    },
    items => {
      params = { ...params, ...items };
      IS_DEBUG_ENABLED = items.debug;
      callback(params);
    }
  );
};

const log = function() {
  if (!params.oauthToken) {
    getParameters(config => log(...arguments));
    return;
  }

  if (IS_DEBUG_ENABLED) {
    console.log(...arguments);
  }
};

const Box = x => ({
  map: f => Box(f(x)),
  fold: f => f(x)
});

const getLabelUrl = labelName =>
  Box(labelName)
    .map(encodeURI)
    .fold(encodedLabel =>
      GITHUB_URI.concat(
        "/",
        params.owner,
        "/",
        params.repository,
        "/pulls?q=is%3Apr+is%3Aopen+label%3A%22",
        encodedLabel,
        "%22"
      )
    );
