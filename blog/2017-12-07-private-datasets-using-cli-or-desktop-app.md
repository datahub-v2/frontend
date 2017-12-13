---
title: Private datasets using CLI or desktop app
date: 2017-12-07
authors: ['anuveyatsu']
---

We are glad to announce that DataHub users can now have **private** datasets so that only authorized users can view it. This is especially useful when you want to restrict access to your data. Please, take a look at our membership plans to see which users can have private data:

https://datahub.io/pricing

## How to publish private datasets?

You can use either the command line tool or the "Data" desktop app. Please, visit our download page to find out more about available tools:

https://datahub.io/download

### Publish using the "Data" app

Once you are ready to publish your data, just select "private" option and then press "Go" button:

![](/static/img/docs/push-private.png)

:::info
Learn more about using the "Data" app [here](http://datahub.io/blog/data-desktop-app-alpha-release).
:::

### Publish using the command line tool

Simply pass `--private` flag when you "push" your data so once it is processed and online only you can view it:

```
$ data push myData --private
```

:::info
Learn more about how to publish datasets using the CLI [here](http://datahub.io/docs/getting-started/pushing-data).
:::
