var osmAuth = require("osm-auth");

var auth = osmAuth({
  oauth_consumer_key: "F7e3Wych4ZlxdlIiJCgZSTI4N0r5jme3FaGV4HLt",
  oauth_secret: "fyTkz3W3Fuvu5C4xTKw1Z9B9iX1QiwtFJSa0JimZ",
  url: "https://master.apis.dev.openstreetmap.org",
});

const loginItem = document.getElementById("login-item");
const loginLink = document.getElementById("login-link");

const logoutItem = document.getElementById("logout-item");
const logoutLink = document.getElementById("logout-link");

loginLink.onclick = (ev: Event) => {
  if (!auth.bringPopupWindowToFront()) {
    auth.authenticate(function () {
      update();
    });
  }
};

function update() {
  if (auth.authenticated()) {
    loginItem.style.display = "none";
    logoutItem.style.display = "block";
  } else {
    loginItem.style.display = "block";
    logoutItem.style.display = "none";
  }
}
update();

logoutLink.onclick = (ev: Event) => {
  auth.logout();
  update();
};
