This is an example Data Package, that demonstrates how to build the awesome visualizations using the "Vega Graph Spec". We are using lifelines of the first 5 presidents of the US - one of the examples from [vega editor][editor] - and displaying it here, on DataHub with slightest modifications in vega-spec.

## Views

We assume that you are familiar with what [datapackage.json][datapackage.json] is and it's specifications.

To create graphs for your tabular Data Package, the `datapackage.json` should include the `views` attribute that is responsible for visualizations.

If you are familiar with [Vega][vega] specifications, you would probably like to use all it's futures and display you data with desired visualizations in a Vega way. To use it, inside `views` you should set `specType` to "vega" and define some graph specifications in `spec`. See example datapackage.json:

### Vega Graph Specifications

{{ datapackage.json }}

<br>

You can use almost the same specifications inside `spec` attribute, that are used for setting the vega graphs. Only difference is that in `data` property, `url` and `path` attributes are moved out.

```
  ...
  "spec": {
    ...
    "data": [
      {
        "name": "people"
      },
      {
        "name": "events",
        ...
      }
    ],
  }
```

Instead we use `name` attribute to reference to a dataset. Note, how we created a new object inside `data` property - `{"name": "people"}` to reference it to resources (this names are identical to names of resources)

Outside of `spec` attribute there are some other important parameters to note:

<table class="table table-bordered table-striped resource-summary">
  <thead>
   <tr>
     <th>Attribute</th>
     <th>Type</th>
     <th>Description</th>
   </tr>
  </thead>
  <tbody>
    <tr>
      <th>name</th>
      <td>String</td>
      <td>Unique identifier for view within list of views.</td>
    </tr>
    <tr>
      <th>title</th>
      <td>String</td>
      <td>Title for the graph.</td>
    </tr>
    <tr>
      <th>resources</th>
      <td>Array</td>
      <td>Data sources for this spec. It can be either resource name or index. By default it is the first resource.</td>
    </tr>
    <tr>
      <th>specType</th>
      <td>String</td>
      <td>Available options: simple, vega, plotly <strong>(Required)</strong>.</td>
    </tr>
  </tbody>
</table>

[vega]: https://vega.github.io/vega/
[editor]: https://vega.github.io/vega-editor/?mode=vega&spec=lifelines
