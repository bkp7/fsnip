const {textFrom, textTo} = require('./textSnip.js')
const {json, jsonPrettify, jsonEllipsify, jsonSnippet, jsonDelKeys} = require('./jsonSnip.js')

export function runOption (option, args, inpObj) {
  // option is a string eg. '-jsonEllipsify'
  // arguments is an array of arguments for the option
  // inpObj is an object containing the text, type and json object we need to modify
  // this function acts as a marsheller to identify options and process them accordingly
  let funcs = {
    '--json': () => { json(inpObj) },
    '--prettify': () => { jsonPrettify(inpObj, args) },
    '--ellipsify': () => { jsonEllipsify(inpObj, args) },
    '--snip': () => { jsonSnippet(inpObj, args) },
    '--delKeys': () => { jsonDelKeys(inpObj, args) },
    '--from': () => { textFrom(inpObj, args, false) },
    '--start': () => { textFrom(inpObj, args, true) },
    '--to': () => { textTo(inpObj, args, false) },
    '--finish': () => { textTo(inpObj, args, true) }
  }

  if (funcs[option]) {
    funcs[option]()
  } else {
    inpObj.error.push("invalid option '" + option + "' for fsnip")
  }
}
