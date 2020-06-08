var PORT = process.env.PORT || 6800;
var express = require('express');
var app = express();

var http = require('http');
var server = http.Server(app);

app.use(express.static('public'));

app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(PORT, function(){
    console.log(`Chat server running at ${PORT}`);
});

var visitors = [];
const addVisitor = (socket, user) => {
    visitor = {
        socket: socket,
        user: user
    };

    visitors.push(visitor);
    emitVisitors();
};

const removeVisitor = (socket) => {
    visitors = visitors.filter(c => c.socket !== socket);
    emitVisitors();
};

const getVisitors = () => {
    let users = visitors.map(s => s.user);
    return users;
};

const emitVisitors = () => {
    io.emit("visitors", getVisitors());
};

var io = require('socket.io')(server);

io.on("connection", socket => {

    console.log('a user connected');

    socket.on("add-user", (user) => {
        addVisitor(socket, user);
        socket.user = user;

        const payload = {
            message: `${user.name} is connected`
        };

        socket.broadcast.emit("connected", payload);
    });

    socket.on("typing", (payload) => {
        console.log("typing..");
        socket.broadcast.emit("typing", {
            message: `${payload.from.name} typing...`
        });
    });

    socket.on("stop-typing", () => {
        console.log("stop-typing..");
        socket.broadcast.emit("stop-typing", {
            message: ''
        });
    });

    socket.on("send-message", (payload) => {
        io.emit("receive-message", payload);
    });

    socket.on("disconnect", () => {

        const { user } = socket;
        if (user) {
            removeVisitor(socket);
            const payload = {
                message: `${user.name} is disconnected`
            };
            io.emit("disconnected", payload);
        }
    });
});