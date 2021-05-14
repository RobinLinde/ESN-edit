# ESN-Edit

ESN-Edit is a simple OSM editor, focused on etymology.
It allows you to choose a way or relation, and gives a suggestion for a Wikidata entry.

## Running the app

To run it you need to install dependencies and create a .env file.

Your .env file should look something like this:

```env
BASE_URL= base url for OSM, for example https://master.apis.dev.openstreetmap.org
CONSUMER_KEY=Your oauth consumer key
CONSUMER_SECRET=Yout oauth consumer secret
```

Afterwards run the following to start a dev server:

```cmd
npm install
npm run start
```

Alternatively you can build by replacing `start` with `build`.

## Process

The editor currently is very basic, after fetching the road it tries to remove some common parts of a street name and then runs a Wikidata search.
