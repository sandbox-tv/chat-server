var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');

if (!process.env.API_URL) {
    throw new Error('API_URL is not defined');
}

io.use(function(socket, next) {
  console.log(socket.handshake.query.sessiontoken);

  var options = {
    url: process.env.API_URL + '/user?sessiontoken=' + socket.handshake.query.sessiontoken
  };

  connectToApi(5);

  function connectToApi(maxTries) {
    request(options, function(err, response, body) {
      if (err) {

        console.log(err);

        if (maxTries == 0) {
          throw new Error('Could not connect to API!');
        }

        setTimeout(function() { connectToApi(maxTries - 1) }, 3000);

        return;

      } else {
        console.log("body", body);
        var json = body ? JSON.parse(body) : {};

        if (response.statusCode === 200 && json.user && json.user.username) {
          socket.username = json.user.username;
          next();
        } else {
          next({error: 'unauthorized', msg: json});
        }
      }
    });
  }
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
