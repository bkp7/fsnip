const { jsonPrettify } = require('./jsonSnip.js')

export function setInputType (inpObj, newType) { // only exported for testing purposes
  if (typeof inpObj.type === 'undefined' || inpObj.type === '') { // type has not previously been set
    inpObj.type = newType
    if (newType === 'json') {
      inpObj.json = JSON.parse(inpObj.text)
      jsonPrettify(inpObj) // sets default output options for json
      return true
    } else if (newType === 'plain') {
      inpObj.plain = inpObj.text
      return true
    } else {
      return false
    }
  } else if (inpObj.type !== newType) { // it's already been set to something else so there's a problem
    if (typeof inpObj.error === 'undefined') { inpObj.error = [] }
    inpObj.error.push('cannot mix options designed to process different types of file')
    return false
  } else {
    return true
  }
}

export function removeQuotes (str) {
  // if the passed string has matching encapsulating quotes these are removed
  if ((str.substr(0, 1) === '\'' && str.substr(-1) === '\'') ||
      (str.substr(0, 1) === '"' && str.substr(-1) === '"')) {
    return str.substr(1, str.length - 2)
  } else {
    return str
  }
}
