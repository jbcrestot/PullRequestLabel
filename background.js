const github = '';
const callApi = () => {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "http://api.example.com/data.json", true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      // JSON.parse does not evaluate the attacker's scripts.
      var resp = JSON.parse(xhr.responseText);
    }
  }
  xhr.send();
}
