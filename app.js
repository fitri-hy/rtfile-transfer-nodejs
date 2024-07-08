const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const cors = require('cors');
const { Buffer } = require('buffer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    maxHttpBufferSize: 1e8,
    pingTimeout: 60000,
    pingInterval: 25000
});

app.use(cors());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const clients = {};
const fileChunks = {};

io.on('connection', (socket) => {
    const clientId = uuidv4();
    clients[clientId] = socket;

    socket.emit('clientId', { clientId });

    console.log(`Client connected: ${clientId}`);

    socket.on('fileChunk', (data) => {
        const { targetClientId, fileName, fileType, fileData, offset, lastChunk } = data;

        if (!fileChunks[fileName]) {
            fileChunks[fileName] = [];
        }

        const chunkBuffer = Buffer.from(new Uint8Array(fileData));

        fileChunks[fileName][offset] = chunkBuffer;

        if (lastChunk) {
            try {
                const sortedChunks = fileChunks[fileName].filter(chunk => chunk !== undefined);
                const fileBuffer = Buffer.concat(sortedChunks);
                
                const targetClient = clients[targetClientId];
                if (targetClient) {
                    targetClient.emit('fileReceive', {
                        fileName,
                        fileType,
                        fileData: fileBuffer.toString('base64'),
                        senderClientId: clientId
                    });

                    socket.emit('fileStatus', { success: true, message: 'File berhasil dikirim!' });
                } else {
                    socket.emit('fileStatus', { success: false, message: 'Target client tidak terhubung.' });
                }
                delete fileChunks[fileName];
            } catch (error) {
                console.error('Error during file reconstruction:', error);
                socket.emit('fileStatus', { success: false, message: 'Terjadi kesalahan saat menggabungkan file.' });
            }
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
