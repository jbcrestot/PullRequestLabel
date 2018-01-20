document.addEventListener('DOMContentLoaded', () => {
  // this is executed each time user click on icon extension
  const pr = document.getElementById('pr');
  let currentData = undefined;
  // first time
  // if (!pr.textContent.length) {
  //   pr.innerHTML = 'Fetching your data.';
  // }

  const render = (data) => {
    currentData = data;
    pr.innerHTML = !data.length
      ? 'There is no opened Pull Request with those labels'
      : getView(data);
  };

  // retrieve from local storage and immediatly display
  getData(render);

  // launch refresh
  chrome.runtime.sendMessage({action: 'refreshData'}, (updatedData) => {
    refreshView(updatedData)
  });

  // link to go to config parameters
  document.querySelector('#configButton').addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      // New way to open options pages, if supported (Chrome 42+).
      chrome.runtime.openOptionsPage();
    } else {
      // Reasonable fallback.
      window.open(chrome.runtime.getURL('options.html'));
    }
  });

  const refreshView = (updatedData) => {
    updatedData = JSON.parse(`
[{"name":"need QA validation","color":"cc317c","pullRequests":[{"id":"MDExOlB1bGxSZXF1ZXN0MTYxMTU2Mzk5","title":"[POC] Veery SDK","url":"https://github.com/CanalTP/ADM/pull/594","reviews":[{"author":"staifn","state":"APPROVED"},{"author":"jbcrestot","state":"APPROVED"},{"author":"MoOx","state":"APPROVED"}]},{"id":"MDExOlB1bGxSZXF1ZXN0MTYyOTkwNjk2","title":"Rcu 778 center button","url":"https://github.com/CanalTP/ADM/pull/615","reviews":[{"author":"MoOx","state":"APPROVED"},{"author":"staifn","state":"APPROVED"},{"author":"VincentCATILLON","state":"APPROVED"},{"author":"jbcrestot","state":"APPROVED"}]}]},{"name":"need reviews","color":"fbca04","pullRequests":[{"id":"MDExOlB1bGxSZXF1ZXN0MTY0MDMwNDQx","title":"RCU-866 track events with a minimal edit in files","url":"https://github.com/CanalTP/ADM/pull/626","reviews":[{"author":"staifn","state":"APPROVED"}]},
{"id":"MDExOlB1bGxSZXF1ZXN0MTY0MDMwNDQjb","title":"RCU-866 track events with a minimal edit in files","url":"https://github.com/CanalTP/ADM/pull/626","reviews":[{"author":"staifn","state":"APPROVED"}]}
]}]
`);
    log('[refreshView] currentData:', currentData, 'updatedData:', updatedData);
    currentData.forEach((label) => {
      const labelPRids = label.pullRequests.map(pullRequest => pullRequest.id);
      // we need to be sure, that label haven't disapear
      const uLabelIndex = updatedData.findIndex((uLabel) => {return uLabel.name === label.name});
      if (uLabelIndex >= 0) {
        // new PR!
        if (updatedData[uLabelIndex].pullRequests.length - label.pullRequests.length > 0) {
          const newPullRequest = updatedData[uLabelIndex].pullRequests.find(
            pullRequest => !labelPRids.includes(pullRequest.id)
          );
          addPullRequestToNotificationStack(newPullRequest);
          notify();
        }
      }

    });
  }

  const notify = () => {
    chrome.notifications.getPermissionLevel((level) => {
      log(level);
      if (level === 'denied')
        return;

      const notif = getNextNotif();//todo

      chrome.notifications.getAll(log);
      // chrome.notifications.clear('unique', log)
      // chrome.notifications.clear('unique2', log)

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
  };

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

});
