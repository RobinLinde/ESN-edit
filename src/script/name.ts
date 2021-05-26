export default function (name: string): string {
  const commonWords = [
    new RegExp("^Avenue de la"),
    new RegExp("^Avenue des"),
    new RegExp("^Avenue de"),
    new RegExp("^Avenue d'"),
    new RegExp("^Avenue"),
    new RegExp("^Boulevard"),
    new RegExp("laan$"),
    new RegExp("lei$"),
    new RegExp("pad$"),
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
