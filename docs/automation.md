---
title: Automation guide (experimental)
---

## What is "automation"

Automation is an experimental feature of the `data-cli` and https://datahub.io/ which allows you to make a dataset always up-to-date. Usually, there is a processing script alongside with a dataset, that gets a new data from the data-source and transforms it into a proper dataset. At the moment people run those processing scripts manually.

Automation is created to update and wrangle your data periodically and without your interaction. All you need is to set-up an automation configuration and push your dataset to the https://datahub.io once. Now your data will be always up-to-date until the data-source is alive.

Here are steps you have to pass to automate a dataset:

## 0. Choose the dataset to be automated

Take your own dataset or choose one from https://github.com/datasets (check it is not automated yet). We have a lot of features to wrangle data, but for the first time choose a dataset with not too complex processing script.

## 1. Create a `.datahub` folder

The datahub pipeline uses `.datahub` sub-folder inside the datapackage folder to get instructions and metadata. So create the `datapackage_name/.datahub` folder.
There will be `.datahub/flow.yaml` and `.datahub/datapackage.json` files stored.

## 2. Create a `.datahub/flow.yaml`

Instructions for the automation is taken from the special configuration file. So create the `.datahub/flow.yaml` file. Here is template for you:

```yaml
meta:
  dataset: <dataset_name>
  findability: public
  # owner and ownerid should match username and id from
  # cat ~/.config/datahub/config.json
  owner: core
  ownerid: core

inputs:
  -
    kind: datapackage  # currently supports only datapackages
    parameters:
      resource-mapping:
        # resource name and the link to original data-source file
        <resource-name>: <http://source-site.com/datafile.csv>

# the PROCESSING part describes what to do with data, how to 'process' it
# processors are the tools that will wrangle your data. see:
# https://github.com/frictionlessdata/datapackage-pipelines - dpp
# https://github.com/frictionlessdata/tabulator-py - tabulator

# Each processor takes data from "input: <resource-name>",
# does operations that you define in this section
# and saves data into "output: <resource-name>",
# then next processor takes data there and goes on
# (for now we use the same name for input and output)
processing:
  - # put this tabulator processor first in a pipeline if the source is zipped
    input: <resource-name>
    tabulator:
      compression: zip
    output: <resource-name>

  # Datapackage-pipeline operations example. Here is the dpp docs:
  # https://github.com/frictionlessdata/datapackage-pipelines
  -
    input: <resource-name>
    dpp:
      - # delete some columns:
        run: delete_fields
        parameters:
          resources: <resource-name>
          fields:
            - id
            - home_link
            - keywords
      - # unpivot table
        run: unpivot
        parameters:
          resources: <resource-name>
          extraKeyFields:
            -
              name: year
              type: year
          extraValueField:
              name: value
              type: number
          unpivot:
            -
              name: ([0-9]{4})
              keys:
                year: \1
      - # replace, e.g. quarters to dates:  '1998 Q1' -> 1998-03-31 , Q2 -> 06-31, etc
        run: find_replace
        parameters:
          resources: <resource-name>
          fields:
            -
              name: date
              patterns:
                -
                  find: ([0-9]{4})( Q1)
                  replace: \1-03-31
                -
                  find: ([0-9]{4})( Q2)
                  replace: \1-06-31
                -
                  find: ([0-9]{4})( Q3)
                  replace: \1-09-30
                -
                  find: ([0-9]{4})( Q4)
                  replace: \1-12-31
    output: <resource-name>

# how often to update the data
schedule: every 1d
```

## 3. create `.datahub/datapackage.json`

`.datahub/datapackage.json` file is not required, though it is used to store the dataset metadata (and to describe intermediate resources if you need them) in the package.
So create `.datahub/datapackage.json` file. Here is example for you:

```json
{
  "name": "package_name",
  "title": "package_title",
  "description": "description",
  "license": "ODC-PDDL-1.0",
  "readme": "the very long string of readme, copy of readme.md",

  // other non-required fields like:
  // "homepage": "url",
  // "version": "not_n",

  "sources": [
    {
      "name": "source_name",
      "path": "source_url",
      "title": "title"
    }
  ],

  // resources section describes the data structure: files, fields, etc
  // see the datapackage.json description for more details
  // https://frictionlessdata.io/guides/data-package/
  //
  // with the latest changes, the automation engine could infer the resource
  // schema automatically from the source data, so now we could delete 'resources'
  // section from this file.
  // Only leave it, if you need to describe additional intermediate resources.
  "resources": [
    {
      "name": "resource-name",  // this is a <resource-name> in the flow.yaml
      "path": "data/data.csv",
      "schema": {
        "fields": [
          {
            "name": "date",
            "type": "date"
          },
          {
            "description": "field description",
            "name": "GDP",
            "type": "number"
          }
        ]
      }
    }
  ]
}
```

## 4. Pushing to the server
* check that owner&ownerid in your `flow.yaml` is equal to username and id from the `~/.config/datahub/config.json` file
* do `data login`
* do `data push-flow`

### Local Errors

> `> Error! Cannot read property 'split' of null`

If you see such error it means there were some errors, but we lost it on the way. To see the actual error - please, use `--debug` flag: `data push-flow --debug`

### Pipeline Errors

* go to https://datahub.io/<username>/<dataset_name>/v/<n> to see errors.
* fix configuration files and do `data push-flow` again

**Note!** If you meet the error you can't fix - ask for the help here: https://gitter.im/datahubio/chat

**When all errors are fixed - you will see the datapackage on the datahub.io page!**

## 5. Final fixes
* update `readme.md` file - add automation description and a future dataset link on the datahub.io
* update the `.datahub/datapackage.json` readme section
* if you are planning to publish the dataset under 'core' user - change `owner/ownerid` to `core`
* push the dataset with the `.datahub` folder on the GitHub (the datahub.io not stores automation scripts in the result dataset)
* (optional) ask Datahub staff to push dataset under 'core' if the data is important and you want everybody to use it.
