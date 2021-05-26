import "bootstrap/js/dist/collapse";
import "bootstrap/js/dist/alert";

import { parseString } from "xml2js";
import xml2js from "xml2js";
import tag2link from "tag2link";

import wikidataDetails from "./wikidata/details";
import wikidataResults from "./wikidata/search";

import showAlert from "./alert";
import auth from "./auth";
import stripName from "./name";
import populateDropdown from "./dropdown";

// Main elements
const alertBox = <HTMLDivElement>document.getElementById("alertBox");

const editorInterface = document.getElementById("editorInterface");
const searchInterface = document.getElementById("searchInterface");

const wikidataDetailsDiv = <HTMLDivElement>(
  document.getElementById("wikidata-details")
);

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

const authLink = document.getElementById("auth");

// Editor parameters
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const itemTypes = ["relation", "way"];
const type = urlParams.get("type");
const id = urlParams.get("id");
const closeOnSucess = urlParams.get("close");
const table = document.getElementById("tagTable");

const baseUrl = process.env.BASE_URL || "";

// Auth link
authLink.onclick = function () {
  if (auth.authenticated()) {
    //Logout
    auth.logout();
    update();
  } else {
    //Login
    if (!auth.bringPopupWindowToFront()) {
      auth.authenticate(function () {
        update();
      });
    }
  }
};

let loginAlert;
// Authentication update
function update() {
  if (auth.authenticated()) {
    // User logged in
    if (loginAlert) {
      loginAlert.remove();
    }
    authLink.innerText = "Logout";

    if (type && id) {
      getElement(type, id);
    } else {
      searchInterface.style.display = "block";
    }
  } else {
    // User logged out
    loginAlert = showAlert(
      alertBox,
      "primary",
      "You're not logged in yet, please log in to continue"
    );
    authLink.innerText = "Login";

    editorInterface.style.display = "none";
    searchInterface.style.display = "none";
  }
}
update();

// Option selector
function setOption(selectElement: HTMLSelectElement, value: string) {
  const options = selectElement.options;
  for (let i = 0; i < options.length; i++) {
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

// Show element
let originalObject; // Make originalObject global
let originalXMLasObject;
let name;
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

    const tagList = {};
    const nameTags = [];

    table.innerHTML = "";
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i].attributes;
      const key = tag.getNamedItem("k").value;
      const value = tag.getNamedItem("v").value;

      const taglink = tag2link.find((element) => element.key == "Key:" + key);
      tagList[key] = value;

      const tr = document.createElement("tr");
      table.appendChild(tr);

      const keytd = document.createElement("td");
      keytd.innerText = key;
      tr.appendChild(keytd);

      const valtd = document.createElement("td");
      if (taglink) {
        const valueList = value.split(";");
        for (let j = 0; j < valueList.length; j++) {
          const vala = document.createElement("a");
          vala.href = taglink.url.replace("$1", valueList[j].trim());
          vala.innerText += valueList[j].trim();
          vala.target = "_blank";
          valtd.appendChild(vala);
          if (j > 0) {
            const seperatorText = document.createTextNode("; ");
            vala.parentNode.insertBefore(seperatorText, vala);
          }
        }
      } else {
        valtd.innerText = value;
      }
      tr.appendChild(valtd);

      if (tag.getNamedItem("k").value.match("^name:.{2}$")) {
        nameTags.push(tag.getNamedItem("k").value);
      }
    }

    if (nameTags.length > 0) {
      setOption(languageDropdown, nameTags[0].substring(5));
      name = stripName(tagList[nameTags[0]]);
    } else {
      name = stripName(tagList["name"]);
    }
    wikidataSearch.value = name;
    if ("name:etymology:wikidata" in tagList) {
      const values = (<string>tagList["name:etymology:wikidata"]).split(";");
      for (let i = 0; i < values.length; i++) {
        values[i] = values[i].trim();
      }
      wikidataResults(name, languageDropdown.value, 1, function (err, res) {
        if (!err) {
          const values = (<string>tagList["name:etymology:wikidata"]).split(
            ";"
          );
          for (let i = 0; i < values.length; i++) {
            values[i] = values[i].trim();
          }
          if (res.length > 0) {
            populateDropdown(res, wikidataDropdown, values);
            wikidataDetails(values, languageDropdown.value, wikidataDetailsDiv);
          } else {
            wikidataDropdown.disabled = true;
            wikidataDropdown.innerHTML = "";
            wikidataDetailsDiv.innerHTML = "";
            showAlert(alertBox, "warning", "Error: no results found");
          }
        }
      });
    } else {
      wikidataResults(name, languageDropdown.value, 1, dropdown);
    }
  } else {
    showAlert(
      alertBox,
      "danger",
      "Error: " + err.status + " - " + err.statusText
    );
  }
}

// Dropdown callback
function dropdown(err, res) {
  if (!err) {
    if (res.length > 0) {
      populateDropdown(res, wikidataDropdown, []);
    } else {
      wikidataDropdown.disabled = true;
      wikidataDropdown.innerHTML = "";
      wikidataDetailsDiv.innerHTML = "";
      showAlert(alertBox, "warning", "Error: no results found");
    }
  }
}

// Redo search on change of language
languageDropdown.onchange = function () {
  wikidataResults(wikidataSearch.value, languageDropdown.value, 1, dropdown);
};

// Execute search
searchButton.onclick = function () {
  wikidataResults(wikidataSearch.value, languageDropdown.value, 1, dropdown);
};

wikidataDropdown.onchange = function () {
  const selectedOptions = [];
  for (let i = 0; i < wikidataDropdown.options.length; i++) {
    if (wikidataDropdown.options[i].selected) {
      selectedOptions.push(wikidataDropdown.options[i].value);
    }
  }
  wikidataDetails(selectedOptions, languageDropdown.value, wikidataDetailsDiv);
};

// Function to set the wikidata value of object
function setWikidata(wikidata) {
  let wikidataNumber;

  for (let i = 0; i < originalXMLasObject["osm"][type][0]["tag"].length; i++) {
    if (
      originalXMLasObject["osm"][type][0]["tag"][i]["$"]["k"] ==
      "name:etymology:wikidata"
    ) {
      // Wikidata entry already exists
      wikidataNumber = i;
    }
  }
  if (wikidataNumber) {
    // Update existing one
    originalXMLasObject["osm"][type][0]["tag"][wikidataNumber]["$"]["v"] =
      wikidata.join("; ");
  } else {
    // Create new one
    const key = { $: { k: "name:etymology:wikidata", v: wikidata.join("; ") } };
    originalXMLasObject["osm"][type][0]["tag"].push(key);
  }
}

// Create changeset on button click
addButton.onclick = () => {
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

let changesetId;
function updateObjects(err, res) {
  if (!err) {
    // Get Changeset ID
    changesetId = res;
    console.log("Changeset number: " + changesetId);

    // Set WikiData value
    const wikiDataList = [];
    for (let i = 0; i < wikidataDropdown.selectedOptions.length; i++) {
      wikiDataList.push(wikidataDropdown.selectedOptions[i].value);
    }
    setWikidata(wikiDataList);

    // Set changeset id
    originalXMLasObject["osm"][type][0]["$"]["changeset"] = changesetId;

    // Prepare XML
    const builder = new xml2js.Builder();
    const changesetXML = builder.buildObject(originalXMLasObject);

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
    showAlert(
      alertBox,
      "danger",
      "Error: " + err.status + " - " + err.statusText
    );
  }
}

// Function to close the changeset
function closeChangeset(err) {
  if (!err) {
    auth.xhr(
      {
        method: "PUT",
        path: "/api/0.6/changeset/" + changesetId + "/close",
      },
      giveFeedback
    );
  } else {
    showAlert(
      alertBox,
      "danger",
      "Error: " + err.status + " - " + err.statusText
    );
  }
}

// Give some feedback to the user
function giveFeedback(err) {
  if (!err) {
    showAlert(
      alertBox,
      "success",
      'Success, your changes are uploaded in changeset <a href="' +
        baseUrl +
        "/changeset/" +
        changesetId +
        '" class="alert-link" target="_blank">' +
        changesetId +
        "</a>.",
      false
    );

    if (closeOnSucess) {
      setTimeout(() => {
        window.close();
      }, 1000);
    }

    getElement(type, id);
  } else {
    showAlert(
      alertBox,
      "danger",
      "Error: " + err.status + " - " + err.statusText
    );
  }
}
