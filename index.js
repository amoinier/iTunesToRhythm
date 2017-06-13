var fs			= require('fs');
var xml2js		= require('xml2js');
var o2x	= require('object-to-xml');
var async		= require('async');

var parser = new xml2js.Parser();
async.parallel({
	itunes: function(callback) {
		fs.readFile('../../Musique/Bibliothèque.xml', 'utf8', function(err, file) {
			if (!err && file) {
				parser.parseString(file, function(err, xml) {
					if (!err) {
						return callback(null, xml);
					}
					else {
						return callback(err, null);
					}
				})
			}
			else {
				return callback(err, null);
			}
		})
	},
	rhythm: function(callback) {
		fs.readFile('../../.local/share/rhythmbox/rhythmdb.xml', 'utf8', function(err, file) {
			if (!err && file) {
				parser.parseString(file, function(err, xml) {
					if (!err) {
						return callback(null, xml);
					}
					else {
						return callback(err, null);
					}
				})
			}
			else {
				return callback(err, null);
			}
		})
	},
}, function(err, results) {
	if (err) {
		console.log(err);
		return 0;
	}
	else {
		var itunesMusic = results.itunes.plist.dict[0].dict[0].dict;
		var rhythmMusic = results.rhythm.rhythmdb.entry;
		var newFile = [];
		var count = 0;

		async.eachOf(rhythmMusic, function(value, key, callback) {
			for (var i = 0; i < itunesMusic.length; i++) {
				if (itunesMusic[i].string[0].toLowerCase().indexOf('eh!de') >= 0 && value.title[0].toLowerCase().indexOf('eh!de') >= 0) {
					console.log(value.title[0] == itunesMusic[i].string[0]);
					console.log(value.title[0] + " == " + itunesMusic[i].string[0]);
				}
				if (value.title[0] == itunesMusic[i].string[0] && value.artist[0] == itunesMusic[i].string[1]) {
					value['first-seen'] = [parseInt(new Date(itunesMusic[i].date[1]).getTime() / 1000)];
					newFile.push(value);
					count++;
				}
			}
			return callback();
		}, function(err) {
			results.rhythm.rhythmdb.entry = newFile;
			var newXml = o2x(results.rhythm.rhythmdb);

			console.log(newXml.toString());
		})
	}
});
