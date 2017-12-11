$(function () {
    const socket = io();

    $('form').submit(function () {
        socket.emit('new message', $('#m').val()); // emit msg to 'chat message' event listener
        $('#m').val('');
        return false;
    });
    $("#logout").click(function () {
        //window.location('/logout');
        window.location.replace("/logout");
        //return false;
    })
    // here we listen for new messages
    socket.on('new message', function (data) {
        console.log("incoming msg:", data);
        $('#messages').append(
            "<li><a href='#'>"+ data.user.nick +": </a>" + data.message + "</li>"
        );
        window.scrollTo(0, document.body.lastChild.scrollHeight);
    });

    socket.on('logged', function (user) {
        console.log("logged user:", user);
        $('#logged-user').html(user.nick+" &#x2728;");
    })
    socket.on('update userList', function (userList) {
        $('#users-online').html('');
        for (let i = 0; i < userList.length; i++) {
            $('#users-online').append('<li><a href="#">'+ userList[i] + '</a></li>');
        }
    })

    socket.on('newUser', function (user) {
        $('#messages').append($('<li>').text(user.nick + ": joined"));
        window.scrollTo(0, document.body.scrollHeight);
    })

    socket.on('disconnect', function (user) {
        $('#messages').append($('<li>').text(user.nick + ": left the channel"));
        window.scrollTo(0, document.body.scrollHeight);
    })
});