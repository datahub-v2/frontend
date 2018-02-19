DataHub frontend in node.js.

[![Build Status](https://travis-ci.org/datahq/frontend.svg?branch=master)](https://travis-ci.org/datahq/frontend)

## Quick Start

Clone the repo, install dependencies using yarn (or npm), and run the server:

```
# or npm install
yarn install
npm start
```

### Env vars

We use `.env` file for loading environment variables. Please, use provided `env.template` as a template:

* `SITE_URL` - FQ base URL of the site e.g. `https://datahub.io`
* `API_URL` - FQ base URL of the API endpoint eg. `https://api.datahub.io`
* `BITSTORE_URL` - base URL for the bitstore (pkgstore) e.g. `https://pkgstore.datahub.io`

When running locally, use test api address in `.env`:
```
API_URL=https://api-testing.datahub.io
BITSTORE_URL=https://pkgstore-testing.datahub.io
```
or run  
```
npm start dev
```
See the [docs](http://docs.datahub.io/developers/) for more information.

## Developers

Storage manager api doesn't allow requests coming from localhost or any other locations.
So, when you run the server locally some scripts from the showcase page could not be loaded.
To fix this, please run
```
git submodule init && git submodule update
```

To build the CSS:

1. Install sass
2. Run:

   `sass --watch public/sass:public/stylesheets`

To run in watch mode:

```bash
# note the -e which means we watch for changes in templates too
nodemon -e "js html" index.js
```

