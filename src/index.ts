import "bootstrap/js/dist/collapse";

// Main elements
var alertBox = document.getElementById("mainAlert");

var editorInterface = document.getElementById("editorInterface");
var searchInterface = document.getElementById("searchInterface");

const loginItem = document.getElementById("login-item");
const loginLink = document.getElementById("login-link");

const logoutItem = document.getElementById("logout-item");
const logoutLink = document.getElementById("logout-link");

// Editor parameters
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const itemTypes = ["relation", "way"];
var type = urlParams.get("type");
var id = urlParams.get("id");
var table = document.getElementById("tagTable");

// Authentication
var osmAuth = require("osm-auth");

var auth = osmAuth({
  oauth_consumer_key: "F7e3Wych4ZlxdlIiJCgZSTI4N0r5jme3FaGV4HLt",
  oauth_secret: "fyTkz3W3Fuvu5C4xTKw1Z9B9iX1QiwtFJSa0JimZ",
  url: "https://master.apis.dev.openstreetmap.org",
});

// Login link
loginLink.onclick = (ev: Event) => {
  if (!auth.bringPopupWindowToFront()) {
    auth.authenticate(function () {
      update();
    });
  }
};

// Update page based on auth state
function update() {
  if (auth.authenticated()) {
    // User logged in
    loginItem.style.display = "none";
    logoutItem.style.display = "block";

    alertBox.style.display = "none";

    if (type && id) {
      getElement(type, id);
    } else {
      searchInterface.style.display = "block";
    }
  } else {
    // User logged out
    loginItem.style.display = "block";
    logoutItem.style.display = "none";

    alertBox.innerText = "You're not logged in yet, please log in to continue";
    alertBox.style.display = "block";

    editorInterface.style.display = "none";
    searchInterface.style.display = "none";
  }
}
update();

// Logout link
logoutLink.onclick = (ev: Event) => {
  auth.logout();
  update();
};

// Wikibase
const WBK = require("wikibase-sdk");
const wbk = WBK({
  instance: "https://www.wikidata.org",
  sparqlEndpoint: "https://query.wikidata.org/sparql",
});

// Name Stripper
function stripName(name: String) {
  var output = name.replace("laan", "");
  return output;
}

// Option selector
function setOption(selectElement: HTMLSelectElement, value) {
  var options = selectElement.options;
  for (var i = 0, optionsLength = options.length; i < optionsLength; i++) {
    if (options[i].value == value) {
      selectElement.selectedIndex = i;
      return true;
    }
  }
  return false;
}

// Get element
function getElement(type: string, id) {
  if (itemTypes.includes(type) && id) {
    auth.xhr(
      {
        method: "GET",
        path: "/api/0.6/" + type + "/" + id,
      },
      showElement
    );
  }
}

// Show element
var originalObject; // Make originalObject global
function showElement(err, res: XMLDocument) {
  if (!err) {
    editorInterface.style.display = "block";
    const tags = res.getElementsByTagName("tag");
    originalObject = res;
    var tagList = {};
    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i].attributes;
      tagList[tag.getNamedItem("k").value] = tag.getNamedItem("v").value;

      var tr = document.createElement("tr");
      table.appendChild(tr);

      var keytd = document.createElement("td");
      keytd.innerText = tag.getNamedItem("k").value;
      tr.appendChild(keytd);

      var valtd = document.createElement("td");
      valtd.innerText = tag.getNamedItem("v").value;
      tr.appendChild(valtd);
    }

    const url = wbk.searchEntities(stripName(tagList["name"]));
    let request = new XMLHttpRequest();
    request.open("GET", url);
    request.responseType = "json";
    request.send();

    request.onload = function () {
      const requestData = request.response;
      const results = requestData.search;
      const dropdown = <HTMLSelectElement>(
        document.getElementById("wikidata-select")
      );

      for (var i = 0; i < results.length; i++) {
        var option = document.createElement("option");
        option.text = results[i].label + " (" + results[i].description + ")";
        option.value = results[i].id;
        dropdown.appendChild(option);
      }
      if ("name:etymology:wikidata" in tagList) {
        if (!setOption(dropdown, tagList["name:etymology:wikidata"])) {
          alert("Problem with Wikidata");
        }
      }
    };
  }
}
