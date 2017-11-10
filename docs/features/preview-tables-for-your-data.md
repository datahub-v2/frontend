---
title: Preview tables for your data
---

When you arrive at a showcase page, the first thing you would want is to take a look at the actual data so you can decide whether it fits your needs. To make this process quick and effortless, we provide preview tables for all tabular data. For example, let's take a look at our Country List dataset:

https://datahub.io/core/country-list

If you scroll down the page, you would find the table displaying the data:

![](/static/img/docs/country-list-preview-table.png)

If data is large enough, these tables would cause performance issues on users' browser. To resolve that problem we generate the preview versions of data that consist of first 2k rows (if a dataset is small enough, we skip generation of a preview version).