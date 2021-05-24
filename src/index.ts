import "bootstrap/js/dist/collapse";
import "bootstrap/js/dist/alert";

import { parseString } from "xml2js";
import xml2js from "xml2js";
import tag2link from "tag2link";
import osmAuth from "osm-auth";

// Main elements
const alertBox = document.getElementById("alertBox");

const closeButton = document.createElement("button");
closeButton.type = "button";
closeButton.className = "btn-close";
closeButton.setAttribute("data-bs-dismiss", "alert");
closeButton.setAttribute("aria-label", "Close");

const editorInterface = document.getElementById("editorInterface");
const searchInterface = document.getElementById("searchInterface");

const wikidataDetails = document.getElementById("wikidata-details");

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
const type = urlParams.get("type");
const id = urlParams.get("id");
const closeOnSucess = urlParams.get("close");
const table = document.getElementById("tagTable");

const baseUrl = process.env.BASE_URL || "";

// Authentication
// @ts-expect-error: Typescript expects the new keyword here but thats breaks the code
const auth = osmAuth({
  oauth_consumer_key: process.env.CONSUMER_KEY || "",
  oauth_secret: process.env.CONSUMER_SECRET || "",
  url: baseUrl,
});

// Login link
loginLink.onclick = () => {
  if (!auth.bringPopupWindowToFront()) {
    auth.authenticate(function () {
      update();
    });
  }
};

// Update page based on auth state
let loginAlert: HTMLDivElement;
function update() {
  if (auth.authenticated()) {
    // User logged in
    loginItem.style.display = "none";
    logoutItem.style.display = "block";

    if (loginAlert) {
      loginAlert.remove();
    }

    if (type && id) {
      getElement(type, id);
    } else {
      searchInterface.style.display = "block";
    }
  } else {
    // User logged out
    loginItem.style.display = "block";
    logoutItem.style.display = "none";

    loginAlert = document.createElement("div");
    loginAlert.innerText =
      "You're not logged in yet, please log in to continue";
    loginAlert.className = "alert alert-primary";
    alertBox.appendChild(loginAlert);

    editorInterface.style.display = "none";
    searchInterface.style.display = "none";
  }
}
update();

// Logout link
logoutLink.onclick = () => {
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
    new RegExp("-platz$", "i"),
    new RegExp("platz$", "i"),
    new RegExp("plein$"),
    new RegExp("^Rue de la"),
    new RegExp("^Rue des"),
    new RegExp("^Rue de"),
    new RegExp("^Rue du"),
    new RegExp("^Rue d'"),
    new RegExp("^Rue"),
    new RegExp("singel$"),
    new RegExp("straat$"),
    new RegExp("-strasse$", "i"),
    new RegExp("strasse$", "i"),
    new RegExp("-straße$", "i"),
    new RegExp("straße$", "i"),
    new RegExp("weg$"),
  ];
  let output = name;
  for (let i = 0; i < commonWords.length; i++) {
    output = output.replace(commonWords[i], "");
  }
  return output;
}

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
function setMultipleOptions(
  selectElement: HTMLSelectElement,
  values: Array<string>
) {
  const options = selectElement.options;
  let changedOptions = 0;
  for (let i = 0; i < options.length; i++) {
    if (values.includes(options[i].value)) {
      options[i].selected = true;
      changedOptions += 1;
    }
  }
  if (changedOptions > 0) {
    return true;
  } else {
    return false;
  }
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
function showWikidataResults(
  search: string,
  lang: string,
  defaultOptions,
  page = 1
) {
  const start = page * 20 - 20;
  const url =
    "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" +
    search +
    "&language=" +
    lang +
    "&limit=20&continue=" +
    start +
    "&format=json&uselang=" +
    lang +
    "&type=item&origin=*";
  const request = new XMLHttpRequest();
  request.open("GET", url);
  request.responseType = "json";
  request.send();

  request.onload = function () {
    const requestData = request.response;
    const results = requestData.search;
    wikidataDropdown.innerHTML = "";

    if (results.length == 0) {
      wikidataDropdown.disabled = true;
      const wikidataAlert = document.createElement("div");
      wikidataAlert.innerText = "Error: no results found";
      wikidataAlert.className =
        "alert alert-warning alert-dismissible fade show";
      wikidataAlert.appendChild(closeButton);
      alertBox.appendChild(wikidataAlert);
    } else {
      wikidataDropdown.disabled = false;
      for (let i = 0; i < results.length; i++) {
        const option = document.createElement("option");
        option.innerHTML =
          results[i].label + " (" + results[i].description + ")";
        option.value = results[i].id;
        wikidataDropdown.appendChild(option);
      }
      if (defaultOptions) {
        setMultipleOptions(wikidataDropdown, defaultOptions);
        showWikidataDetails(defaultOptions, languageDropdown.value);
      }
    }
  };
}

function showWikidataDetails(entity: Array<string>, lang: string) {
  wikidataDetails.innerHTML = "";
  for (let i = 0; i < entity.length; i++) {
    const url =
      "https://www.wikidata.org/wiki/Special:EntityData/" + entity[i] + ".json";
    const request = new XMLHttpRequest();
    request.open("GET", url);
    request.responseType = "json";
    request.send();

    request.onload = function () {
      const entityData = request.response.entities[entity[i]];
      const wikidataDetailsDiv = document.createElement("div");
      wikidataDetailsDiv.className = "wikidata-detail";
      wikidataDetails.appendChild(wikidataDetailsDiv);

      const h1 = document.createElement("h1");
      h1.innerText = entityData["labels"][lang]["value"];
      wikidataDetailsDiv.appendChild(h1);

      const a = document.createElement("a");
      a.href = "https://www.wikidata.org/wiki/" + entity[i];
      a.target = "_blank";
      a.innerText = "View on Wikidata";
      wikidataDetailsDiv.appendChild(a);

      const p = document.createElement("p");
      p.innerText = entityData["descriptions"][lang]["value"];
      wikidataDetailsDiv.appendChild(p);

      const url =
        "https://api.allorigins.win/raw?url=" +
        encodeURIComponent(
          "https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&redirects&format=json&titles=File:" +
            entityData["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"]
        );
      const imgRequest = new XMLHttpRequest();
      imgRequest.open("GET", url);
      imgRequest.responseType = "json";
      imgRequest.send();

      imgRequest.onload = function () {
        const img = document.createElement("img");
        const pages = imgRequest.response["query"]["pages"];
        img.src = pages[Object.keys(pages)[0]]["imageinfo"][0]["url"];
        img.className = "detail-img";
        wikidataDetailsDiv.appendChild(img);
      };
    };
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
      showWikidataResults(name, languageDropdown.value, values);
    } else {
      showWikidataResults(name, languageDropdown.value, false);
    }
  } else {
    const alert = document.createElement("div");
    alert.innerText = "Error: " + err.status + " - " + err.statusText;
    alert.className = "alert alert-danger alert-dismissible fade show";
    alert.appendChild(closeButton);
    alertBox.appendChild(alert);
  }
}

// Redo search on change of language
languageDropdown.onchange = function () {
  showWikidataResults(wikidataSearch.value, languageDropdown.value, false);
};

// Execture search
searchButton.onclick = function () {
  showWikidataResults(wikidataSearch.value, languageDropdown.value, false);
};

wikidataDropdown.onchange = function () {
  const selectedOptions = [];
  for (let i = 0; i < wikidataDropdown.options.length; i++) {
    if (wikidataDropdown.options[i].selected) {
      selectedOptions.push(wikidataDropdown.options[i].value);
    }
  }
  showWikidataDetails(selectedOptions, languageDropdown.value);
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
    const alert = document.createElement("div");
    alert.innerText = "Error: " + err.status + " - " + err.statusText;
    alert.className = "alert alert-danger alert-dismissible fade show";
    alert.appendChild(closeButton);
    alertBox.appendChild(alert);
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
    const alert = document.createElement("div");
    alert.innerText = "Error: " + err.status + " - " + err.statusText;
    alert.className = "alert alert-danger alert-dismissible fade show";
    alert.appendChild(closeButton);
    alertBox.appendChild(alert);
  }
}

// Give some feedback to the user
function giveFeedback(err) {
  if (!err) {
    const alert = document.createElement("div");
    alert.innerHTML =
      'Success, your changes are uploaded in changeset <a href="' +
      baseUrl +
      "/changeset/" +
      changesetId +
      '" class="alert-link" target="_blank">' +
      changesetId +
      "</a>.";
    alert.className = "alert alert-success alert-dismissible fade show";
    alert.appendChild(closeButton);
    alertBox.appendChild(alert);

    if (closeOnSucess) {
      setTimeout(() => {
        window.close();
      }, 1000);
    }

    getElement(type, id);
  } else {
    const alert = document.createElement("div");
    alert.innerText = "Error: " + err.status + " - " + err.statusText;
    alert.className = "alert alert-danger alert-dismissible fade show";
    alert.appendChild(closeButton);
    alertBox.appendChild(alert);
  }
}
