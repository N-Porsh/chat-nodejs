const config = require('config');
const express = require('express');
const app = express();
const http = require('http').Server(app);
// initialize a new instance of socket.io by passing the http (the HTTP server) object.
const io = require('socket.io')(http);
const application = require('./src/app')(io);
const bodyParser = require('body-parser');
const session = require('express-session');
const port = process.env.PORT || config.port;
const sessionMiddleware = session({
    secret: config.session_secret,
    resave: false,
    saveUninitialized: false, // should be true
    unset: 'destroy'
});

http.listen(port, () => {
    console.log('listening on *:' + port);
});

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(sessionMiddleware);

// Allow sockets to access session data
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

app.use('/', application);

app.use((req, res) => {
    res.status(404).send("404! Sorry can't find that!")
});

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('500! Something broke!')
});