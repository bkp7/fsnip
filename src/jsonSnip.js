const jp = require('jsonpath')
const {setInputType, removeQuotes} = require('./commonFuncs.js')

function buildJsonSearchPath (keyName) {
  if (keyName.substr(0, 1) === '$') {
    return keyName
  } else {
    return "$..['" + keyName + "']"
  }
}

// =================json===============================
export function json (inpObj) {
  // cmdArgs is an array of arguments
  // json is an object containing the json object we need to modify
  setInputType(inpObj, 'json') // all we do is flag our content as being json
}

// =================jsonPrettify=======================
export function jsonPrettify (inpObj, cmdArgs) {
  // cmdArgs is an (optional) array of arguments being indent, maxLength, margins
  // they are all passed as strings so need to be converted to numbers where appropriate
  // we use - 0 to convert string numbers to numeric and === against itself to check for NaN
  if (setInputType(inpObj, 'json')) {
    let opts = inpObj.outputOptions
    // set defaults
    opts.margins = false
    opts.maxLength = 45
    opts.indent = 2
    // overwrite with any values passed in
    if (cmdArgs !== undefined) {
      if (typeof (cmdArgs[0] - 0) === 'number' && !isNaN(cmdArgs[0] - 0)) { opts.indent = (cmdArgs[0] - 0) }
      if (typeof (cmdArgs[1] - 0) === 'number' && !isNaN(cmdArgs[1] - 0)) { opts.maxLength = (cmdArgs[1] - 0) }
      if (cmdArgs[1] === 'infinity') { opts.maxLength = 'infinity' }
      opts.margins = (cmdArgs[2] === 'true') // defaults to false if margins anything other than true
    }
  }
}

// =================ellipsify==========================
export function jsonEllipsify (inpObj, cmdArgs) {
  // cmdArgs is an array of arguments
  // json is an object containing the json object we need to modify

  if (setInputType(inpObj, 'json')) {
    // we have two types of argument for Ellipsify, plain and exclude so separate them out
    var cmdArgsPlain = []
    var cmdArgsExclude = []
    for (let i = 0; i < cmdArgs.length; i++) {
      if (cmdArgs[i].substr(0, 1) === '~') {
        cmdArgsExclude.push(removeQuotes(cmdArgs[i].substr(1)))
      } else {
        cmdArgsPlain.push(removeQuotes(cmdArgs[i]))
      }
    }
    if (cmdArgsPlain.length === 0) { cmdArgsPlain.push('$') }
    for (let i = 0; i < cmdArgsPlain.length; i++) {
      minimizeJsonProperty(inpObj.json, cmdArgsPlain[i], cmdArgsExclude)
    }
  }
}

export function minimizeJsonProperty (json, property, excludes) { // only exported for test purposes
  // this function takes a json object as input.and for every occurrence of the given property puts a placeholder
  // but only if it is an array or an object.
  var arrPlaceholder = ['fsnipPlaceholderArrEllipses'] // a valid json array used as a placeholder to be replaced later with [...] (which is not valid json)
  var strPlaceholder = 'fsnipPlaceholderStrEllipses'
  var jsonPaths = jp.paths(json, buildJsonSearchPath(property)) // creates an array of all the paths of instances of the the property we want to minimize
  for (var i = 0; i < jsonPaths.length; i++) {
    let jsonPath = jp.stringify(jsonPaths[i])
    switch (jp.value(json, jsonPath).constructor.name) {
      case 'Object':
        delKeys(json, jsonPath, excludes)
        jp.value(json, jsonPath)['fsnipPlaceholderObj'] = 'Ellipses' // add a placeholder for the Ellipses
        break
      case 'Array':
        jp.value(json, jsonPath, arrPlaceholder)
        break
      case 'String':
        jp.value(json, jsonPath, strPlaceholder)
        break
      default:
        // do nothing
    }
  }

  function delKeys (json, jsonPath, excludes) {
    var keys = Object.keys(jp.value(json, jsonPath))
    for (var j = 0; j < keys.length; j++) {
      if (excludes.indexOf(keys[j]) === -1) {
        // this key is not in the excludes list so we need to delete it
        delete jp.value(json, jsonPath)[keys[j]]
      }
    }
  }
}

// ===================snip Function==============================
export function jsonSnippet (inpObj, cmdArgs) {
  // cmdArgs is an array of arguments
  // inpObj is an object containing the json object we need to modify
  // the format of the call is eg.
  // '--snip vessel 2' which would extract the second instance of "vessel" in the json supplied
  // with the instance identifier being optional
  if (setInputType(inpObj, 'json')) {
    var occ = 1
    if (cmdArgs.length === 1) {
      occ = 1 // by default we snip the first occurrence of this property
    } else if (cmdArgs.length === 2) {
      if (typeof (cmdArgs[1] - 0) === 'number' && !isNaN(cmdArgs[1] - 0)) {
        occ = (cmdArgs[1] - 0)
        if (occ < 1) {
          inpObj.error.push('--snip requires its second argument to be a numeric values of at least 1 being the instance required')
          return
        }
      } else {
        inpObj.error.push("--snip requires its second argument to be numeric eg. '--snip vessel 2' with the optional second argument being the instance required")
        return
      }
    } else {
      inpObj.error.push("--snip requires 1 or 2 arguments eg. '--snip vessel 2' with the optional second argument being the instance required.")
      return
    }
    var jsonPaths = jp.paths(inpObj.json, buildJsonSearchPath(removeQuotes(cmdArgs[0]))) // creates an array of all the paths to this property
    if (jsonPaths.length < occ) {
      inpObj.error.push('--snip failed because there were only ' + jsonPaths.length + " occurrences of '" + removeQuotes(cmdArgs[0]) + "' found.")
      return
    }
    inpObj.json = jp.value(inpObj.json, jp.stringify(jsonPaths[occ - 1]))
  }
}

// ===================delKeys Function===========================
export function jsonDelKeys (inpObj, cmdArgs) {
  // cmdArgs is an array of arguments
  // inpObj is an object containing the json object we need to remove keys from
  // the format of the call is eg.
  // '-jsonDelKeys vessel gnss' which would delete all instances of "vessel" and "gnss" in the json supplied
  if (setInputType(inpObj, 'json')) {
    for (var i = 0; i < cmdArgs.length; i++) {
      deleteJsonKey(inpObj.json, removeQuotes(cmdArgs[i]))
    }
  }
}

function deleteJsonKey (json, key) {
  // deletes all occurrences of key within json
  var jsonPaths = jp.paths(json, buildJsonSearchPath(key)) // creates an array of all the paths of instances of the key we want to delete
  var parent
  for (var i = 0; i < jsonPaths.length; i++) {
    let jsonPath = jp.stringify(jsonPaths[i])
    parent = jp.parent(json, jsonPath)
    if (Array.isArray(parent)) {
      parent.splice(jsonPaths[i][jsonPaths[i].length - 1], 1)
    } else {
      delete parent[jsonPaths[i][jsonPaths[i].length - 1]]
    }
  }
}
