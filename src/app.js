const express = require('express');
const router = express.Router();
const utils = require('./utils');
const multer = require('multer'); // for files
const upload = multer({storage: multer.diskStorage(utils.fileStorage)});
const path = require('path');

module.exports = (io) => {
    const userList = [];

    router.post('/login', upload.single('avatar'), (req, res) => {
        if (isAuthorized(req.body.nickname)) {
            console.log("Nickname already in use. Try different one.", req.body.nickname);
            res.redirect('/');
        } else {
            if (req.body.nickname.trim() === '') {
                console.log("Empty string in nickname. Redirecting", req.body.nickname);
                res.redirect('/');
                return;
            }
            userList.push(req.body.nickname);
            req.session.authorized = true;
            req.session.user = {
                nick: req.body.nickname,
                avatar: typeof req.file === 'undefined' ? "" : req.file.filename
            };
            res.redirect('chat');
        }
    });

    router.get('/logout', (req, res) => {
        req.session.destroy();
        res.redirect('/');
    });

    router.get('/chat', requireAuthentication, (req, res) => {
        res.sendFile(path.resolve('public/chat.html'));
    });

    function isAuthorized(username) {
        return userList.indexOf(username) !== -1;
    }

    function requireAuthentication(req, res, next) {
        req.session.authorized ? next() : res.redirect('/');
    }

    function updateUsersList() {
        io.sockets.emit('update userList', userList);
    }

    // listen on the connection event for incoming sockets.
    io.on('connection', (clientSocket) => {
        const user = clientSocket.request.session.user;
        user.socket_id = clientSocket.id;
        clientSocket.emit('logged', user);
        updateUsersList();

        clientSocket.on('disconnect', () => {
            userList.splice(userList.indexOf(user.nick), 1);
            updateUsersList();
            io.emit('disconnect', user);
        });

        clientSocket.on('new message', (message) => {
            io.emit('new message', {user, message: message});
        });

        clientSocket.broadcast.emit('newUser', user);
    });

    return router;
};