export default function showWikidataResults(
  search: string,
  lang: string,
  page = 1,
  callback: (err: string, res: Record<string, unknown>) => void
): void {
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
    callback(null, results);
  };
  request.onerror = function () {
    callback(request.response, null);
  };
}
