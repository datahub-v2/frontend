---
title: API instructions
---

# intro

> skip the intro if you are familiar with the datapackage concept.

One of ideas of the datahub.io project is to store the data together with its description (the metadata). Data+metadata are called the *datapackage* or *dataset*. Detailed description of the *datapackage* format is here: http://datahub.io/docs/data-packages

So usually a dataset consist of:
- **Metadata**: descriptor file, named `datapackage.json`, it contains all the information that you need to find and to use the data itself
- **Data**: data file(s). Usually it is tabular (csv, xls) but could be any file type.

# GET API

### 1. get files via `/r/` endpoint
Use our `/r/` endpoint, if you know the name of the file you need in the dataset, e.g. for `data.csv`:
```
GET https://datahub.io/<owner>/<dataset_name>/r/data.csv
```
If you don't know the filename, or there is a lot of files in the dataset, use our enumeration logic:
```
GET https://datahub.io/<owner>/<dataset_name>/r/0.csv
GET https://datahub.io/<owner>/<dataset_name>/r/1.csv
GET https://datahub.io/<owner>/<dataset_name>/r/2.csv
...
```

The datahub.io path logic is described here: [getting-data#perma-urls-for-data](http://datahub.io/docs/getting-started/getting-data#perma-urls-for-data)

### 2. get the descriptor
If you need to see the list of the files in the dataset, or other metadata, then get the descriptor (`datapackage.json`):
```
GET https://datahub.io/<owner>/<dataset_name>/datapackage.json
```
Now you could parse the descriptor to get each resource (data) path:
```python
descriptor = json.load('datapackage.json')
for resource in descriptor.resources:
    print(resource.name, resource.path)
```
Then you can easily get all the files.

# POST API

Posting your data on the datahub.io using our API is more complex process then Getting data, because we are using an authentication system.
The easy way is to use our CLI tool [publishing_data](http://datahub.io/docs/getting-started/publishing-data).

If you need to POST data from your application, here is the way:
* Read the Documentation: http://docs.datahub.io/developers/api/
* Use our JS lib, that interacts with the datahub: https://github.com/datahq/datahub-client
* example of use: https://github.com/datahq/data-cli/blob/master/bin/data-push.js
