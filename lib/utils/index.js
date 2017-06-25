const marked = require('marked')
const sanitizeHtml = require('sanitize-html')
const removeMd = require('remove-markdown')
const bytes = require('bytes')

/**
* This method takes a readme and data package descriptor as arguments. If
* there is dp variables in readme, it returns readme with datapackage json
* embed into it. Dp variables must be wrapped in double curly braces and can
* be one of: datapackage.json, datapackage, dp.json, dp.
*/
module.exports.dpInReadme = (readme, dp) => {
  const regex = /({{ ?)(datapackage(\.json)?|dp(\.json)?)( ?}})/
  const dpClone = Object.assign({}, dp)

  const markdowned = '\n```json\n' + JSON.stringify(dpClone, null, 2) + '\n```\n'
  const readmeWithDp = readme.replace(regex, markdowned)
  return readmeWithDp
}

/**
*  This method takes any text and sanitizes it from unsafe html tags.
* Then it converts any markdown syntax into html and returns the result.
*/
module.exports.textToMarkdown = text => {
  const allowedTags = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8', 'br', 'b', 'i', 'span',
    'strong', 'em', 'a', 'pre', 'code', 'img', 'tt', 'div', 'ins', 'del',
    'sup', 'sub', 'p', 'ol', 'ul', 'table', 'thead', 'tbody', 'tfoot',
    'blockquote', 'dl', 'dt', 'dd', 'kbd', 'q', 'samp', 'var', 'hr', 'ruby', 'rt',
    'rp', 'li', 'tr', 'td', 'th', 's', 'strike', 'summary', 'details', 'input'
  ]
  const allowedAttributes = {
    '*': [
      'abbr', 'accept', 'accept-charset', 'accesskey', 'action',
      'align', 'alt', 'axis', 'border', 'cellpadding', 'cellspacing',
      'char', 'charoff', 'charset', 'checked', 'clear', 'cols',
      'colspan', 'color', 'compact', 'coords', 'datetime', 'dir',
      'disabled', 'enctype', 'for', 'frame', 'headers', 'height',
      'hreflang', 'hspace', 'ismap', 'label', 'lang', 'maxlength',
      'media', 'method', 'multiple', 'name', 'nohref', 'noshade',
      'nowrap', 'open', 'prompt', 'readonly', 'rel', 'rev', 'rows',
      'rowspan', 'rules', 'scope', 'selected', 'shape', 'size',
      'span', 'start', 'summary', 'tabindex', 'target', 'title',
      'type', 'usemap', 'valign', 'value', 'vspace', 'width',
      'itemprop', 'class', 'checkbox'
    ],
    a: ['href'],
    img: ['src', 'longdesc'],
    div: ['itemscope', 'itemtype'],
    blockquote: ['cite'],
    del: ['cite'],
    ins: ['cite'],
    q: ['cite']
  }
  const markdownToHtml = marked(text)
  const sanitizedHtml = sanitizeHtml(markdownToHtml, {
    allowedTags,
    allowedAttributes
  })

  return sanitizedHtml
}

/**
* This method takes html text and returns first 200 chars of it's plain text
*/
module.exports.makeSmallReadme = readme => {
  const plainText = removeMd(readme)
  if (plainText.leng <= 300) {
    return plainText
  }
  const wordList = plainText.substring(0, 300).split(' ')
  wordList.pop()
  return wordList.join(' ')
}

/**
* Function to prettify bytes
* @param {dpjson} data package descriptor
* @return {dpjson} descriptor with prettified bytes
*/
module.exports.prettifyBytes = dpjson => {
  const newDpjson = Object.assign({}, dpjson)
  if (newDpjson.size) {
    newDpjson.size = bytes(newDpjson.size)
    newDpjson.resources.forEach(resource => {
      resource.size = bytes(resource.size)
    })
  }
  return newDpjson
}
