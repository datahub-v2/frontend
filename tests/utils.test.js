const test = require('ava')

const fixtures = require('./fixtures')
const utils = require('../lib/utils')
const mocks = require('./fixtures')

const readme1 = 'README for with {{ dp.json }}'
const readme2 = 'README for with {{ datapackage }}'
const readme3 = 'README for with {{ datapackage.json }}'
const dpJson =  {
	name: "test",
	resources: []
}

mocks.initMocks()

test('Inserts dp.json into README', async t => {
	let res = utils.dpInReadme(readme1, dpJson)
	t.true(res.indexOf(JSON.stringify(dpJson, null, 2)) > -1)

	res = utils.dpInReadme(readme2, dpJson)
	t.true(res.indexOf(JSON.stringify(dpJson, null, 2)) > -1)

	res = utils.dpInReadme(readme3, dpJson)
	t.true(res.indexOf(JSON.stringify(dpJson, null, 2)) > -1)
})

test('Sanitizes the markdown', async t => {
	const res = utils.textToMarkdown('**hello world**')
  t.is(res, '<p><strong>hello world</strong></p>\n')
})

test('Does not writes not allowed tags', async t => {
	const res = utils.textToMarkdown('<script> let test = test </script>**')
	t.is(res, '<p>**</p>\n')
})

test('Handles with small readme', async t => {
	const res = utils.makeSmallReadme(fixtures.readme)
	t.is(res.length, 294)
	t.true(res.indexOf("S&P") > -1)
})

test('Prettifies bytes in dpjson', async t => {
	let dpjson = {
		name: 'testing-bytes',
		datahub: {
			stats: {
				bytes: 123000
			}
		},
		resources: [
			{
				name: 'testing-bytes',
				bytes: 123000
			}
		]
	}
	const res = utils.prettifyBytes(dpjson)
	t.is(res.datahub.stats.prettyBytes, '120kB')
	t.is(res.resources[0].prettyBytes, '120kB')
})


test(`Formats data and time as ago, q.g., "2d ago"`, async t => {
	const dpjson = {
		created: '2017-07-02',
		updated: '2017-07-02',
		resources: [
			{
				updated: '2017-07-02'
			}
		]
	}
	const res = utils.formatDateTimeAsAgo(dpjson)
	t.true(res.created.includes('ago'))
	t.true(res.updated.includes('ago'))
	t.true(res.resources[0].updated.includes('ago'))
})

test("Adds formats property into dpjson", async t => {
	const dpjson = {
		name: 'test',
		resources: [
			{
				format: 'csv'
			}
		]
	}
	const res = utils.addFormatsAttr(dpjson)
	t.is(dpjson.formats.length, 1)
})

test("Extends and formats attributes in given dpjson", async t => {
	const dpjson = {
		name: 'test',
		created: '2017-07-02',
		updated: '2017-07-02',
		datahub: {
			stats: {
				bytes: 123000
			}
		},
		resources: [
			{
				name: 'test-resource',
				updated: '2017-07-02',
				bytes: 123000,
				format: 'csv'
			}
		]
	}
	const res = utils.extendDpjson(dpjson)
	t.notDeepEqual(res, dpjson)
	t.true(res.created.includes('ago'))
	t.is(res.datahub.stats.prettyBytes, '120kB')
	t.is(res.formats.length, 1)
})

test("generates currentUser object for dashboard page", async t => {
	const currentUser = {
		email: 'test@test.com'
	}
	const res = utils.getCurrentUser(currentUser)
	t.is(res.email, 'test@test.com')
	t.is(res.emailHash, 'b642b4217b34b1e8d3bd915fc65c4452')
})
