Case-Shiller Index of US residential house prices. Data comes from S&P
Case-Shiller data and includes both the national index and the indices for 20
metropolitan regions. The indices are created using a repeat-sales methodology.

## Data

As per the [home page for Indices on S&P website][sp-home]:

> The S&P/Case-Shiller U.S. National Home Price Index is a composite of
> single-family home price indices for the nine U.S. Census divisions and is
> calculated monthly. It is included in the S&P/Case-Shiller Home Price Index
> Series which seeks to measure changes in the total value of all existing
> single-family housing stock.

Documentation of the methodology can be found at:
<http://www.spindices.com/documents/methodologies/methodology-sp-cs-home-price-indices.pdf>

Key points are (excerpted from methodology):

* The indices use the "repeat sales method" of index calculation which uses
  data on properties that have sold at least twice, in order to capture the
  true appreciated value of each specific sales unit.
* The quarterly S&P/Case-Shiller U.S. National Home Price Index aggregates nine
  quarterly U.S. Census division repeat sales indices using a base period a nd
  estimates of the aggregate value of single family housing stock for those periods.
* The S&P/Case - Shiller Home Price Indices originated in the 1980s by Case
  Shiller Weiss's research principals, Karl E. Case and Robert J. Shiller. At
  the time, Case and Shiller developed the repeat sales pricing technique. This
  methodology is recognized as the most reliable means to measure housing price
  movements and is used by other home price ind ex publishers, including the
  Office of Federal Housing Enterprise Oversight (OFHEO)

[sp-home]: http://www.spindices.com/index-family/real-estate/sp-case-shiller

## Preparation

To download and process the data do:

    python scripts/process.py

Updated data files will then be in `data` directory.

Note: the URLs and structure of the source data have evolved over time with the
source data URLs changing on *every release*.

Originally (2013) the site provided a table of links but these are not direct
file URLs and you have dig around in S&P's javascript to find the actual
download locations. As of mid-2014 the data is consolidated in one primary XLS
but the HTML you see in your browser and the source HTML are different. In
addition, the actual location of the XLS file continues to change on each
release.

## License

Any rights of the maintainer are licensed under the PDDL. Exact legal status of
source data (and hence of resulting processe data) is unclear but could have a
presumption of public domain given its factual nature and US provenance.
However, the current application of PDDL is indicative of maintainers
best-guess (and comes with no warranty).

