#!/usr/bin/env node
/*
=====fsnip======

fsnip is a command line utility to extract and modify json from a file.

*/
const fs = require('fs-extra')
const jp = require('jsonpath')
const stringify = require('json-stringify-pretty-compact')
const chalk = require('chalk')

// inline test of correct split functionality - the following should split in 13 items
let test = split("one two[ ' bla[' ] thr]ee f[' o u ']r five' $.six.Data.Devices[0].Type $['Se]v en']['D a t a']['Devices'][0] $..Eight[(@.length - 1)]['Type']  $..Nine[?(@.Found == 1)] $..Ten[{$.EventData..Selected}] $..Eleven[{$..ElevenStill[{$..eleven[?(@.Found == 1)]}]}]    t[' wel ve ']]r OK")
if (test.length !== 13 || test[12] !== 'OK') {
  throw new Error('fsnip: function split(): self test failed.')
}

let args = process.argv

if (args.length === 3 && args[2] === '--help') {
  console.info('fsnip is a tool for extracting json snippets from json files.\n\n' +
               'Usage:\n' + '' +
               'TODO still \n' +
               '  node mdInsert file                  process the file and output the result to the console\n' +
               '  node mdInsert source destination    process all files in source placing resulting files into destination\n' +
               '  node mdInsert mdCommandString       process mdCommandString amd output the result to the console\n\n' +
               '  file         Specifies the file to process.\n' +
               '  source       Specifies an existing folder containing files to process (subfolders will be included)\n' +
               '  destination  Specifies a folder where processed files will be placed\n' +
               '                 WARNING: any files already in destination will be deleted\n' +
               '  mdCommand    specifies a command string in [] followed by file details in ()\n' +
               '                 eg. [mdInsert -josnSnippet $..source][(./demo.json)')
} else if (args.length >= 3) {
  try {
    var txt = fs.readFileSync(args[2]).toString()
  } catch (err) {
    console.error(chalk.red("unable to read file '" + args[2] + "'"))
  }
  let arg = stringifyArray(args, 3, args.length, ' ')
  console.log(mdInsert(arg, txt))
} else { // we couldn't recognise the format on the command line
  console.error(chalk.red('Unrecognised arguments passed to fsnip. See node fsnip --help'))
}

function mdInsert (cmdOptsString, inputText) {
  // run the mdInsert Command processing any options and arguments againt input text and return the resultant modified text
  // cmdOptsString eg. '-jsonEllipsify navigation vessels -somethingelse "arg 1"'
  // inputText is the text we want to modify
  let cmdOpts = split(cmdOptsString)
  if (cmdOpts === null || cmdOpts.length === 0) { return inputText } // no processing required as no options passed in
  var src = { // a temporary structure containing the text we are working on its type eg. 'json' (which is set later)
    text: inputText,
    type: '',
    json: null
  }

  // now we are going to parse through the options and arguments to extract individual options together with their arguments
  var cmdOpt = '' // current option from the cmdOptsString list
  var cmdArgs = [] // array containing any arguments for the cmdOpt
  for (var i = 0; i < cmdOpts.length; i++) {
    if (!cmdOpts[i].match(/^\s+$/) && !(cmdOpts[i] === '')) { // only process the option if it is not zero length or whitespace
      if (cmdOpts[i].substr(0, 1) === '-') { // this is a new option eg. -jsonEllipsify
        if (cmdOpt !== '') runOption(cmdOpt, cmdArgs, src) // process/run any previous Option we found
        cmdOpt = cmdOpts[i] // store the new option we have found
        cmdArgs = [] // reset ready for any new arguments
      } else {
        // this must be an argument for the current option
        if (cmdOpt === '') { // error if we don't currently have an option
          throw new Error('invalid argument ' + i + " '" + cmdOpts[i] + "' in '" + cmdOptsString + "' passed without valid option to mdInsert")
        }
        cmdArgs.push(cmdOpts[i])
      }
    }
  }
  if (cmdOpt !== '') runOption(cmdOpt, cmdArgs, src) // process/run the very last Option we found

  postProcess(src)
  return src.text
}

function split (inputText) {
  // splits the supplied text on any whitespace that is not within [ ] delimiters. Also if within [] delimiters and within '' delimiters a ] will be ignored.
  // done this way rather than using regex which is not very good at dealing with delimiters
  const whiteSpace = 1
  const delimitedSq = 2
  const delimitedQt = 3
  const element = 4
  var thisChar = '' // holds the character we are working on
  var zone = whiteSpace // flag indicating what we are currently in, ie whiteSpace, delimited, or an element
  var start = 0 // the start of an element ( only valid if we are not in whitespace)
  var result = [] // holds the resultant array we will return
  for (var i = 0; i < inputText.length; i++) {
    thisChar = inputText.substr(i, 1)
    if (zone === delimitedQt) {
      if (thisChar === "'") {
        zone = delimitedSq
      } // else do nothing, just move on to next char
    } else if (zone === delimitedSq) {
      if (thisChar === "'") {
        zone = delimitedQt
      } else if (thisChar === ']') { // now reached the end of the delimited text
        zone = element
      } // else, do nothing, just move on to the next character
    } else {
      if (isWhiteSpace(thisChar)) {
        if (zone !== whiteSpace) { // we have reached the end of an element so add it to our output
          result.push(inputText.substr(start, i - start))
          zone = whiteSpace
        }
      } else { // we are not delimited and this character is not whitespace
        if (thisChar === '[') { // we are entering delimited
          zone = delimitedSq
        } else {
          if (zone === whiteSpace) { // we are at the start of a new element
            start = i
            zone = element
          } // else we are in an element and this character is not whitespace, so just move onto the next character
        }
      }
    }
  }
  if (zone !== whiteSpace) {
    result.push(inputText.substr(start, i - start))
  }
  return result

  function isWhiteSpace (char) {
    return (char === ' ' || char === '\n' || char === '\r' || char === '\t' || char === '\v' || char === '\f')
  }
}

function runOption (option, args, inpObj) {
  // option is a string eg. '-jsonEllipsify'
  // arguments is an array of arguments for the option
  // inpObj is an object containing the text, type and json object we need to modify
  // this function acts as a marsheller to identify options and process them accordingly
  if (option === '--json') {
    json(inpObj, args)
  } else if (option === '--prettify') {
    json(inpObj, args)
  } else if (option === '--ellipsify') {
    jsonEllipsify(inpObj, args)
  } else if (option === '--snip') {
    jsonSnippet(inpObj, args)
  } else if (option === '--delKeys') {
    jsonDelKeys(inpObj, args)
  } else {
    console.error(chalk.red("invalid option '" + option + "' for fsnip"))
  }
}

function postProcess (inpObj) {
  // does any post process tidying up
  if (inpObj.type === 'json') {
    // inpObj.text = JSON.stringify(inpObj.json, null, 2);  // prettify the json with 2 space indent
    inpObj.text = stringify(inpObj.json, {maxLength: 45})  // prettify the json with 2 space indent
    // now replace any placeholders. The placeholders are valid JSON but what we replace them with may not be valid JSON
    inpObj.text = inpObj.text.replace(/\[\s*"skPlaceholderArrEllipses"\s*\]/g, '[...]')
    inpObj.text = inpObj.text.replace(/\{\s*"skPlaceholderObj"\s*:\s*"Ellipses"\s*\}/g, '{...}') // do this separately to the one below so that if the object is empty it appears all on one line
    inpObj.text = inpObj.text.replace(/"skPlaceholderObj"\s*:\s*"Ellipses"/g, '...')
    inpObj.text = inpObj.text.replace(/"skPlaceholderStrEllipses"/g, '"..."')
  }
}

function setInputType (inpObj, newType) {
  if (inpObj.type === '') { // type has not previously been set
    inpObj.type = newType
    if (newType === 'json') {
      inpObj.json = JSON.parse(inpObj.text)
    }
  } else if (inpObj.type !== newType) { // it's alreay been set to something else so there's a problem
    throw new Error('cannot mix options designed to process different types')
  }
}

function buildJsonSearchPath (keyName) {
  if (keyName.substr(0, 1) === '$') {
    return keyName
  } else {
    return "$..['" + keyName + "']"
  }
}

// =================json===============================
function json (inpObj, cmdArgs) {
    // cmdArgs is an array of arguments
    // json is an object containing the json object we need to modify
  setInputType(inpObj, 'json') // all we do is flag our content as being json
}

// =================ellipsify==========================
function jsonEllipsify (inpObj, cmdArgs) {
  // cmdArgs is an array of arguments
  // json is an object containing the json object we need to modify

  setInputType(inpObj, 'json')

// we have to types of argument for Ellipsify, plain and exclude so separate them out
  var cmdArgsPlain = []
  var cmdArgsExclude = []
  for (let i = 0; i < cmdArgs.length; i++) {
    if (cmdArgs[i].substr(0, 1) === '!') {
      cmdArgsExclude.push(cmdArgs[i].substr(1))
    } else {
      cmdArgsPlain.push(cmdArgs[i])
    }
  }
  for (let i = 0; i < cmdArgsPlain.length; i++) {
    minimizeJsonProperty(inpObj.json, cmdArgsPlain[i], cmdArgsExclude)
  }
}

function minimizeJsonProperty (json, property, excludes) {
  // this function takes a json object as input.and for every occurence of the given property puts a placeholder
  // but only if it is an array or an object.
  var arrPlaceholder = ['skPlaceholderArrEllipses'] // a valid json array used as a placeholder to be replaced later with [...] (which is not valid json)
  var objPlaceholder = {'skPlaceholderObj': 'Ellipses'} // a valid json object used as a placeholder to be replaced later with {...} (which is not valid json)
  var strPlaceholder = 'skPlaceholderStrEllipses'
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
        // TODO remove??
        // jp.value(json, jsonPath)['skPlaceholderObj'] = 'Ellipses' // add a placeholder for the Ellipses
        jp.value(json, jsonPath, objPlaceholder)
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
  setInputType(inpObj, 'json')
  var occ = 1
  if (cmdArgs.length === 1) {
    occ = 1 // by default we snip the first occurrence of this property
  } else if (cmdArgs.length === 2) {
    if (typeof cmdArgs[1] === 'number') {
      occ = cmdArgs[1]
    } else {
      throw new Error("--snip requires its second argument to be numeric eg. '--snip vessel 2' with the optional second argument being the instance required")
    }
  } else {
    throw new Error("--snip requires 1 or 2 arguments eg. '--snip vessel 2'with the optional second argument being the instance required.")
  }
  var jsonPaths = jp.paths(inpObj.json, buildJsonSearchPath(cmdArgs[0])) // creates an array of all the paths to this property
  inpObj.json = jp.value(inpObj.json, jp.stringify(jsonPaths[occ - 1]))
}

// ===================delKeys Function===========================
function jsonDelKeys (inpObj, cmdArgs) {
  // cmdArgs is an array of arguments
  // inpObj is an object containing the json object we need to remove keys from
  // the format of the call is eg.
  // '-jsonDelKeys vessel gnss' which would delete all instances of "vessel" and "gnss" in the json supplied
  setInputType(inpObj, 'json')
  for (var i = 0; i < cmdArgs.length; i++) {
    deleteJsonKey(inpObj.json, cmdArgs[i])
  }
}

function deleteJsonKey (json, key) {
  // deltes all occurences of key within json
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

function stringifyArray (arr, idxFrom, idxTo, separator) {
  // this function takes an array of strings and creates a single string consisting of the required items in the array separated by the sweparator
  var blnFirst = true
  var result = ''
  for (var i = idxFrom; i <= idxTo; i++) {
    if (i < arr.length) {
      if (blnFirst) {
        blnFirst = false
      } else {
        result += separator
      }
      result += arr[i]
    }
  }
  return result
}
