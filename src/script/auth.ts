import osmAuth from "osm-auth";

const baseUrl = process.env.BASE_URL || "";

// @ts-expect-error: Typescript expects the new keyword here but thats breaks the code
export default auth = osmAuth({
  oauth_consumer_key: process.env.CONSUMER_KEY || "",
  oauth_secret: process.env.CONSUMER_SECRET || "",
  url: baseUrl,
});
