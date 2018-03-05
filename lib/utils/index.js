const sanitizeHtml = require('sanitize-html')
const removeMd = require('remove-markdown')
const bytes = require('bytes')
const timeago = require('timeago.js')
const md5 = require('md5')

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
  const markdownToHtml = module.exports.md.render(text)
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
  if (!readme) {
    return null
  }
  const plainText = removeMd(readme)
  if (plainText.length <= 300) {
    return null
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
  dpjson.datahub.stats.prettyBytes = bytes(dpjson.datahub.stats.bytes, {decimalPlaces: 0})
  dpjson.resources.forEach(resource => {
    resource.prettyBytes = bytes(resource.bytes, {decimalPlaces: 0})
    if (resource.alternates) {
      resource.alternates.forEach(res => {
        res.prettyBytes = bytes(res.bytes, {decimalPlaces: 0})
      })
    }
  })
  return dpjson
}

/**
* Function to convert normal date and time to "time ago"
* @param {dpjson} data package descriptor
* @return {dpjson} with formatted dates - created and updated dates
*/
module.exports.formatDateTimeAsAgo = dpjson => {
  if (dpjson.created) {
    dpjson.created = timeago().format(dpjson.created)
  }
  if (dpjson.updated) {
    dpjson.updated = timeago().format(dpjson.updated)
  }
  if (dpjson.datahub && dpjson.datahub.modified) {
    dpjson.datahub.modified = timeago().format(dpjson.datahub.modified)
  }
  if (dpjson.datahub && dpjson.datahub.created) {
    dpjson.datahub.created = timeago().format(dpjson.datahub.created)
  }
  dpjson.resources.forEach(resource => {
    if (resource.updated) {
      resource.updated = timeago().format(resource.updated)
    }
  })
  return dpjson
}

/**
* Adds "formats" property with unique properties to descriptor
* @param {dpjson} descriptor
* @return {dpjson} with formats attr
*/
module.exports.addFormatsAttr = dpjson => {
  const formats = dpjson.resources.map(resource => {
    return resource.format
  })
  const setOfFormats = new Set(formats)
  dpjson.formats = [...setOfFormats]
  return dpjson
}

/**
* Function to extend descriptor so it has all necessary properties (and formatted) for frontend
* @param {dpjson} descriptor
* @return {dpjson} with additional properties and formatted attributes
*/
module.exports.prepareForFrontend = dpjson => {
  let newDpjson = JSON.parse(JSON.stringify(dpjson))
  try {
    newDpjson = module.exports.prettifyBytes(newDpjson)
    newDpjson = module.exports.formatDateTimeAsAgo(newDpjson)
    newDpjson = module.exports.addFormatsAttr(newDpjson)
  } catch (err) {
    console.log('Could not format the following dataset: ' + dpjson.name)
  }
  return newDpjson
}

/**
* Generates currentUser object with all necessary data for rendering dashboard page
*
* @param data about currentUser from cookies (jwt, email, name)
* @return {Object} currentUser with all data needed for rendering dashboard page
*/
module.exports.getCurrentUser = currentUser => {
  if (currentUser.email) {
    currentUser.emailHash = md5(currentUser.email)
  }
  currentUser.username = currentUser.username
  // Hard-coded following properties for now, we need an API to get them
  currentUser.plan = 'Basic'
  return currentUser
}

/**
* Markdown processor with our custom settings
*/
const hljs = require('highlight.js')
module.exports.md = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(lang, str, true).value +
               '</code></pre>';
      } catch (__) {}
    }

    return '<pre class="hljs"><code>' + module.exports.md.utils.escapeHtml(str) + '</code></pre>';
  }
})
  .use(require('markdown-it-anchor'), {
    permalink: true,
    permalinkSymbol: '<i class="fa fa-link" aria-hidden="true"></i>'
  })
  .use(require('markdown-it-table-of-contents'), {
    includeLevel: [1, 2, 3, 4, 5, 6]
  })
  .use(require('markdown-it-container'), 'info')
  .use(require('markdown-it-container'), 'cli-output', {
    marker: '`'
  })


module.exports.pagination = (c, m) => {
  let current = c,
      last = m,
      delta = 2,
      left = current - delta,
      right = current + delta + 1,
      range = [],
      rangeWithDots = [],
      l;

  range.push(1)
  for (let i = c - delta; i <= c + delta; i++) {
    if (i >= left && i < right && i < m && i > 1) {
      range.push(i);
    }
  }
  range.push(m)

  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }
  return rangeWithDots;
}
