/* global describe, it */

 const assert = require('assert')
 const {exec} = require('child_process')
 const fs = require('fs')
 const path = require('path')

 const tests = [
   {name: 'Simple 1', cmd: 'fsnip ./demo.json', resultFile: 'simple1.txt'},
   {name: 'Prettify', cmd: 'fsnip ./demo.json --prettify', resultFile: 'prettify.txt'},
   {name: 'Prettify 2', cmd: 'fsnip ./demo.json --prettify 2 infinity', resultFile: 'prettify2.txt'},
   {name: 'Prettify 3', cmd: 'fsnip ./demo.json --prettify 3 0', resultFile: 'prettify3.txt'},
   {name: 'Prettify 4', cmd: 'fsnip ./demo.json --prettify 3 45 true', resultFile: 'prettify4.txt'},
   {name: 'Prettify 5', cmd: 'fsnip ./demo.json --prettify 3 45 300', resultFile: 'prettify5.txt'},
   {name: 'Ellipsify 1', cmd: 'fsnip ./demo.json --ellipsify method', resultFile: 'ellipsify1.txt'},
   {name: 'Snip', cmd: 'fsnip ./demo.json --snip $..currentRadius', resultFile: 'snip.txt'},
   {name: 'Complex 1', cmd: 'fsnip ./demo.json --snip notifications --ellipsify gnss currentRadius !method !state !message', resultFile: 'complex1.txt'},
   {name: 'Complex 2', cmd: 'fsnip ./demo.json --snip navigation --ellipsify gnss !method !state !message --ellipsify currentRadius !$source', resultFile: 'complex2.txt'},
   {name: 'delKeys', cmd: 'fsnip ./demo.json --ellipsify $ !vessels --delKeys navigation --ellipsify uuid', resultFile: 'delKeys.txt'},
   {name: 'delKeys 2', cmd: 'fsnip ./demo.json --delKeys $..method[0]', resultFile: 'delKeys2.txt'},
   {name: 'Snip error 1', cmd: 'fsnip ./demo.json --snip', resultFile: 'snipError1.txt'},
   {name: 'Snip error 2', cmd: 'fsnip ./demo.json --snip navigation 2', resultFile: 'snipError2.txt'},
   {name: 'Snip error 3', cmd: 'fsnip ./demo.json --snip navigation -2', resultFile: 'snipError3.txt'},
   {name: 'Snip error 4', cmd: 'fsnip ./demo.json --snip navigation Fred', resultFile: 'snipError4.txt'},
   {name: 'Invalid 1', cmd: 'fsnip ./demo.json --notacmd', resultFile: 'invalid1.txt'},
   {name: 'Invalid 2', cmd: 'fsnip ./demo.json --snip navigation --from method', resultFile: 'invalid2.txt'},
   {name: 'Text 1', cmd: 'fsnip ./demo.txt --from #loc1_start', resultFile: 'text1.txt'},
   {name: 'Text 2', cmd: 'fsnip ./demo.txt --start #loc1_start', resultFile: 'text2.txt'},
   {name: 'Text 3', cmd: 'fsnip ./demo.txt --to #loc1_end', resultFile: 'text3.txt'},
   {name: 'Text 4', cmd: 'fsnip ./demo.txt --finish #loc1_end', resultFile: 'text4.txt'},
   {name: 'Text 5', cmd: 'fsnip ./demo.txt --finish #loc1_end 2', resultFile: 'text5.txt'},
   {name: 'Text 6', cmd: 'fsnip ./demo.txt --finish #loc1_end -2', resultFile: 'text6.txt'},
   {name: 'Text 7', cmd: 'fsnip ./demo.txt --finish #loc1_end 3', resultFile: 'text7.txt'}
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
