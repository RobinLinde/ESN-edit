import getImage from "./image";

export default function showWikidataDetails(
  entity: Array<string>,
  lang: string,
  element: HTMLDivElement
): void {
  element.innerHTML = "";
  for (let i = 0; i < entity.length; i++) {
    const url =
      "https://www.wikidata.org/wiki/Special:EntityData/" + entity[i] + ".json";
    const request = new XMLHttpRequest();
    request.open("GET", url);
    request.responseType = "json";
    request.send();

    request.onload = function () {
      const entityData = request.response.entities[entity[i]];
      const details = document.createElement("div");
      details.className = "wikidata-detail";
      element.appendChild(details);

      const h1 = document.createElement("h1");
      h1.innerText = entityData["labels"][lang]["value"];
      details.appendChild(h1);

      const a = document.createElement("a");
      a.href = "https://www.wikidata.org/wiki/" + entity[i];
      a.target = "_blank";
      a.innerText = "View on Wikidata";
      details.appendChild(a);

      const p = document.createElement("p");
      p.innerText = entityData["descriptions"][lang]["value"];
      details.appendChild(p);

      getImage(
        entityData["claims"]["P18"][0]["mainsnak"]["datavalue"]["value"],
        function (err, res) {
          if (!err) {
            details.appendChild(res);
          }
        }
      );
    };
  }
}
