DataHub frontend in node.js.

[![Build Status](https://travis-ci.org/datahq/datahub-frontend.svg?branch=master)](https://travis-ci.org/datahq/datahub-frontend)

## Quick Start

Clone the repo, install dependencies using yarn (or npm), and run the server:

```
# or npm install
yarn install
npm start
```

### Env vars

We use `.env` file for loading environment variables. Please, use provided `env.template` as a template:

* `SITE_URL` - base URL of the site.
* `API_URL` - base URL of the API endpoint.
* `BITSTORE_URL` - base URL for the bitstore (rawstore).

See the docs for more information.
