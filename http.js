/// <reference path="typings/node/node.d.ts"/>
var http = require('http'),
	fs = require('fs'),
	url = require('url'),
	zlib = require('zlib'),
	colors = require('colors'),
	os = require('os'),
	path = require('path');
var basePath = path.join(__dirname, '/htdocs');
process.env.PORT = process.env.PORT||80;
log('Starting process, PID: '.green + (process.pid+'').yellow);
log('Starting HTTP server on port '.green + (process.env.PORT||80+'').yellow);
var n=os.networkInterfaces();for(var i in n){for(var x in n[i]){if(n[i][x].family=="IPv4"){console.log("Network adapter:".green,i.yellow,"IP-Address:".green,n[i][x].address.grey)}}}
var httpServer = http.createServer(function(req, res){
	var exchange = {};
	exchange.req = req;
	exchange.res = res;
	exchange.pathname = url.parse(req.url).pathname;
	exchange.location = path.join(basePath, exchange.pathname);
	exchange.partial = false;
	if(exchange.pathname = "/data"){
		
	}
	var range = req.headers['range'];
	if(range&&range.match(/bytes=/i)){
		if(range != 'bytes=0-'){ //0 to max
			var pos = range.replace('bytes=', '').split('-');
			exchange.startPos = parseInt(pos[0]);
			exchange.endPos = parseInt(pos[1]);
			exchange.partial = true;
		}
	}
	fs.lstat(exchange.location, function(err, data){
		if(err) {
			if(path.extname(exchange.location) == ''){
				exchange.location = path.normalize(exchange.location+'.html');
				read(exchange);
			} else {
				fnf(exchange, err);
			}
		} else {
			if(data.isDirectory()){
				exchange.location = path.join(exchange.location, '/index.html');
				read(exchange);
			} else {
				read(exchange);
			}
		}
	});
}).listen(80);
function read(exchange) {
	fs.lstat(exchange.location, function(err, info){
		if(err){
			fnf(exchange, err);
		} else {
			if(exchange.partial){
				exchange.startPos = exchange.startPos||0;
				exchange.endPos = exchange.endPos||info.size-1;
				var opt = {'start':exchange.startPos, 'end':exchange.endPos};
			}
			var reader = fs.createReadStream(exchange.location, opt||{});
				reader.on('error', function(err){
				fnf(exchange, err);
			});
			reader.on('open', function(){
				var ext = exchange.location.split('.').slice(-1)[0];
				exchange.res.setHeader('Content-Type', getHeader(ext));
				exchange.res.setHeader('Accept-Ranges', 'bytes');
				if(exchange.partial){
					var size = (exchange.endPos - exchange.startPos)+1;
					exchange.res.setHeader('Content-Range', 'bytes '+exchange.startPos+'-'+exchange.endPos+'/'+info.size);
					exchange.code = 206;
				} else {
					var size = info.size;
					exchange.code = 200;
				}
				exchange.res.setHeader('Content-Length', size);
				var acceptEncoding = exchange.req.headers['Accept-Encoding'];
				if (!acceptEncoding){
					exchange.res.writeHead(exchange.code, {});
					reader.pipe(exchange.res);
				} else if (acceptEncoding.match(/\bgzip\b/)) {
					exchange.res.writeHead(exchange.code, { 'Content-Encoding': 'gzip' });
					reader.pipe(zlib.createGzip()).pipe(exchange.res);
				} else if (acceptEncoding.match(/\bdeflate\b/)) {
					exchange.res.writeHead(exchange.code, { 'Content-Encoding': 'deflate' });
					reader.pipe(zlib.createDeflate()).pipe(exchange.res);
				} else {
					exchange.res.writeHead(exchange.code, {});
					reader.pipe(exchange.res);
				}
			});
		}
	});
}
function getHeader(ext){
	switch(ext) {
		case 'js': header = 'text/javascript'; break;
		case 'html': header = 'text/html'; break;
		case 'css': header = 'text/css'; break;
		case 'mp3': header = 'audio/mpeg'; break;
		case 'ico': header = 'image/x-icon'; break;
		case 'png': header = 'image/png'; break;
		case 'osdx': header = 'application/opensearchdescription+xml'; break;
		case 'svg': header = 'image/svg+xml'; break;
		case 'appcache': case 'mf': header = 'text/cache-manifest'; break;
		case 'woff': header = 'application/font-woff'; break;
		case 'fx': header = 'text/plain'; break;
		default: header = 'text/plain'; break;
	}
	return header;
}
function pad(i) {return i<10?'0'+i:i;}
function log(e){var t=["Jan","Feb","Mar","Apr", "May", "Jun","Jul","Aug","Sep","Oct","Nov","Dec"],n=new Date,r=n.getDate(),i=n.getMonth(),s=n.getHours();min=n.getMinutes();sec=n.getSeconds();console.log((r+" "+t[i]+" "+pad(s)+":"+pad(min)+":"+pad(sec)+" - ").grey+e)}
function fnf(exchange, err){
	log('File: '.red+exchange.location.yellow+' not found, error:'.red, err.yellow);
	exchange.res.setHeader('content-type', 'text/plain');
	exchange.res.writeHead(404);
	exchange.res.write('404 not found\n');
	exchange.res.end();
}