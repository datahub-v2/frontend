---
title: Pushing a data file
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

You'll need a CSV file to push.

Let's have a simple CSV file. Create a file in your current directory named `mydata.csv` and paste the following into it (you can use your own):

```
A,B,C
1,one,true
2,two,false
```

## Push the data

Putting your data online is now just one simple command:

```
$ data push mydata.csv
```

The output will be:

```cli-output
\> 🙌  your data is published!

\> 🔗  https://datahub.io/username/dataset (copied to clipboard)
```

**Note:** *by default, findability flag for your dataset is set to **unlisted**, meaning nobody else is able to see it, except you. Use **published** flag to make it publicly available*

```
$ data push mydata.csv --published
```

## Your data's online!

You will see the showcase page with description and preview of the pushed CSV file:

![](https://datahub.io/static/img/showcase.png)

It's may still be processing and in that case you would see the following:

![](https://datahub.io/static/img/processing.png)

Just wait for few moments until we process your file.

Once your data is online share the link to it with your colleagues or friends so they can use it in their code!
