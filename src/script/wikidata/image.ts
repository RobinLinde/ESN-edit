export default function (
  filename: string,
  callback: (err: string, res: HTMLImageElement) => void
): void {
  const url =
    "https://api.allorigins.win/raw?url=" +
    encodeURIComponent(
      "https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&redirects&format=json&titles=File:" +
        filename
    );
  const request = new XMLHttpRequest();
  request.open("GET", url);
  request.responseType = "json";
  request.send();

  request.onload = function () {
    const pages = request.response["query"]["pages"];
    const imgUrl = pages[Object.keys(pages)[0]]["imageinfo"][0]["url"];

    const img = document.createElement("img");
    img.className = "detail-img";
    img.src = imgUrl;
    callback(null, img);
  };
  request.onerror = function () {
    callback(request.response, null);
  };
}
