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

See the [docs](http://docs.datahub.io/developers/) for more information.

## Developers

To build the CSS:

1. Install sass
2. Run:

   `sass --watch public/sass:public/stylesheets`

