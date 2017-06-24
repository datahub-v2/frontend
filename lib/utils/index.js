/**
* This method takes a readme and data package descriptor as arguments. If
* there is dp variables in readme, it returns readme with datapackage json
* embed into it. Dp variables must be wrapped in double curly braces and can
* be one of: datapackage.json, datapackage, dp.json, dp.
*/
module.exports.dpInReadme = (readme, dp) => {
	const regex = /({{ ?)(datapackage(\.json)?|dp(\.json)?)( ?}})/
	const dpClone = Object.assign({}, dp)

	const markdowned = "\n```json\n" + JSON.stringify(dpClone, null, 2) + "\n```\n"
	const readmeWithDp = readme.replace(regex, markdowned)
	return readmeWithDp
}
