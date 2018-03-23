document.addEventListener("DOMContentLoaded", () => {
  // this is executed each time user click on icon extension
  const pr = document.getElementById("pr");
  let currentData = undefined;
  // first time
  // if (!pr.textContent.length) {
  //   pr.innerHTML = 'Fetching your data.';
  // }

  const render = data => {
    currentData = data;
    pr.innerHTML = !data.length
      ? "There is no opened Pull Request with the monitored labels."
      : getView(data);
  };

  // retrieve from local storage and immediatly display
  getData(render);

  // we add a spinner during call
  const ALARM_LOADER = "alarm_loader";
  const loader = document.getElementById("loader");
  loader.style.display = "block";
  chrome.alarms.onAlarm.addListener(alarm => {
    log("[onAlarm] with alarm: ", alarm);

    if (alarm.name === ALARM_LOADER) {
      loader.style.display = "none";
    }
  });

  // launch refresh
  chrome.runtime.sendMessage({ action: "refreshData" }, updatedData => {
    console.log("rerezzer", updatedData);
    refreshView(updatedData);

    // create alarm in order to remove loader and avoid to quick (dis)appear
    chrome.alarms.create(ALARM_LOADER, {
      when: Date.now() + 1000
    });
  });

  const updatedDataMock = JSON.parse(`
    [{"name":"need QA validation","color":"cc317c","pullRequests":[{"id":"MDExOlB1bGxSZXF1ZXN0MTYxMTU2Mzk5","title":"[POC] Veery SDK","url":"https://github.com/CanalTP/ADM/pull/594","reviews":[{"author":"staifn","state":"APPROVED"},{"author":"jbcrestot","state":"APPROVED"},{"author":"MoOx","state":"APPROVED"}]},{"id":"MDExOlB1bGxSZXF1ZXN0MTYyOTkwNjk2","title":"Rcu 778 center button","url":"https://github.com/CanalTP/ADM/pull/615","reviews":[{"author":"MoOx","state":"APPROVED"},{"author":"staifn","state":"APPROVED"},{"author":"VincentCATILLON","state":"APPROVED"},{"author":"jbcrestot","state":"APPROVED"}]}]},{"name":"need reviews","color":"fbca04","pullRequests":[{"id":"MDExOlB1bGxSZXF1ZXN0MTY0MDMwNDQx","title":"RCU-866 track events with a minimal edit in files","url":"https://github.com/CanalTP/ADM/pull/626","reviews":[{"author":"staifn","state":"APPROVED"}]},
    {"id":"MDExOlB1bGxSZXF1ZXN0MTY0MDMwNDQjb","title":"RCU-866 track events with a minimal edit in files","url":"https://github.com/CanalTP/ADM/pull/626","reviews":[{"author":"staifn","state":"APPROVED"}]}
    ]}]`);

  const refreshView = updatedData => {
    log("[refreshView] currentData:", currentData, "updatedData:", updatedData);
    // leave early
    if (!updatedData) {
      return;
    }

    // first time at least, we don't have anything
    updatedData.forEach(newLabel => {
      log("newLabel", newLabel);
      // nouvelle data
      if (0 > currentData.findIndex(label => newLabel.name === label.name)) {
      }
    });

    if (!currentData) {
    } else {
      currentData.forEach(label => {
        const labelPRids = label.pullRequests.map(
          pullRequest => pullRequest.id
        );
        // we need to be sure, that label haven't disapear
        const uLabelIndex = updatedData.findIndex(uLabel => {
          return uLabel.name === label.name;
        });
        if (uLabelIndex >= 0) {
          log("uLabelIndex", uLabelIndex);
          // new PR!
          if (
            updatedData[uLabelIndex].pullRequests.length -
              label.pullRequests.length >
            0
          ) {
            const newPullRequest = updatedData[uLabelIndex].pullRequests.find(
              pullRequest => !labelPRids.includes(pullRequest.id)
            );
            addPullRequestToNotificationStack(newPullRequest);
            notify();
          }
        }
      });
    }
  };

  const notify = () => {
    chrome.notifications.getPermissionLevel(level => {
      if (level === "denied") {
        log("[notify] notifications level: ", level);

        return;
      }

      getNextNotif(notif => {
        log("notifToDisplay", notif);

        chrome.notifications.clear("unique", () => {
          // chrome.notifications.create('unique', {
          //   type: 'basic',
          //   iconUrl: notif.icon,
          //   title: 'Pull Request watcher',
          //   message: notif.message,
          //   contextMessage: 'click me to open in github',
          //   isClickable: true,
          // }, (t) => {
          //   log('create', t)
          // });
        });
      });

      /**
       * need to test with 2 notif superposé et en fermé 1 pour voir si l'autre est derriere
       */

      // 'new pr with label xxx opened, click to see'
      // {
      //   icon: '',
      //   message: '',
      //   label: '',
      //   author
      // }
    });
  };

  /**
   * getView return an html view for popup
   */
  const getView = filteredLabels => {
    let html = `<table>
    <tr>
      <th><div>label</div></th>
      <th class="pr-number">PR number</th>
    </tr>`;
    filteredLabels.forEach(label => {
      html += `
       <tr>
         <td>
          <a 
            class="label"
            target="_blank"
            href="${label.url}"
            title="see all PR with this label"
          >
            ${label.name}
          </a>
         </td>
         <td>${label.pullRequests.length}</td>
       </tr>`;
    });

    return (
      html +
      `
  </table>`
    );
  };

  // link to go to config parameters
  document.querySelector("#configButton").addEventListener("click", () => {
    if (chrome.runtime.openOptionsPage) {
      // New way to open options pages, if supported (Chrome 42+).
      chrome.runtime.openOptionsPage();
    } else {
      // Reasonable fallback.
      window.open(chrome.runtime.getURL("options.html"));
    }
  });
});
