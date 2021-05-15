import "bootstrap/js/dist/collapse";

var parseString = require("xml2js").parseString;
var xml2js = require("xml2js");

// Main elements
var alertBox = document.getElementById("mainAlert");

var editorInterface = document.getElementById("editorInterface");
var searchInterface = document.getElementById("searchInterface");

const languageDropdown = <HTMLSelectElement>(
  document.getElementById("lang-select")
);
const wikidataDropdown = <HTMLSelectElement>(
  document.getElementById("wikidata-select")
);

const wikidataSearch = <HTMLInputElement>(
  document.getElementById("wikidata-search")
);

const addButton = document.getElementById("addButton");
const searchButton = document.getElementById("searchButton");

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

const baseUrl = process.env.BASE_URL || "";

// Authentication
var osmAuth = require("osm-auth");

var auth = osmAuth({
  oauth_consumer_key: process.env.CONSUMER_KEY || "",
  oauth_secret: process.env.CONSUMER_SECRET || "",
  url: baseUrl,
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
    alertBox.className = "alert alert-primary";
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

// Name Stripper
function stripName(name: string) {
  const commonWords = [
    new RegExp("^Avenue de la"),
    new RegExp("^Avenue des"),
    new RegExp("^Avenue de"),
    new RegExp("^Avenue d'"),
    new RegExp("^Avenue"),
    new RegExp("^Boulevard"),
    new RegExp("laan$"),
    new RegExp("lei$"),
    new RegExp("plein$"),
    new RegExp("^Rue de la"),
    new RegExp("^Rue des"),
    new RegExp("^Rue de"),
    new RegExp("^Rue du"),
    new RegExp("^Rue d'"),
    new RegExp("^Rue"),
    new RegExp("straat$"),
    new RegExp("-strasse$", "i"),
    new RegExp("strasse$", "i"),
    new RegExp("-straße$", "i"),
    new RegExp("straße$", "i"),
    new RegExp("weg$"),
  ];
  var output = name;
  for (var i = 0; i < commonWords.length; i++) {
    output = output.replace(commonWords[i], "");
  }
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
    languageDropdown.style.display = "block";
    auth.xhr(
      {
        method: "GET",
        path: "/api/0.6/" + type + "/" + id,
      },
      showElement
    );
  }
}

// Function to show Wikidata items
function showWikidata(search: string, lang: string, defaultOption) {
  const url =
    "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" +
    search +
    "&language=" +
    lang +
    "&limit=20&continue=0&format=json&uselang=" +
    lang +
    "&type=item&origin=*";
  let request = new XMLHttpRequest();
  request.open("GET", url);
  request.responseType = "json";
  request.send();

  request.onload = function () {
    const requestData = request.response;
    const results = requestData.search;
    wikidataDropdown.innerHTML = "";

    if (results.length == 0) {
      wikidataDropdown.disabled = true;
      alertBox.innerText = "Error: no results found";
      alertBox.className = "alert alert-warning";
      alertBox.style.display = "block";
    } else {
      wikidataDropdown.disabled = false;
      alertBox.style.display = "none";
      for (var i = 0; i < results.length; i++) {
        var option = document.createElement("option");
        option.text = results[i].label + " (" + results[i].description + ")";
        option.value = results[i].id;
        wikidataDropdown.appendChild(option);
      }
      if (defaultOption) {
        setOption(wikidataDropdown, defaultOption);
      }
    }
  };
}

// Show element
var originalObject; // Make originalObject global
var originalXMLasObject;
var name;
function showElement(err, res: XMLDocument) {
  if (!err) {
    editorInterface.style.display = "block";
    const tags = res.getElementsByTagName("tag");
    originalObject = res;

    parseString(
      new XMLSerializer().serializeToString(originalObject.documentElement),
      function (err, result) {
        if (!err) {
          originalXMLasObject = result;
        }
      }
    );

    var tagList = {};
    table.innerHTML = "";
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

    name = stripName(tagList["name"]);
    wikidataSearch.value = name;
    if ("name:etymology:wikidata" in tagList) {
      showWikidata(
        name,
        languageDropdown.value,
        tagList["name:etymology:wikidata"]
      );
    } else {
      showWikidata(name, languageDropdown.value, false);
    }
  } else {
    alertBox.innerText = "Error: " + err;
    alertBox.className = "alert alert-danger";
    alertBox.style.display = "block";
  }
}

// Redo search on change of language
languageDropdown.onchange = function () {
  showWikidata(wikidataSearch.value, languageDropdown.value, false);
};

// Execture search
searchButton.onclick = function () {
  showWikidata(wikidataSearch.value, languageDropdown.value, false);
};

// Function to set the wikidata value of object
function setWikidata(wikidata) {
  for (var i = 0; i < originalXMLasObject["osm"][type][0]["tag"].length; i++) {
    if (
      originalXMLasObject["osm"][type][0]["tag"][i]["$"]["k"] ==
      "name:etymology:wikidata"
    ) {
      // Wikidata entry already exists
      var wikidataNumber = i;
    }
  }
  if (wikidataNumber) {
    // Update existing one
    originalXMLasObject["osm"][type][0]["tag"][wikidataNumber]["$"]["v"] =
      wikidata;
  } else {
    // Create new one
    var key = { $: { k: "name:etymology:wikidata", v: wikidata } };
    originalXMLasObject["osm"][type][0]["tag"].push(key);
  }
}

// Create changeset on button click
addButton.onclick = (ev: Event) => {
  auth.xhr(
    {
      method: "PUT",
      path: "/api/0.6/changeset/create",
      options: { header: { "Content-Type": "text/xml" } },
      content:
        '<osm><changeset><tag k="created_by" v="ESN-edit 0.0.1"/><tag k="comment" v="Add etymology #equalstreetnames"/></changeset></osm>',
    },
    updateObjects
  );
};

var changesetId;
function updateObjects(err, res) {
  if (!err) {
    // Get Changeset ID
    changesetId = res;
    console.log("Changeset number: " + changesetId);

    // Set WikiData value
    setWikidata(wikidataDropdown.value);

    // Set changeset id
    originalXMLasObject["osm"][type][0]["$"]["changeset"] = changesetId;

    // Prepare XML
    var builder = new xml2js.Builder();
    var changesetXML = builder.buildObject(originalXMLasObject);

    // Update object
    auth.xhr(
      {
        method: "PUT",
        path: "/api/0.6/" + type + "/" + id,
        options: { header: { "Content-Type": "text/xml" } },
        content: changesetXML,
      },
      closeChangeset
    );
  } else {
    alertBox.innerText = "Error: " + err;
    alertBox.className = "alert alert-danger";
    alertBox.style.display = "block";
  }
}

// Function to close the changeset
function closeChangeset(err, res) {
  if (!err) {
    auth.xhr(
      {
        method: "PUT",
        path: "/api/0.6/changeset/" + changesetId + "/close",
      },
      giveFeedback
    );
  } else {
    alertBox.innerText = "Error: " + err;
    alertBox.className = "alert alert-danger";
    alertBox.style.display = "block";
  }
}

// Give some feedback to the user
function giveFeedback(err, res) {
  if (!err) {
    alertBox.innerHTML =
      'Success, your changes are uploaded in changeset <a href="' +
      baseUrl +
      "/changeset/" +
      changesetId +
      '" class="alert-link" target="_blank">' +
      changesetId +
      "</a>.";
    alertBox.className = "alert alert-success";
    alertBox.style.display = "block";

    getElement(type, id);
  } else {
    alertBox.innerText = "Error: " + err;
    alertBox.className = "alert alert-danger";
    alertBox.style.display = "block";
  }
}
