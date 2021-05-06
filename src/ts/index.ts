import "./main";
var osmAuth = require("osm-auth");

var auth = osmAuth({
  oauth_consumer_key: "F7e3Wych4ZlxdlIiJCgZSTI4N0r5jme3FaGV4HLt",
  oauth_secret: "fyTkz3W3Fuvu5C4xTKw1Z9B9iX1QiwtFJSa0JimZ",
  url: "https://master.apis.dev.openstreetmap.org",
});

function done(err, res) {
  if (err) {
    console.log("error");
    return;
  }
  var u = res.getElementsByTagName("user")[0];
  var changesets = res.getElementsByTagName("changesets")[0];
  var o = {
    display_name: u.getAttribute("display_name"),
    id: u.getAttribute("id"),
    count: changesets.getAttribute("count"),
  };
  for (var k in o) {
    console.log(o[k]);
  }
}

document.getElementById("osm-authenticate").onclick = function () {
  if (!auth.bringPopupWindowToFront()) {
    auth.authenticate(function () {
      update();
    });
  }
};

function update() {
  if (auth.authenticated()) {
    var button = <HTMLInputElement>document.getElementById("osm-authenticate");
    button.disabled = true;
    button.innerText = "✔️ OSM";
  } else {
    var button = <HTMLInputElement>document.getElementById("osm-authenticate");
    button.disabled = false;
    button.innerText = "OSM";
  }
}
update();

const logout = document.getElementById("logout-link");

logout.onclick = (ev: Event) => {
  auth.logout();
  update();
};
