/* global describe, it */

 const assert = require('assert')
 const {exec} = require('child_process')
 const fs = require('fs')
 const path = require('path')
// const minimizeJsonProperty = require('../dist/fsnip.js').minimizeJsonProperty
// const setInputType = require('../dist/fsnip.js').setInputType
 const {minimizeJsonProperty, setInputType} = require('../dist/fsnip.js')

 const tests = [
   {name: 'Simple 1', cmd: 'fsnip ./demo.json', resultFile: 'simple1.txt'},
   {name: 'Simple 2', cmd: 'fsnip ./demo.json --json', resultFile: 'simple2.txt'},
   {name: 'Simple 3', cmd: 'fsnip ./demo.json  \t    --json', resultFile: 'simple3.txt'},
   {name: 'Prettify 1', cmd: 'fsnip ./demo.json --prettify', resultFile: 'prettify1.txt'},
   {name: 'Prettify 2', cmd: 'fsnip ./demo.json --prettify 2 infinity', resultFile: 'prettify2.txt'},
   {name: 'Prettify 3', cmd: 'fsnip ./demo.json --prettify 3 0', resultFile: 'prettify3.txt'},
   {name: 'Prettify 4', cmd: 'fsnip ./demo.json --prettify 3 45 true', resultFile: 'prettify4.txt'},
   {name: 'Prettify 5', cmd: 'fsnip ./demo.json --prettify 3 45 300', resultFile: 'prettify5.txt'},
   {name: 'Ellipsify 1', cmd: 'fsnip ./demo.json --ellipsify method', resultFile: 'ellipsify1.txt'},
   {name: 'Ellipsify 2', cmd: 'fsnip ./demo.json --ellipsify', resultFile: 'ellipsify2.txt'},
   {name: 'Snip', cmd: 'fsnip ./demo.json --snip $..currentRadius', resultFile: 'snip.txt'},
   {name: 'Complex 1', cmd: 'fsnip ./demo.json --snip notifications --ellipsify gnss currentRadius ~method ~state ~message', resultFile: 'complex1.txt'},
   {name: 'Complex 2', cmd: 'fsnip ./demo.json --snip navigation --ellipsify gnss ~method ~state ~message --ellipsify currentRadius ~$source', resultFile: 'complex2.txt'},
   {name: 'delKeys', cmd: 'fsnip ./demo.json --ellipsify $ ~vessels --delKeys navigation --ellipsify uuid', resultFile: 'delKeys.txt'},
   {name: 'delKeys 2', cmd: 'fsnip ./demo.json --delKeys $..method[0]', resultFile: 'delKeys2.txt'},
   {name: 'Snip error 1', cmd: 'fsnip ./demo.json --snip', resultFile: 'snipError1.txt'},
   {name: 'Snip error 2', cmd: 'fsnip ./demo.json --snip navigation 2', resultFile: 'snipError2.txt'},
   {name: 'Snip error 3', cmd: 'fsnip ./demo.json --snip navigation -2', resultFile: 'snipError3.txt'},
   {name: 'Snip error 4', cmd: 'fsnip ./demo.json --snip navigation Fred', resultFile: 'snipError4.txt'},
   {name: 'Invalid 1', cmd: 'fsnip ./demo.json --notacmd', resultFile: 'invalid1.txt'},
   {name: 'Invalid 2', cmd: 'fsnip ./demo.json --snip navigation --from method', resultFile: 'invalid2.txt'},
   {name: 'Invalid 3', cmd: 'fsnip ./demo.json navigation', resultFile: 'invalid3.txt'},
   {name: 'Invalid 4', cmd: 'fsnip ./demo.json --from vessels --json', resultFile: 'invalid4.txt'},
   {name: 'Invalid 5', cmd: 'fsnip ./demo.json --from vessels --prettify', resultFile: 'invalid5.txt'},
   {name: 'Invalid 6', cmd: 'fsnip ./demo.json --from vessels --ellipsify method', resultFile: 'invalid6.txt'},
   {name: 'Invalid 7', cmd: 'fsnip ./demo.json --from vessels --snip notifications', resultFile: 'invalid7.txt'},
   {name: 'Invalid 8', cmd: 'fsnip ./demo.json --from vessels --delKeys $..method[0]', resultFile: 'invalid8.txt'},
   {name: 'Invalid 9', cmd: 'fsnip ./demo.json --delKeys $..method[0] --from vessels', resultFile: 'invalid9.txt'},
   {name: 'Invalid 10', cmd: 'fsnip ./demo.json --delKeys $..method[0] --to vessels', resultFile: 'invalid10.txt'},
   {name: 'Text 1', cmd: 'fsnip ./demo.txt --from "#loc1_start"', resultFile: 'text1.txt'},
   {name: 'Text 2', cmd: 'fsnip ./demo.txt --start "#loc1_start"', resultFile: 'text2.txt'},
   {name: 'Text 3', cmd: 'fsnip ./demo.txt --to "#loc1_end"', resultFile: 'text3.txt'},
   {name: 'Text 4', cmd: 'fsnip ./demo.txt --finish "#loc1_end"', resultFile: 'text4.txt'},
   {name: 'Text 5', cmd: 'fsnip ./demo.txt --finish "#loc1_end" 2', resultFile: 'text5.txt'},
   {name: 'Text 6', cmd: 'fsnip ./demo.txt --finish "#loc1_end" -2', resultFile: 'text6.txt'},
   {name: 'Text 7', cmd: 'fsnip ./demo.txt --finish "#loc1_end" 3', resultFile: 'text7.txt'},
   {name: 'Text 8', cmd: 'fsnip ./demo.txt --finish "#loc1_end" 2 3', resultFile: 'text8.txt'},
   {name: 'Text 9', cmd: 'fsnip ./demo.txt --finish "#loc1_end" fred', resultFile: 'text9.txt'},
   {name: 'Text 10', cmd: 'fsnip ./demo.txt --finish "#loc1_end" fred bert', resultFile: 'text10.txt'},
   {name: 'Text 11', cmd: 'fsnip ./demo.txt --start "#loc1_end" -2', resultFile: 'text11.txt'},
   {name: 'Text 12', cmd: 'fsnip ./demo.txt --start "#loc1_end" 3', resultFile: 'text12.txt'},
   {name: 'Text 13', cmd: 'fsnip ./demo.txt --start "#loc1_end" 2 3', resultFile: 'text13.txt'},
   {name: 'Text 14', cmd: 'fsnip ./demo.txt --start "#loc1_end" fred', resultFile: 'text14.txt'},
   {name: 'Text 15', cmd: 'fsnip ./demo.txt --start "#loc1_end" fred bert', resultFile: 'text15.txt'},
   {name: 'Text 16', cmd: 'fsnip ./demo.txt --start "this text"', resultFile: 'text16.txt'},
   {name: 'Help', cmd: 'fsnip --help', resultFile: 'help.txt'},
   {name: 'Tricky 1', cmd: 'fsnip ./test/tricky.json --ellipsify address ~housename', resultFile: 'tricky1.txt'},
   {name: 'Tricky 2', cmd: 'fsnip ./test/tricky.json --ellipsify address ~"street name"', resultFile: 'tricky2.txt'},
   {name: 'Tricky 3', cmd: 'fsnip ./test/tricky.json --ellipsify address ~"~post code"', resultFile: 'tricky3.txt'}
 ]

 const errorTests = [
   {name: 'Error 1', cmd: 'fsnip ./fred.fred --snip navigation', stderr: 'unable to read file \'./fred.fred\'\n'},
   {name: 'Error 2', cmd: 'fsnip ./fred.fred --snip', stderr: 'unable to read file \'./fred.fred\'\n'},
   {name: 'Error 3', cmd: 'fsnip ./fred.fred', stderr: 'unable to read file \'./fred.fred\'\n'},
   {name: 'Error 4', cmd: 'fsnip', stderr: 'Unrecognised arguments passed to fsnip. See fsnip --help\n'}
 ]

 describe('unit tests', function () {
   it('setInputType 1', function () {
     assert.equal(setInputType({}, 'invalidType'), false)
   })
   it('setInputType 2', function () {
     assert.equal(setInputType({}, ''), false)
   })
   it('setInputType 3', function () {
     assert.equal(setInputType({type: ''}, ''), false)
   })
   it('setInputType 4', function () {
     assert.equal(setInputType({type: 'something'}, 'somethingElse'), false)
   })
   it('minimizeJsonProperty', function () {
     let testJson = {'first': true}
     minimizeJsonProperty(testJson, 'first')
     assert.deepEqual(testJson, {'first': true})
   })
 })

 describe('fsnip tests', function () {
   for (let i = 0; i < tests.length; i++) {
     it(tests[i].name, function (done) {
       this.timeout(8000)
       exec(tests[i].cmd, function (error, stdout, stderr) {
         assert.ifError(error)
         assert.equal(stdout.toString(), fs.readFileSync(path.resolve('./test/', tests[i].resultFile)).toString())
         done()
       })
     })
   }
   for (let i = 0; i < errorTests.length; i++) {
     it(errorTests[i].name, function (done) {
       this.timeout(8000)
       exec(errorTests[i].cmd, function (error, stdout, stderr) {
         assert.ifError(error)
         assert.equal(stderr.toString(), errorTests[i].stderr)
         done()
       })
     })
   }
 })
