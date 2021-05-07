import "./main";
import { auth } from "./includes/auth";
import { stripName } from "./includes/name";

const WBK = require("wikibase-sdk");
const wbk = WBK({
  instance: "https://www.wikidata.org",
  sparqlEndpoint: "https://query.wikidata.org/sparql",
});

if (!auth.authenticated()) {
  window.location.replace("/");
}

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const itemTypes = ["relation", "way"];
var type = urlParams.get("type");

var id = urlParams.get("id");

var table = document.getElementById("tagTable");

var originalObject;

if (itemTypes.includes(type) && id) {
  auth.xhr(
    {
      method: "GET",
      path: "/api/0.6/" + type + "/" + id,
    },
    showWays
  );
}

function showWays(err, res: XMLDocument) {
  if (!err) {
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
      const dropdown = document.getElementById("wikidata-select");

      for (var i = 0; i < results.length; i++) {
        var option = document.createElement("option");
        option.text = results[i].label + " (" + results[i].description + ")";
        option.value = results[i].id;
        dropdown.appendChild(option);
      }
    };
  }
}

document.getElementById("addButton").onclick = (ev: Event) => {
  auth.xhr(
    {
      method: "PUT",
      path: "/api/0.6/changeset/create",
      options: { header: { "Content-Type": "text/xml" } },
      content:
        '<osm><changeset><tag k="created_by" v="ESN-edit 0.0.1"/><tag k="comment" v="Add etymology"/></changeset></osm>',
    },
    addItems
  );
};

var changesetId;
function addItems(err, res) {
  if (!err) {
    changesetId = res;
    console.log("Changeset number: " + changesetId);
    var changesetContent: XMLDocument = originalObject;
    var dropdown = <HTMLInputElement>document.getElementById("wikidata-select");
    changesetContent.children[0].children[0].setAttribute(
      "changeset",
      changesetId
    );
    console.log(changesetContent);
    var changesetXML = new XMLSerializer().serializeToString(
      changesetContent.documentElement
    );
    changesetXML = changesetXML.replace(
      "</" + type + ">",
      '<tag k="name:etymology:wikidata" v="' +
        dropdown.value +
        '"/></' +
        type +
        ">"
    );
    console.log(changesetXML);
    auth.xhr(
      {
        method: "PUT",
        path: "/api/0.6/" + type + "/" + id,
        options: { header: { "Content-Type": "text/xml" } },
        content: changesetXML,
      },
      closeChangeset
    );
  }
}

function closeChangeset(err, res) {
  if (!err) {
    auth.xhr(
      {
        method: "PUT",
        path: "/api/0.6/changeset/" + changesetId + "/close",
      },
      giveFeedback
    );
  }
}

function giveFeedback(err, res) {
  if (!err) {
    console.log(res);
  } else {
    console.log(err);
  }
}
