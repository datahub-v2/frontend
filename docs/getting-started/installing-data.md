# Installing ❒ data

This guide will cover how to install the **data** tool and verify that it is working properly. **data** is distributed as a command line tool.

There are two options for installation:

1. Installing pre-built binaries. These have no dependencies and will work "out of the box"
2. Install via npm: if you have node (>= v7.6) and npm installed you can install via npm

## Installing binaries

1. Go to the [releases page](https://github.com/datahq/datahub-cli/releases)
2. Download the pre-built binary for your platform (MacOS and LinuxOS x64 at present)
3. Move the binary into your `$PATH` e.g. on Mac you could move to `/usr/local/bin/`
 
    ```bash
    $ mv data-{os-distribution} /usr/local/bin/data
    ```

## Installing via npm

You can also install it from `npm` as follows:

```bash
$ npm install -g datahub-cli
```

## Verifying

To test that it is installed correctly run:

```bash
$ data --version
```

This should output a version number, for example on my machine it shows:

```
0.4.1
```

