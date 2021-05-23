# ESN-Edit

ESN-Edit is a simple OSM editor, focused on etymology.
It allows you to choose a way or relation, and it gives you a suggestion for a Wikidata entry.

## Running the app

There are a few steps required to run this app

1. Create a .env file

   Your .env file should look something like this:

   ```env
   BASE_URL= base url for OSM, for example https://master.apis.dev.openstreetmap.org
   CONSUMER_KEY=Your oauth consumer key
   CONSUMER_SECRET=Your oauth consumer secret
   ```

   You can go to [https://www.openstreetmap.org/user/username/oauth_clients/new](https://www.openstreetmap.org/user/username/oauth_clients/new) to register a new application and get your own `CONSUMER_KEY` and `CONSUMER_SECRET`

2. Install all the dependencies `npm install`
3. Start the development server `npm start`

   Alternatively you can build by replacing `start` with `build` to create a production build.

## Process

The editor currently is very basic, after fetching the road it tries to remove some common parts of a street name and then runs a Wikidata search.
