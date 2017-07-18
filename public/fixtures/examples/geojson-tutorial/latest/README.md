This is an example Data Package, that demonstrates how to package up GeoJSON data and display it on the map. We are using GeoJSON data for United Kingdom.

### Views

We assume that you are familiar with what [datapackage.json][datapackage.json] is and it's specifications.

To display your GeoJSON data on the map you should define path to your data inside resources and set format attribute to `geojson`. See example datapackage.json:

{{ datapackage.json }}

Note: We are currently not supporting the TopoJSON format. You can use "Vega Graph Spec" and display you TopoJSON data using [Vega][vega] specification. See our [example Data Package][topo]

[datapackage.json]: http://specs.frictionlessdata.io/data-package/#specification
[topo]: /examples/vega-views-tutorial-topojson
[vega]: https://vega.github.io/vega/
