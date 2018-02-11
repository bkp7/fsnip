/*
=====fsnip======

fsnip is a command line utility to extract and modify json from a file.

*/
const fs = require('fs')
const stringify = require('json-stringify-pretty-compact')
const chalk = require('chalk')
const {runOption} = require('./runOptions.js')

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
      console.info(fsnipDo(args.slice(3), txt))
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

  parseOptions()
  postProcess(src)
  return src.error.length === 0 ? src.text : chalk.redBright(src.error)

  function parseOptions () {
    // now we are going to parse through the options and arguments to extract individual options together with their arguments
    var cmdOpt = '' // current option from the cmdOptsString list
    var cmdArgs = [] // array containing any arguments for the cmdOpt
    for (var i = 0; i < cmdOpts.length; i++) {
      if (cmdOpts[i].substr(0, 2) === '--') { // this is a new option eg. --ellipsify
        processOption()
        cmdOpt = cmdOpts[i] // store the new option we have found
        cmdArgs = [] // reset ready for any new arguments
      } else {
        // this must be an argument for the current option
        if (cmdOpt === '') { // error if we don't currently have an option
          src.error.push("invalid argument '" + cmdOpts[i] + "' passed without valid option to fsnip")
        } else {
          cmdArgs.push(cmdOpts[i])
        }
      }
    }
    processOption()

    function processOption () {
      // process/run any option we've found
      if (cmdOpt !== '') {
        runOption(cmdOpt, cmdArgs, src)
      }
    }
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
