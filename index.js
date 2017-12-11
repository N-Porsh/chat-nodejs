const express = require('express');
const app = express();
const http = require('http').Server(app);
// initialize a new instance of socket.io by passing the http (the HTTP server) object.
let io = require('socket.io')(http);
const bodyParser = require('body-parser');
const session = require('express-session');
const utils = require('./src/utils');
const multer = require('multer'); // for files
const upload = multer({storage: multer.diskStorage(utils.fileStorage)});
const port = process.env.PORT || 3000;
const sessionMiddleware = session({
    secret: 'ssshhhhh',
    resave: false,
    saveUninitialized: false,
});

http.listen(port, function () {
    console.log('listening on *:' + port);
});

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(sessionMiddleware);

// Allow sockets to access session data
io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res, next);
});

const userList = [];

app.post('/login', upload.single('avatar'), function (req, res) {
    if (isAuthorized(req.body.nickname)) {
        console.log("Nickname already in use. Try different one.", req.body.nickname);
        res.redirect('/');
    } else {
        userList.push(req.body.nickname);
        req.session.authorized = true;
        req.session.user = {
            nick: req.body.nickname,
            avatar: "1499976824249xexe.jpg"
        };
        res.redirect('chat');
    }
});

app.get('/chat', requireAuthentication, function (req, res) {
    if (!req.session.authorized) {
        res.redirect('/');
        return;
    }
    res.sendFile(__dirname + '/public/chat.html');
});

app.get('/logout', function (req, res, next) {
    req.session = null;
    console.log('session after logout:',req.session);
    res.redirect('/');
});

function isAuthorized(username) {
    return userList.indexOf(username) !== -1;
}

function requireAuthentication(req, res, next) {
    //req.session.authorized ? next() : res.redirect('/');
    console.log('session on requireAuth:', req.session);
    if (!req.session.authorized) {
        console.log("User not logged in. Redirecting...");
        res.redirect('/');
        return;
    }
    console.log("User %s logged in", req.session.user.nick);
    next();
}

function updateUsersList() {
    io.sockets.emit('update userList', userList);
}

// listen on the connection event for incoming sockets.
io.on('connection', connection);
function connection(clientSocket) {
    let user = clientSocket.request.session.user;
    user.socket_id = clientSocket.id;

    console.log('User connected:', user);
    console.log('userList:', userList);


    clientSocket.emit('logged', user);
    updateUsersList();

    clientSocket.on('disconnect', function () {
        console.log('User disconnected:', user, clientSocket.request.session);

        userList.splice(userList.indexOf(user.nick), 1);
        updateUsersList();
        console.log('userList after disconnect:',userList);

        io.emit('disconnect', user);
    });

    clientSocket.on('new message', function (message) {
        io.emit('new message', {user, message: message});
    });

    clientSocket.broadcast.emit('newUser', user);
}