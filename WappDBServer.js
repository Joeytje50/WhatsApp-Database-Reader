var http = require("http"), //better to use https tho, but need
	fs = require("fs"),
	url = require('url'),
	zlib = require('zlib'),
	path = require('path');
	
//global vars
var port = 80;
path.separatorRegEx = /[\/|\\)+/;
console.log(path.sep);
var Server = http.createServer(function (req, res) {
	var urlData = url.parse(req.url, true),//true will make sure UrlData.query contains an object already instead of only the query string
		pathList = urlData.pathname.split(path.separatorRegEx);
	console.log(pathList);
	switch (urlData.pathname) {
		case "/page...": //if the user browses to url/page then handle it here

			break;
		case "/api":
		
			break;
	}
}).listen(port);