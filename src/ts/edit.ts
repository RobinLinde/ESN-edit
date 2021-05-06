import "./main";
import { auth } from "./auth";

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
    var tags = res.getElementsByTagName("tag");
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
    console.log(tagList);
  }
}
