---
title: The first touch
date: 2017-09-20
---

In this guide you can find some of the non-side-effect commands to test **data** tool.

## Info command

`data info [path]` command provides preview information about data (file or dataset). Get info on data at path by running the following command:

```bash
data info http://github.com/datasets/finance-vix
```

Path can be one of:

* Local path to data
* DataHub URL
* GitHub URL
* Any URL to data

If the path is for dataset, the output will contain README and overview table of available files. Info command for a file will output ascii table of its content. The output for the command above would be something similar to:

```cli-output
CBOE Volatility Index (VIX) time-series dataset including daily open, close,
high and ...
```
