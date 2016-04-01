var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');

io.use(function(socket, next) {
  console.log(socket.handshake.query.sessiontoken);

  var options = {
    url: 'http://api:4567/user',
    headers: {
      Authorization: 'Bearer ' + socket.handshake.query.sessiontoken
    }
  };

  request(options, function(err, response, body) {
    console.log('body', body);
    var json = body ? JSON.parse(body) : {};

    if (response.statusCode === 200 && json.username) {
      socket.username = json.username;
      next();
    } else {
      next({error: 'unauthorized', msg: json});
    }
  });
});

io.on('connection', function(socket) {
  console.log(socket.username, ' connected');
  socket.join(socket.room);

  socket.on('disconnect', function() {
    console.log(socket.username, ' disconnected');
  });

  socket.on('chat message', function(msg) {
    msg.author = socket.username;
    io.in(socket.room).emit('chat message', msg);
  });

  socket.on('change room', function(room) {
    socket.leave(socket.room);
    socket.room = room;
    socket.join(room);
    console.log(socket.username, ' joining room', socket.room);
  })
});

var port = process.argv[2] || 3001;

http.listen(port, function() {
  console.log('listening on http://localhost:' + port);
});
