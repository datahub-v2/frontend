# Getting started

This guide walks you through the non-side-effects commands to test **data** tool and the DataHub.

## Get info on data (file or dataset) at path or url

```bash
data info http://datahub.io/core/finance-vix
```

The output will be:

```
...
# RESOURCES

┌────────────────┬────────┐
│ Name           │ Format │
├────────────────┼────────┤
│ vix-daily      │ csv    │
├────────────────┼────────┤
│ vix-daily_csv  │ csv    │
├────────────────┼────────┤
│ vix-daily_json │ json   │
└────────────────┴────────┘

# README
...
```