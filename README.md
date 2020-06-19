## Table of contents
- [Table of contents](#table-of-contents)
- [Quick Start](#quick-start)
  - [Env vars](#env-vars)
- [Developers](#developers)
  - [Analytics](#analytics)
- [Deployment](#deployment)

---

DataHub frontend in Node.js.

[![Build Status](https://travis-ci.org/datopian/frontend.svg?branch=master)](https://travis-ci.org/datahq/frontend)

## Quick Start

Clone the repo, install dependencies using yarn (or npm), and run the server:

```
# or npm install
yarn install
npm start
```

### Env vars

We use `.env` file for loading environment variables. Please use the provided `env.template` as a template:

* `SITE_URL` - FQ base URL of the site, e.g. `https://datahub.io`
* `API_URL` - FQ base URL of the API endpoint, e.g. `https://api.datahub.io`
* `BITSTORE_URL` - base URL for the bitstore (pkgstore) e.g. `https://pkgstore.datahub.io`

When running locally, use test api address in `.env`:

```bash
API_URL=https://api-testing.datahub.io
BITSTORE_URL=https://pkgstore-testing.datahub.io
```

See the [docs](http://docs.datahub.io/developers/) for more information.

## Developers

The JavaScript portion of the app, which is responsible for rendering views,
 comes from a different repo. That repo must be submoduled in and then built:

```bash
git submodule init && git submodule update
```

To build the CSS:

1. Install sass
2. Run:

   `sass --watch public/sass:public/stylesheets`

Now run the server:

```bash
export API_URL=https://api.datahub.io
export BITSTORE_URL=https://pkgstore.datahub.io
export dev=true
npm start
```

To run in watch mode:

```bash
# Note the -e which means we watch for changes in templates too
nodemon -e "js html" index.js
```

To run tests (make sure all environment variables are set):

```bash
yarn test
```

### Analytics

We use Google Tag Manager to manage all tags (eg, google analytics, optimize and more) so instead of adding a new script into templates, you should consider editing via UI of Tag Manager.

## Deployment

1. When pushing any commit to the `master` branch, it triggers a build on [the Deploy repo](https://github.com/datopian/deploy/pulls) which then creates a pull request there.
2. The changes in frontend are auto deployed to the staging site of DataHub, located at https://testing.datahub.io.
3. Once the staging site looks as expected, deployment to production happens by merging the automatically created pull request from step 1.
4. That's it! Just wait for about 5 minutes and you should be able to see the changes reflected on DataHub.io.
