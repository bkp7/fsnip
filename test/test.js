/* global describe, it */

 const assert = require('assert')
 const {exec} = require('child_process')
 const fs = require('fs')
 const path = require('path')

 const tests = [
   {name: 'Simple 1', cmd: 'fsnip ./demo.json', resultFile: 'simple1.txt'},
   {name: 'Prettify', cmd: 'fsnip ./demo.json --prettify', resultFile: 'prettify.txt'},
   {name: 'Snip', cmd: 'fsnip ./demo.json --snip $..currentRadius', resultFile: 'snip.txt'},
   {name: 'Complex 1', cmd: 'fsnip ./demo.json --snip notifications --ellipsify gnss currentRadius !method !state !message', resultFile: 'complex1.txt'},
   {name: 'Complex 2', cmd: 'fsnip ./demo.json --snip navigation --ellipsify gnss !method !state !message --ellipsify currentRadius !$source', resultFile: 'complex2.txt'},
   {name: 'delKeys', cmd: 'fsnip ./demo.json --ellipsify $ !vessels --delKeys navigation --ellipsify uuid', resultFile: 'delKeys.txt'}
 ]

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
 })
