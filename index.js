var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');

io.use(function(socket, next) {
  var options = {
    url: 'http://localhost:4567/user',
    headers: {
      authorization: 'Bearer ' + socket.handshake.query.bearer
    }
  };

  request(options, function(err, response, body) {
    var json = JSON.parse(body);
    console.log('json', json);

    if (!json.error && json.id) {
      socket.username = json.username;
      next();
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
