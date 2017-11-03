---
title: Getting data tutorial
date: 2017-11-01
---

This guide covers how to get data from the DataHub. It includes instructions on how to access and use data directly from common tools and languages like R, Python, JavaScript and many more.

[[toc]]

## Introduction to Datasets

There are lots of datasets already available on DataHub and many more being worked on, including lists of countries, populations, geographic boundaries etc. In this tutorial we will use Country List dataset - a list of countries and their 2 digit codes:

https://datahub.io/core/country-list

## Locating Data

When you arrive at Country List dataset page, you can find data download links as shown below. You can download data in CSV or JSON versions (or you can get all versions and metadata compressed in zip):

![](/static/img/docs/download-links.png)

## Perma-URLs for data

We have developed useful and simple path logic so you can construct URLs by using a dataset page - publisher and dataset names.

Take a look at our perma-URLs for data as shown below. In Country List example, there is only one file named "data" so you URLs would be:

* CSV: https://datahub.io/core/country-list/r/data.csv
* JSON: https://datahub.io/core/country-list/r/data.json

Some datasets may contain several files. You can access them by using file index starting from 0. E.g., in our example we have only one resource so we can use following URLs:

* CSV: https://datahub.io/core/country-list/r/0.csv
* JSON: https://datahub.io/core/country-list/r/0.json

Depending on your needs you may need different versions of the data - we auto generate both **CSV** and **JSON** for all tabular data.

## cURL

Following commands help you to get the data using "cURL" tool. Use `-L` flag so "cURL" follows redirects:

```bash
# Get the data:
curl -L https://datahub.io/core/country-list/r/data.csv

# datapackage.json provides metadata and a list of all data files
curl -L https://datahub.io/core/country-list/datapackage.json

# See just the available data files (resources):
curl -L https://datahub.io/core/country-list/datapackage.json | jq ".resources"
```

## R

If you are using R here's how to get the data you want  quickly loaded:

```
install.packages("jsonlite")
library("jsonlite")

json_file <- "https://datahub.io/core/country-list/datapackage.json"
json_data <- fromJSON(paste(readLines(json_file), collapse=""))

# access csv file by the index starting from 1
path_to_file = json_data$resources[[1]]$path
data <- read.csv(url(path_to_file))
print(data)
```

## Python

For Python, first install the `datapackage` library (all the datasets on DataHub are Data Packages):

```bash
pip install datapackage
```

Again, we'll use the `country-list` dataset:

```python
from datapackage import Package

package = Package('https://datahub.io/core/country-list/datapackage.json')

# get list of resources:
resources = package.descriptor['resources']
resourceList = [resources[x]['name'] for x in range(0, len(resources))]
print(resourceList)

data = package.resources[0].read()
print(data)
```

Learn more about Python implementation of datapackage here - https://github.com/frictionlessdata/datapackage-py.

## Pandas

In order to work with Data Packages in Pandas you need to install the Frictionless Data data package library and the pandas extension:

```bash
pip install datapackage
pip install jsontableschema-pandas
```

To get the data run following code:

```python
import datapackage

data_url = "https://datahub.io/core/country-list/datapackage.json"

# to load Data Package into storage
storage = datapackage.push_datapackage(data_url, 'pandas')

# data frames available (corresponding to data files in original dataset)
storage.buckets

# you can access datasets inside storage, e.g. the first one:
storage[storage.buckets[0]]
```

## JavaScript

If you are using JavaScript, please, follow instructions below:

Install `data.js` module using `npm`:

```bash
npm install data.js
```

Once the package is installed, use the following code snippet:

```javascript
const {Dataset} = require('data.js')

const path = 'https://datahub.io/core/country-list/datapackage.json'

// We're using self-invoking function here as we want to use async-await syntax:
(async () => {
  const dataset = await Dataset.load(path)

  // Get the first data file in this dataset
  const file = dataset.resources[0]
  // Get a raw stream
  const stream = await file.stream()
  // entire file as a buffer (be careful with large files!)
  const buffer = await file.buffer
})()
```

Learn more about `data.js` library here - https://github.com/datahq/data.js.


## Ruby

Install the datapackage library created specially for Ruby language using `gem`:

```bash
gem install datapackage
```

Now get the dataset and read the data:

```ruby
require 'datapackage'

path = 'https://datahub.io/core/country-list/datapackage.json'

package = DataPackage::Package.new(path)
# So package variable contains metadata. You can see it:
puts package

# Read data itself:
resource = package.resources[0]
data = resource.read
puts data
```

Learn more about `datapackage` library for Ruby - https://github.com/frictionlessdata/datapackage-rb.

## Summary

We hope this tutorial is useful and you found information for your needs. Once you know how to get the data, you can explore available datasets on DataHub. There are dozens of core datasets already available and many more being worked on - https://datahub.io/core.
