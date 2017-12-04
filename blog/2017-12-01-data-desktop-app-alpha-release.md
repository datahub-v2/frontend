---
title: Data desktop app - alpha release
date: 2017-12-01
authors: ['anuveyatsu']
---

We are pleased to announce the launch of our new desktop application for DataHub users. The app allows for drag and drop uploading to the DataHub, with preview and data validation prior to upload. Currently the app is in alpha and only available for MacOS -- but we plan Linux and Windows soon! Get the app now from:

https://datahub.io/download

## Command line tool is always up-to-date

The `data` desktop app installs and maintains the command line program up to date automatically:

![](/static/img/docs/app-cli-update.png)

## Drag and drop files

Simply drag and drop any files (e.g., CSV file or datapackage.json) into the tray so you can get a showcase page for it:

![](/static/img/docs/drag-n-drop.gif)

## Preview showcase page and edit properties

Once you have dropped a file, a window with showcase for your data will appear. Here you can preview how it would look like online and edit name and title properties for it:

![](/static/img/docs/app-showcase.png)

## Table Schema editor and validation info

Scroll down the page and you can see "Field Information" table that contains details from table schema for the data. You can see validity information for each field and edit field type if necessary. Once you have made a change, it will re-validate and update validity message:

![](/static/img/docs/app-field-info.png)

## Publish it!

Ready to publish your data? Just hit the "Go!" button on the top of the page and it will be published at given path on datahub.io website. Once publish process is finished, you will get a notification - click on it to open online showcase page in your default browser:

![](/static/img/docs/app-publish.png)
