# fsnip

A command line utility to extract and modify json from a file.

[![Build Status](https://travis-ci.org/bkp7/fsnip.svg?branch=master)](https://travis-ci.org/bkp7/fsnip) [![Windows Tests](https://img.shields.io/appveyor/ci/bkp7/fsnip/master.svg?label=Windows%20build)](https://ci.appveyor.com/project/bkp7/fsnip) [![npm](https://img.shields.io/npm/v/npm.svg)](https://www.npmjs.com/package/@bkp7/fsnip) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/bkp7/fsnip/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/bkp7/fsnip/?branch=master) [![Coverage Status](https://coveralls.io/repos/github/bkp7/fsnip/badge.svg?branch=master)](https://coveralls.io/github/bkp7/fsnip?branch=master)

## Introduction

Takes a single json file and processes it according to the options and arguments set returning a modified version of the json suitable for insertion into documents. This utility works well in conjunction with the mdprepare package to allow tested and verified schema compliant json file snippets to be inserted into documentation with the confidence that the documentation represents up to date versions of the json.

## Installation

`npm install fsnip -g`

## Example usage

Located in the root of this package is a file `demo.json` which is used in all the JSON examples below.

`fsnip ./demo.json` returns the file in full, unaltered

[>]: # (mdpInsert ```json fsnip ./demo.json)
```json
{ "version": "1.0.0", "$source": "x.y.z",
"self": "urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d",
  "vessels": {"urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d": {
      "uuid": "urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d",
      "notifications": {
        "mob": {"method": ["visual", "sound"], "timestamp": "2014-04-10T08:33:53Z", "state": "emergency",
        "message": "Man Overboard!", "$source": "x.y.z"
        }, "navigation": { "gnss": { "method": ["visual"], "state": "alert",
        "message": "GPS signal lost!", "$source": "x.y.z", "timestamp": "2014-04-10T08:33:53Z"
          }, "anchor": {"currentRadius": {"method": ["sound"], "state": "alarm",
          "message": "Dragging anchor!", "timestamp": "2014-04-10T08:33:53Z", "$source": "x.y.z"
}}}}}}}
```
[<]: #

`fsnip ./demo.json --prettify` applies prettification to return:

[>]: # (mdpInsert ```json fsnip ./demo.json --prettify)
```json
{
  "version": "1.0.0",
  "$source": "x.y.z",
  "self": "urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d",
  "vessels": {
    "urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d": {
      "uuid": "urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d",
      "notifications": {
        "mob": {
          "method": ["visual", "sound"],
          "timestamp": "2014-04-10T08:33:53Z",
          "state": "emergency",
          "message": "Man Overboard!",
          "$source": "x.y.z"
        },
        "navigation": {
          "gnss": {
            "method": ["visual"],
            "state": "alert",
            "message": "GPS signal lost!",
            "$source": "x.y.z",
            "timestamp": "2014-04-10T08:33:53Z"
          },
          "anchor": {
            "currentRadius": {
              "method": ["sound"],
              "state": "alarm",
              "message": "Dragging anchor!",
              "timestamp": "2014-04-10T08:33:53Z",
              "$source": "x.y.z"
            }
          }
        }
      }
    }
  }
}
```
[<]: #

`fsnip ./demo.json --snip $..currentRadius` returns only the currentRadius object:

[>]: # (mdpInsert ```json fsnip ./demo.json --snip $..currentRadius)
```json
{
  "method": ["sound"],
  "state": "alarm",
  "message": "Dragging anchor!",
  "timestamp": "2014-04-10T08:33:53Z",
  "$source": "x.y.z"
}
```
[<]: #

`fsnip ./demo.json --snip notifications --ellipsify gnss currentRadius ~method ~state ~message` extract the notifications object and then ellipsify (abbreviate) the gnss and currentRadius objects but not abreviating method, state or message:

[>]: # (mdpInsert ```json fsnip ./demo.json --snip notifications --ellipsify gnss currentRadius ~method ~state ~message)
```json
{
  "mob": {
    "method": ["visual", "sound"],
    "timestamp": "2014-04-10T08:33:53Z",
    "state": "emergency",
    "message": "Man Overboard!",
    "$source": "x.y.z"
  },
  "navigation": {
    "gnss": {
      "method": ["visual"],
      "state": "alert",
      "message": "GPS signal lost!",
      ...
    },
    "anchor": {
      "currentRadius": {
        "method": ["sound"],
        "state": "alarm",
        "message": "Dragging anchor!",
        ...
      }
    }
  }
}
```
[<]: #

`fsnip ./demo.json --snip navigation --ellipsify gnss ~method ~state ~message --ellipsify currentRadius ~$source` will extract navigiation, ellipsify gnss (excluding method, state and message) and then will ellipsify currentRadius excluding source:

[>]: # (mdpInsert ```json fsnip ./demo.json --snip navigation --ellipsify gnss ~method ~state ~message --ellipsify currentRadius ~$source)
```json
{
  "gnss": {
    "method": ["visual"],
    "state": "alert",
    "message": "GPS signal lost!",
    ...
  },
  "anchor": {
    "currentRadius": {
      "$source": "x.y.z",
      ...
    }
  }
}
```
[<]: #

`fsnip ./demo.json --ellipsify $ ~vessels --delKeys navigation --ellipsify uuid` will ellipsify the root but excluding vessels, will delete the navigation key and then ellipsify the uuid:

[>]: # (mdpInsert ```json fsnip ./demo.json --ellipsify $ ~vessels --delKeys navigation --ellipsify uuid)
```json
{
  "vessels": {
    "urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d": {
      "uuid": "...",
      "notifications": {
        "mob": {
          "method": ["visual", "sound"],
          "timestamp": "2014-04-10T08:33:53Z",
          "state": "emergency",
          "message": "Man Overboard!",
          "$source": "x.y.z"
        }
      }
    }
  },
  ...
}
```
[<]: #

Text files can also be snipped. If our source file is:

[>]: # (mdpInsert ``` fsnip ./demo.txt)
```
An example text document to take snips from
#loc1_start
this text is within location 1
#loc1_end
Or comment style characters could be used
// startHere
Some example text
// endHere
#loc1_end
This is the end of the example document
```
[<]: #

`fsnip ./demo.txt --from _start --to '"#loc1"'` gives:

[>]: # (mdpInsert ``` fsnip ./demo.txt --from _start --to '"#loc1_end"')
```
this text is within location 1
```
[<]: #
Whereas `fsnip ./demo.txt --start "'// startHere'" --finish "'// endHere'"` returns:

[>]: # (mdpInsert ``` fsnip ./demo.txt --start "'// startHere'" --finish "'// endHere'")
```
// startHere
Some example text
// endHere
```
[<]: #

## Detailed Specifications

**`fsnip`** can be passed any number of Options and associated arguments. They are processed left to right with each result being passed to the next argument. Options designed for JSON cannot be mixed with options designed for plain text files.

### Keys
Keys can be identified using either plain text or JSONPath expressions. eg. `alarm` is equivalent to `$..alarm`. Dot or bracket notation is supported ie. `$.vessels.notifications.mob` is equivalent to `$['vessels'].['notifications'].['mob']`. Keys names which have spaces or start with $, -, or ! need to use the bracket notation. Other XPath notation including filter expressions, and nested expression are also supported, see [jsonpath](https://www.npmjs.com/package/jsonpath) for explanation of all valid pathExpressions.

### JSON Options

#### `--prettify`
The prettify option will adjust the format output to make reading the output easier. It has three optional arguments:
`--prettify [indent] [maxLength] [margins]`
- indent: Defaults to 2. Specifies the number of spaces to indent each line by. This works the same way as the indent option of `JSON.stringify`.
- maxLength: Defaults to 45. Lines will be tried to be kept at maximum this many characters long.
- margins: Defaults to false. Whether or not to add “margins” around brackets and braces:
 - `false: {"a": [1]}`
 - `true: { "a": [ 1 ] }`

The prettify functionality uses the [json-stringify-pretty-compact](https://www.npmjs.com/package/json-stringify-pretty-compact) package.

`--prettify` ie. using default values is equivalent to `--prettify 2 45 false`

Looking at the Javascript stringify function:
`--prettify 3 0` is equivalent to `JSON.stringify(obj, null, 3)`
`--prettify 2 infinity` is equivalent to `JSON.stringify(obj)`

If `--prettify` is not present, but there are any changes made to json using other operators, the default prettify command will automatically be used.

#### `--snip`

The snip option cuts out a section from a JSON file.
`--snip JSONPath

The argument can be plain text or can use [JSONPath notation](https://www.npmjs.com/package/jsonpath). Thus `--snip myObject` is equivalent to `--snip $..myObject`.

#### `--ellipsify`

The ellipsify option will abreviate a json Object, Array or String and indicate this with ellipses `...`. It can be passed any number of arguments, being the Obeject(s), Array(s) and String(s) to be abbreviated along with those items to be left in prepended by `#`.
`--ellipsify JSONPath [JSONPath] ... [~JSONPath] [~JSONPath] ...`

Both types of arguments can be plain text or can use [JSONPath notation](https://www.npmjs.com/package/jsonpath). Thus `--ellipsify myObject` is equivalent to `ellipsify $..myObject`.

#### `--delKeys`

The delKeys option will delete all keys which follow the option.

`--delKeys JSONPath [JSONPath] ...

It can be passed any number of keys for deletion using plain text of [JSONPath notation](https://www.npmjs.com/package/jsonpath).

### Plain Text options

The plain text options can be used on any type of file, but cannot be combined with JSON style options.

#### `--from`, `start`, `--to` and `--finish`

`--from Text`
`--start Text`
`--to Text`
`--finish Text`
These all indicate a place in the file where the snippet should begin and end. In the case of `--from` and `--to` the specified `Text` will be excluded from the snip, whereas if `--start` or `--finish` is used the specified `Text` will be included.

## Cross Platform compatibility issues

**fsnip** was designed to be cross platform compatible.

On the command line `"` and `'` are interpretted differently on posix and windows. For this tool we need the ability to pass arguments which include 'special' characters such as spaces, etc.

In addition, for options such as `--ellipsify` we can pass arguments meaning 'but not' which are indicated by a prepended `~`.

So for example if you wish to exclude (but not) a json key called `"~my example"` you should use:
`fsnip myfile.json $ ellipsify mykey ~'"~my example"'` ie using both single and double quotes, with the single quotes as outer and the tilde indicating exclude prepending the delimited text.
