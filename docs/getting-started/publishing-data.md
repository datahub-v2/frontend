---
title: Publishing ❒ data
date: 2017-09-26
---

This guide walks you through how to put data online using **data** tool and the DataHub.

Using it, you can store your data online safely and securely, get a showcase that provides a visual overview to your data.

Here we focus on tabular data and especially CSV. CSV is a universal basic format for structured data.

:::info
You can read and learn about CSV in [this post](/docs/data-packages/csv).
:::

## Install the data CLI tool

[Download and install the `data` CLI tool](/docs/getting-started/installing-data) using our separate instructions.

## Get some CSV data

Let's have a simple CSV file. Create a file in your current directory named `mydata.csv` and paste the following into it (you can use your own):

**Note:** *It will validate your data prior to  publishing, if everything is fine - otherwise you'd get validation errors*

```
number,string,boolean
1,one,true
2,two,false
```

## Publish the data

**Note:** *you will need to be logged in to publish data on datahub. It's simple and easy just type **data login** and follow instructions*

Putting your data online is now just one simple command: `data push [path]`

```
$ data push mydata.csv
```

The output will be:

```cli-output
🙌  your data is published!

🔗  https://datahub.io/username/dataset/v/1 (copied to clipboard)
```

**Note:** *by default, it is **unlisted**, meaning it will not appear in search results. Use **published** flag to make it publicly available*

```
$ data push mydata.csv --published
```

## Your data's online!

You will see the showcase page with description and preview of the published CSV file:

![](/static/img/docs/showcase.png)

It's may still be processing and in that case you would see the following:

![](/static/img/docs/processing.png)

Just wait for few moments until we process your file.

Once your data is online share the link to it with your colleagues or friends so they can use it in their code! You can find more information about how to use data in our Getting Data tutorial - http://datahub.io/docs/getting-started/getting-data.
