/*
=====fsnip======

fsnip is a command line utility to extract and modify json from a file.

*/
const fs = require('fs')
const jp = require('jsonpath')
const stringify = require('json-stringify-pretty-compact')
const chalk = require('chalk')

export function cli (args) {
  if (args.length === 3 && args[2] === '--help') {
    console.info('fsnip is a tool for extracting json snippets from json files.\n\n' +
                 'Usage:\n' + '' +
                 'TODO still \n' +
                 '  fsnip FILE [options [arguments]]    process the file and output the result to the console\n' +
                 '  FILE         Specifies the file to process.\n' +
                 '  --ellipsify  replaces the passed object with ellipses (...)\n' +
                 '                 but excludes any keys which follow prepended by ~\n' +
                 '                 eg. fsnip myfile.json --ellipsify $..address ~postcode')
  } else if (args.length >= 3) {
    try {
      var txt = fs.readFileSync(args[2]).toString()
    } catch (err) {
      console.error(chalk.redBright("unable to read file '" + args[2] + "'"))
    }
    if (typeof txt !== 'undefined') {
      console.log(fsnipDo(args.slice(3), txt))
    }
  } else { // we couldn't recognise the format on the command line
    console.error(chalk.redBright('Unrecognised arguments passed to fsnip. See fsnip --help'))
  }
}

function fsnipDo (cmdOpts, inputText) {
  // does the processing of the fsnip command
  // inputText is the text we want to modify
  if (cmdOpts === null || cmdOpts.length === 0) { return inputText } // no processing required as no options passed in
  var src = { // a temporary structure containing the text we are working on its type eg. 'json' (which is set later)
    text: inputText,
    type: '',
    outputOptions: {},
    error: [],
    json: null,
    plain: null
  }

  // now we are going to parse through the options and arguments to extract individual options together with their arguments
  var cmdOpt = '' // current option from the cmdOptsString list
  var cmdArgs = [] // array containing any arguments for the cmdOpt
  for (var i = 0; i < cmdOpts.length; i++) {
    if (cmdOpts[i].substr(0, 2) === '--') { // this is a new option eg. -jsonEllipsify
      if (cmdOpt !== '') { runOption(cmdOpt, cmdArgs, src) } // process/run any previous Option we found
      cmdOpt = cmdOpts[i] // store the new option we have found
      cmdArgs = [] // reset ready for any new arguments
    } else {
      // this must be an argument for the current option
      if (cmdOpt === '') { // error if we don't currently have an option
        src.error.push("invalid argument '" + cmdOpts[i] + "' passed without valid option to fsnip")
      }
      cmdArgs.push(cmdOpts[i])
    }
  }
  if (cmdOpt !== '') { runOption(cmdOpt, cmdArgs, src) } // process/run the very last Option we found
  postProcess(src)
  if (src.error.length === 0) {
    return src.text
  } else {
    return chalk.redBright(src.error)
  }
}

function runOption (option, args, inpObj) {
  // option is a string eg. '-jsonEllipsify'
  // arguments is an array of arguments for the option
  // inpObj is an object containing the text, type and json object we need to modify
  // this function acts as a marsheller to identify options and process them accordingly
  switch (option) {
    case '--json':
      json(inpObj, args)
      break
    case '--prettify':
      jsonPrettify(inpObj, args)
      break
    case '--ellipsify':
      jsonEllipsify(inpObj, args)
      break
    case '--snip':
      jsonSnippet(inpObj, args)
      break
    case '--delKeys':
      jsonDelKeys(inpObj, args)
      break
    case '--from':
      textFrom(inpObj, args, false)
      break
    case '--start':
      textFrom(inpObj, args, true)
      break
    case '--to':
      textTo(inpObj, args, false)
      break
    case '--finish':
      textTo(inpObj, args, true)
      break
    default:
      inpObj.error.push("invalid option '" + option + "' for fsnip")
  }
}

function postProcess (inpObj) {
  // does any post process tidying up
  if (inpObj.type === 'json') {
    // stringify as required
    let opts = inpObj.outputOptions
    if (opts.maxLength === 'infinity' && opts.margins === false) {
      inpObj.text = JSON.stringify(inpObj.json)
    } else if (opts.maxLength === 0 && opts.margins === false) {
      inpObj.text = JSON.stringify(inpObj.json, null, opts.indent)
    } else {
      inpObj.text = stringify(inpObj.json, opts)
    }
    // now replace any placeholders. The placeholders are valid JSON but what we replace them with may not be valid JSON
    inpObj.text = inpObj.text.replace(/\[\s*"fsnipPlaceholderArrEllipses"\s*\]/g, '[...]')
    inpObj.text = inpObj.text.replace(/\{\s*"fsnipPlaceholderObj"\s*:\s*"Ellipses"\s*\}/g, '{...}') // do this separately to the one below so that if the object is empty it appears all on one line
    inpObj.text = inpObj.text.replace(/"fsnipPlaceholderObj"\s*:\s*"Ellipses"/g, '...')
    inpObj.text = inpObj.text.replace(/"fsnipPlaceholderStrEllipses"/g, '"..."')
  } else if (inpObj.type === 'plain') {
    inpObj.text = inpObj.plain.trim()
  }
}

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

function buildJsonSearchPath (keyName) {
  if (keyName.substr(0, 1) === '$') {
    return keyName
  } else {
    return "$..['" + keyName + "']"
  }
}

function removeQuotes (str) {
  // if the passed string has matching encapsulating quotes these are removed
  if ((str.substr(0, 1) === '\'' && str.substr(-1) === '\'') ||
      (str.substr(0, 1) === '"' && str.substr(-1) === '"')) {
    return str.substr(1, str.length - 2)
  } else {
    return str
  }
}

// =================json===============================
function json (inpObj, cmdArgs) {
    // cmdArgs is an array of arguments
    // json is an object containing the json object we need to modify
  setInputType(inpObj, 'json') // all we do is flag our content as being json
}

// =================jsonPrettify=======================
function jsonPrettify (inpObj, cmdArgs) {
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
      if ((cmdArgs[0] - 0) === (cmdArgs[0] - 0)) { opts.indent = (cmdArgs[0] - 0) }
      if ((cmdArgs[1] - 0) === (cmdArgs[1] - 0)) { opts.maxLength = (cmdArgs[1] - 0) }
      if (cmdArgs[1] === 'infinity') { opts.maxLength = 'infinity' }
      opts.margins = (cmdArgs[2] === 'true') // defaults to false if margins anything other than true
    }
  }
}

// =================ellipsify==========================
function jsonEllipsify (inpObj, cmdArgs) {
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
        var keys = Object.keys(jp.value(json, jsonPath))
        for (var j = 0; j < keys.length; j++) {
          if (excludes.indexOf(keys[j]) === -1) {
            // this key is not in the excludes list so we need to delete it
            delete jp.value(json, jsonPath)[keys[j]]
          }
        }
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
}

// ===================snip Function==============================
function jsonSnippet (inpObj, cmdArgs) {
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
      if ((cmdArgs[1] - 0) === (cmdArgs[1] - 0)) {
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
function jsonDelKeys (inpObj, cmdArgs) {
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

// ===================textFrom=================================
function textFrom (inpObj, cmdArgs, inclusive) {
  // cmdArgs is an array of arguments
  // inpObj is an object containing the text object we need to snip contents from
  // the format of the call is eg.
  // '--textFrom "some text" 2 - would start from the second instance of "some text"
  if (setInputType(inpObj, 'plain')) {
    let x = findLocation(inpObj, cmdArgs, inclusive ? '--start' : '--from')
    if (x.found) {
      if (inclusive === true) {
        inpObj.plain = inpObj.plain.substr(x.loc)
      } else {
        inpObj.plain = inpObj.plain.substr(x.loc + x.len)
      }
    }
  }
}

// ===================textFrom=================================
function textTo (inpObj, cmdArgs, inclusive) {
  // cmdArgs is an array of arguments
  // inpObj is an object containing the text object we need to snip contents from
  // the format of the call is eg.
  // '--textTo "some text" 2 - would go up to the second instance of "some text"
  if (setInputType(inpObj, 'plain')) {
    let x = findLocation(inpObj, cmdArgs, inclusive ? '--finish' : '--to')
    if (x.found) {
      if (inclusive === true) {
        inpObj.plain = inpObj.plain.substring(0, x.loc + x.len)
      } else {
        inpObj.plain = inpObj.plain.substring(0, x.loc)
      }
    }
  }
}

function findLocation (inpObj, cmdArgs, errString) {
  // find the location of the nth occurrence of the text specified in the command arguments
  let occ
  if (cmdArgs.length === 1) {
    occ = 1 // by default we take from the first occurrence of this text
  } else if (cmdArgs.length === 2) {
    if ((cmdArgs[1] - 0) === (cmdArgs[1] - 0)) {
      occ = (cmdArgs[1] - 0)
      if (occ < 1) {
        inpObj.error.push(errString + ' requires its second argument to be a numeric value of at least 1 being the instance required')
        return {found: false}
      }
    } else {
      inpObj.error.push(errString + " requires its second argument to be numeric eg. '" + errString + " sometext 2' with the optional second argument being the instance required")
      return {found: false}
    }
  } else {
    inpObj.error.push(errString + " requires 1 or 2 arguments eg. '" + errString + " sometext' with the optional second argument being the instance required.")
    return {found: false}
  }
  let x = -1
  let arg = removeQuotes(cmdArgs[0])
  for (let i = 0; i < occ; i++) {
    x = inpObj.plain.indexOf(arg, x + 1)
  }
  if (x === -1) {
    inpObj.error.push('unable to find occurrence ' + occ + ' of "' + arg + '"')
  }
  return {found: (x !== -1), loc: x, len: arg.length}
}
