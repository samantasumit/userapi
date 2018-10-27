var express = require('express');
var app = express();
var io = require('socket.io').listen(app.listen(process.env.PORT || 8081));
var fs = require("fs");
var cors = require('cors');
var ss = require('socket.io-stream');
var path = require('path');

app.use(require('cors')());

io.of('/chat').on('connection', function (socket) {
    socket.emit('connection', 'Connected successfully');
    ss(socket).on('upload', (stream, data) => {
		const filename = path.basename(data.name);
		const ws = fs.createWriteStream(__dirname + '/tmp/' + `${filename}`);
		stream.on('error', (e) => {
			console.log('Error found:');
			console.log(e);
		});
		stream.on('drain', (e) => {
			console.log('drain');
		});
		stream.on('data', () => {
			console.log('data');
		});
		stream.on('close', () => {
			console.log('close');
		});
		stream.pipe(ws);
	});
});