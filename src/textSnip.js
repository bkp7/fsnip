const { setInputType, removeQuotes } = require('./commonFuncs.js')

// ===================textFrom=================================
export function textFrom (inpObj, cmdArgs, inclusive) {
  // cmdArgs is an array of arguments
  // inpObj is an object containing the text object we need to snip contents from
  // the format of the call is eg.
  // '--textFrom "some text" 2 - would start from the second instance of "some text"
  if (setInputType(inpObj, 'plain')) {
    let x = findLocation(inpObj, cmdArgs, inclusive ? '--start' : '--from')
    if (x.found) {
      inpObj.plain = inpObj.plain.substr(x.loc + (inclusive === true ? 0 : x.len))
    }
  }
}

// ===================textTo===================================
export function textTo (inpObj, cmdArgs, inclusive) {
  // cmdArgs is an array of arguments
  // inpObj is an object containing the text object we need to snip contents from
  // the format of the call is eg.
  // '--textTo "some text" 2 - would go up to the second instance of "some text"
  if (setInputType(inpObj, 'plain')) {
    let x = findLocation(inpObj, cmdArgs, inclusive ? '--finish' : '--to')
    if (x.found) {
      inpObj.plain = inpObj.plain.substring(0, x.loc + (inclusive === true ? x.len : 0))
    }
  }
}

function findLocation (inpObj, cmdArgs, errString) {
  // find the location of the nth occurrence of the text specified in the command arguments
  let occ
  switch (cmdArgs.length) {
    case 1:
      occ = 1 // by default we take from the first occurrence of this text
      break
    case 2:
      if (typeof (cmdArgs[1] - 0) === 'number' && !isNaN(cmdArgs[1] - 0)) {
        occ = (cmdArgs[1] - 0)
        if (occ < 1) {
          inpObj.error.push(errString + ' requires its second argument to be a numeric value of at least 1 being the instance required')
          return { found: false }
        }
      } else {
        inpObj.error.push(errString + " requires its second argument to be numeric eg. '" + errString + " sometext 2' with the optional second argument being the instance required")
        return { found: false }
      }
      break
    default:
      inpObj.error.push(errString + " requires 1 or 2 arguments eg. '" + errString + " sometext' with the optional second argument being the instance required.")
      return { found: false }
  }
  let x = -1
  let arg = removeQuotes(cmdArgs[0])
  for (let i = 0; i < occ; i++) {
    x = inpObj.plain.indexOf(arg, x + 1)
  }
  if (x === -1) {
    inpObj.error.push('unable to find occurrence ' + occ + ' of "' + arg + '"')
  }
  return { found: (x !== -1), loc: x, len: arg.length }
}
