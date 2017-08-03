const assert = require('assert')

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

describe('Utils', () => {
  it('Inserts dp.json into README', async () => {
		let res = utils.dpInReadme(readme1, dpJson)
		assert(res.indexOf(JSON.stringify(dpJson, null, 2)) > -1)

		res = utils.dpInReadme(readme2, dpJson)
		assert(res.indexOf(JSON.stringify(dpJson, null, 2)) > -1)

		res = utils.dpInReadme(readme3, dpJson)
		assert(res.indexOf(JSON.stringify(dpJson, null, 2)) > -1)
  })

	it('Sanitizes the markdown', () => {
		const res = utils.textToMarkdown('**hello world**')
		assert.equal(res, '<p><strong>hello world</strong></p>\n')
	})
	it('Does not writes not allowed tags', () => {
		const res = utils.textToMarkdown('<script> let test = test </script>**')
		assert.equal(res, '<p>**</p>\n')
	})

	it('Handles with small reamde', () => {
		const res = utils.makeSmallReadme(fixtures.readme)
		assert.equal(res.length, 294)
		assert(res.indexOf("S&P" > -1))
	})

	it('Prettifies bytes in dpjson', () => {
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
		assert.equal(res.datahub.stats.prettyBytes, '120.12kB')
		assert.equal(res.resources[0].prettyBytes, '120.12kB')
	})

	it('Formats date and time as ago, e.g., "2d ago"', () => {
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
		assert(res.created.includes('ago'))
		assert(res.updated.includes('ago'))
		assert(res.resources[0].updated.includes('ago'))
	})

	it('Adds formats property into dpjson', () => {
		const dpjson = {
			name: 'test',
			resources: [
				{
					format: 'csv'
				}
			]
		}
		const res = utils.addFormatsAttr(dpjson)
		assert.equal(dpjson.formats.length, 1)
	})

	it('Extends and formats attributes in given dpjson', () => {
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
		assert.notDeepEqual(res, dpjson)
		assert(res.created.includes('ago'))
		assert.equal(res.datahub.stats.prettyBytes, '120.12kB')
		assert.equal(res.formats.length, 1)
	})

	it('Generates currentUser object for dashboard page', () => {
		const currentUser = {
			email: 'test@test.com'
		}
		const res = utils.getCurrentUser(currentUser)
		assert.equal(res.email, 'test@test.com')
		assert.equal(res.emailHash, 'b642b4217b34b1e8d3bd915fc65c4452')
	})

	it('Generates normalized dp from extended dp', () => {
		const extended = require('./fixtures/extended-dp/datapackage.json')
		const normalized = utils.normalize(extended)
		// The main one has name of Original
		assert.equal(normalized.resources[0].name, 'co2-mm-mlo')
		// Original is in alternates
		assert.deepEqual(extended.resources[17], normalized.resources[5].alternates[0])
		// Json version is in alternates
		assert.deepEqual(extended.resources[1], normalized.resources[0].alternates[1])
	})
})
