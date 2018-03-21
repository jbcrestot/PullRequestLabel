// Saves options to chrome.storage.sync.
function save_options() {
  const labels = document.getElementById("labels").value;
  const owner = document.getElementById("owner").value;
  const repository = document.getElementById("repository").value;
  const oauthToken = document.getElementById("oauthToken").value;
  const debug = document.getElementById("debug").checked;
  // clean callback message
  document.querySelector("#testConfig").textContent = "";

  chrome.storage.sync.set(
    {
      labels: labels,
      owner: owner,
      repository: repository,
      oauthToken: oauthToken,
      debug: debug
    },
    function() {
      // Update status to let user know options were saved.
      var status = document.querySelector("#status");
      status.textContent = "Options saved.";
      setTimeout(function() {
        status.textContent = "";
      }, 1000);

      // test config
      updateTestConfig("Testing your configuration");
      chrome.runtime.sendMessage({ action: "pingAPI" }, function(response) {
        if (response === VALID_CONFIG) {
          updateTestConfig("You're all setup!");
          chrome.browserAction.enable();
          setTimeout(function() {
            updateTestConfig();
          }, 5000);
        } else if (response === BAD_CONFIG) {
          updateTestConfig(
            "API reached, but can't find your repository ; plz check your configuration."
          );
          chrome.browserAction.disable();
        } else if (response === INVALID_TOKEN) {
          updateTestConfig(
            "API can't be reach, you probably have a pb with your token"
          );
          chrome.browserAction.disable();
        } else {
          log("wtf", response);
        }
      });
    }
  );
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get(
    {
      labels: "",
      owner: "",
      repository: "",
      oauthToken: "",
      debug: false
    },
    function(items) {
      document.getElementById("labels").value = items.labels;
      document.getElementById("owner").value = items.owner;
      document.getElementById("repository").value = items.repository;
      document.getElementById("oauthToken").value = items.oauthToken;
      document.getElementById("debug").checked = items.debug;
    }
  );
}
document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save").addEventListener("click", save_options);

const testKey = () => {
  getParameters(config => {
    call(
      getRateLimitQuery(),
      config.oauthToken,
      response => {
        if (!response.errors) {
          const data = response.data;
          const resetDate = new Date(data.rateLimit.resetAt);
          updateTestConfig(`RateLimit remaining:
            ${data.rateLimit.remaining}/${data.rateLimit.limit} for
            user: ${data.viewer.login}
            reset at: ${resetDate.toUTCString()}.`);
        } else {
          updateTestConfig("[testKey] a problem happen with github API");
        }
      },
      errorReason => {
        log("[testKey] error with reason: ", errorReason);
        error(errorReason);
      }
    );
  });
};
document.getElementById("testKey").addEventListener("click", testKey);

const testConfig = document.querySelector("#testConfig");
const updateTestConfig = (text = "") => {
  if (testConfig) testConfig.textContent = text;
};

document.querySelector("#dev legend").addEventListener("click", () => {
  const fieldset = document.querySelector("#dev");

  fieldset.className = !fieldset.className ? "open" : "";
});
