---
title: Installing ❒ data
date: 2017-09-19
---

This guide will cover how to install the **data** tool and verify that it is working properly. **data** is distributed as a command line tool.

There are two options for installation:

1. Installing pre-built binaries. These have no dependencies and will work "out of the box"
2. Install via npm: if you have node (>= v7.6) and npm installed you can install via npm

## Installing binaries

1. Go to the [releases page](/download)
2. Download the pre-built binary for your platform (MacOS, LinuxOS x64 or Windows)
3. Uncompress downloaded asset

    ```bash
    # MacOS and Linux:
    $ gunzip -f data-{os-distribution}.gz

    # Windows:
    $ gzip -d data-win.exe.gz
    ```
4. Make it executable

    ```bash
    # MacOS and Linux only:
    $ chmod +x data-{os-distribution}
    ```
5. Move the binary into your `$PATH` e.g. on Mac you could move to `/usr/local/bin/`

    ```bash
    # MacOS and Linux:
    $ mv data-{os-distribution} /usr/local/bin/data

    # Windows (the path may change depending on your OS distribution and configurations):
    $ move data-win.exe "C:\Windows\System32\data.exe"
    ```

:::info
For linux users, if you encounter errors related to location of `xdg-open` package. Use the following command to copy it from `/usr/bin/xdg-open` to `/usr/local/bin/xdg-open`:

```bash
$ cp /usr/bin/xdg-open /usr/local/bin/xdg-open
```
:::

## Installing via npm

You can also install it from `npm` as follows:

```bash
$ npm install -g data-cli
```

## Verifying

To test that it is installed correctly run:

```bash
$ data --version
```

This should output a version number, for example on my machine it shows:

```
0.6.3
```

## A first step

Finally, and as a last test, you can try out your first `❒ data` command: `info`.

**Note:** *This command makes **no** changes to anything on your machine or on the DataHub so it is completely safe to try out!*

The `info` command provides info on a data file or dataset whether it is on the DataHub or your local disk. Here's an example for you to try:

```bash
data info https://datahub.io/core/finance-vix/datapackage.json
```

It should something like this:

```cli-output
CBOE Volatility Index (VIX) time-series dataset including daily open, close,
high and low ...
```

You can learn more about **data** tool here - http://datahub.io/docs/features/data-cli.
