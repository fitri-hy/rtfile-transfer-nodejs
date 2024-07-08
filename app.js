const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.static('public'));

const clients = {};

io.on('connection', (socket) => {
    const clientId = uuidv4();
    clients[clientId] = socket;

    socket.emit('clientId', { clientId });

    console.log(`Client connected: ${clientId}`);

    socket.on('fileTransfer', (data) => {
        const { targetClientId, fileName, fileType, fileData } = data;
        const targetClient = clients[targetClientId];
        if (targetClient) {
            targetClient.emit('fileReceive', {
                fileName,
                fileType,
                fileData,
                senderClientId: clientId
            });
        } else {
            socket.emit('error', { message: 'Target client not connected' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${clientId}`);
        delete clients[clientId];
    });
});

app.use((req, res, next) => {
  req.domain = req.headers.host;
  next();
});

app.get('/', (req, res) => {
    res.render('index', { domain: req.domain });
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
