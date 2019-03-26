const fs = require('fs')
const xml2js = require('xml2js')
const o2x = require('object-to-xml')
const async = require('async')
const os = require('os')

let parser = new xml2js.Parser()

if (!process.argv[2]) {
  console.log('ERROR: no path sent')
  console.log('ex: node index.js')
} else {
  async.parallel({

    itunes: function (callback) {
      fs.readFile(process.argv[2], 'utf8', (err, file) => {
        if (err || !file) {
          return callback(err)
        } else {
          parser.parseString(file, (err, xml) => {
            return callback(err, xml)
          })
        }
      })
    },

    rhythm: function (callback) {
      fs.readFile(os.homedir() + '/.local/share/rhythmbox/rhythmdb.xml', 'utf8', (err, file) => {
        if (err || !file) {
          return callback(err, null)
        } else {
          parser.parseString(file, (err, xml) => {
            return callback(err, xml)
          })
        }
      })
    }

  }, (err, results) => {
    if (err) {
      console.log(err)
      return err
    } else {
      let itunesMusic = results.itunes.plist.dict[0].dict[0].dict
      let rhythmMusic = results.rhythm.rhythmdb.entry
      let newFile = []

      async.eachOf(rhythmMusic, (value, key, callback) => {
        for (let i = 0; i < itunesMusic.length; i++) {
          if (value.title[0].toLowerCase() === itunesMusic[i].string[2].toLowerCase() && value.artist[0] === itunesMusic[i].string[3]) {
            value['first-seen'] = [parseInt(new Date(itunesMusic[i].date[1]).getTime() / 1000)]
            newFile.push(value)
            break
          }
        }
        return callback()
      }, function (err) {
        if (err) {
          console.log(err)
        }
        results.rhythm.rhythmdb.entry = newFile

        results.rhythm = JSON.parse(JSON.stringify(results.rhythm).replace(/"\$"/gmi, '"@"'))

        fs.writeFile(os.homedir() + '/.local/share/rhythmbox/rhythmdb.xml', `<?xml version="1.0" standalone="yes"?>\n${o2x(results.rhythm)}`, (err) => {
          if (err) {
            console.log(err)
          }

          console.log('Finish !')
          console.log('You can start Rhythmbox now.')
        })
      })
    }
  })
}
