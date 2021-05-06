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
      console.log(results);

      for (var i = 0; i < results.length; i++) {
        var option = document.createElement("option");
        option.text = results[i].label + " (" + results[i].description + ")";
        option.value = results[i].i;
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
      content:
        '<osm><changeset><tag k="created_by" v="ESN-edit 0.0.1"/><tag k="comment" v="Add etymology"/></changeset></osm>',
    },
    addItems
  );
};

function addItems(err, res) {
  console.log(new XMLSerializer().serializeToString(res));
}
