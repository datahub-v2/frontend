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
			size: 123000,
			resources: [
				{
					name: 'testing-bytes',
					size: 123000
				}
			]
		}
		const res = utils.prettifyBytes(dpjson)
		assert.equal(res.size, '120.12kB')
	})

	it('Generates list of packages', async () => {
		const listOfPkgId = [
			{
				owner: 'admin',
				name: 'demo-package'
			}
		]
		const res = await utils.getListOfDatapackages(listOfPkgId)
		assert.equal(res[0]['name'], 'demo-package')
		assert.equal(res.length, 1)
	})

	it('Generates list of readme for given list of pkgIds', async () => {
		const listOfPkgId = [
			{
				owner: 'admin',
				name: 'demo-package'
			}
		]
		const res = await utils.getListOfReadme(listOfPkgId)
		assert.equal(res.length, 1)
		assert(res[0].includes('This README and datapackage is borrowed'))
	})

	it('Generates list of datapackages with readme and owner info', async () => {
		const listOfPkgId = [
			{
				owner: 'admin',
				name: 'demo-package'
			}
		]
		const res = await utils.getListOfDpWithReadme(listOfPkgId)
		assert.equal(res[0].shortReadme.length, 294)
		assert.equal(res[0].owner.username, 'admin')
	})
})
