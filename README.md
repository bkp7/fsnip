# fsnip

A command line utility to extract and modify json from a file.

[![Build Status](https://travis-ci.org/bkp7/fsnip.svg?branch=master)](https://travis-ci.org/bkp7/fsnip) [![Windows Tests](https://img.shields.io/appveyor/ci/bkp7/fsnip/master.svg?label=Windows%20build)](https://ci.appveyor.com/project/bkp7/fsnip) [![npm](https://img.shields.io/npm/v/npm.svg)](https://www.npmjs.com/package/@bkp7/fsnip) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/bkp7/fsnip/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/bkp7/fsnip/?branch=master) [![Coverage Status](https://coveralls.io/repos/github/bkp7/fsnip/badge.svg?branch=master)](https://coveralls.io/github/bkp7/fsnip?branch=master)

## THIS UTILITY IS UNDER CONSTRUCTION AND NOT READY FOR USE YET

## Introduction

Takes a single json file and processes it according to the options and arguments set returning a modified version of the json suitable for insertion into documents. This utility works well in conjunction with the mdprepare package to allow tested and verified schema compliant json file snippets to be inserted into documentation with the confidence that the documentation represents up to date versions of the json.

## Installation

`npm install fsnip -g`

## Example usage

Located in the root of this package is a file `demo.json` which is used in all the examples here.

`fsnip ./demo.json` returns the file in full, unaltered
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

`fsnip ./demo.json --prettify` applies prettification to return:
```json
bla bla
```

`fsnip ./demo.json --snip $..currentRadius` returns only the currentRadius object:
```json
bla bla
```

`fsnip ./demo.json --snip notifications --ellipsify gnss currentRadius !method !state !message` extract the notifications object and then ellipsify (abbreviate) the gnss and currentRadius objects but not abreviating method, state or message:
```json
bla bla
```

`fsnip ./demo.json --snip navigation --ellipsify gnss !method !state !message --ellipsify currentRadius !$source` will extract navigiation, ellipsify gnss (excluding method, state and message) and then will ellipsify currentRadius excluding source:
```json
bla bla
```

`fsnip ./demo.json --ellipsify $ !vessels --delKeys navigation --ellipsify uuid` will ellipsify the root but excluding vessels, will delete the navigation key and then ellipsify the uuid:
```json
bla bla
```

Keys can be identified using either plain text or XPath expressions. eg. `alarm` is equivalent to `$..alarm`. Dot or bracket notation is supported ie. `$.vessels.notifications.mob` is equivalent to `$['vessels'].['notifications'].['mob']`. Keys names which have spaces or start with $, -, or ! need to use the bracket notation. Other XPath notation including filter expressions, and nested expression are also supported, see [jsonpath](https://www.npmjs.com/package/jsonpath) for explanation of all valid pathExpressions.
