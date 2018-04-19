---
title: Validate your data-package descriptor online
date: 2018-04-19
authors: ['acckiygerman']
---

To help users with creation of data-packages we have implemented a descriptor validation tool:
https://datahub.io/tools/validate


Now users can check the data-package descriptor file to be sure they have no errors in it.

## How to use it

The descriptor should be stored online, e.g. on the github.

You should provide the URL to the descriptor (datapackage.json) file and press 'Validate' button.

:::info
Online validator tool validates only the descriptor file.

Here you can read about the [full data validation on the DataHub](https://datahub.io/blog/data-validation-in-the-datahub).
:::

## How we validate

We try to create a data-package object using
[datapackage-js](https://github.com/frictionlessdata/datapackage-js)
and then show user any errors the data-package has with `Package.valid` and `Package.errors` methods:
![](/static/img/docs/online-validation-tool-invalid-package.png)

To create a valid data-package, please read full datapackage.json specs here:
https://frictionlessdata.io/docs/data-package/.
