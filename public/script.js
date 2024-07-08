const socket = io();

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const CHUNK_SIZE = 1024 * 1024;

const modal = document.getElementById('statusModal');
const modalMessage = document.getElementById('modalMessage');
const closeModalBtn = document.getElementById('closeModalBtn');

function openModal(message, isSuccess) {
    modalMessage.textContent = message;
    modal.classList.remove('hidden');
    modal.classList.add(isSuccess ? 'backdrop-blur-sm' : 'backdrop-blur-sm');
}

function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('bg-green-600', 'bg-red-600');
}

socket.on('clientId', (data) => {
    document.getElementById('clientId').textContent = data.clientId;
});

document.getElementById('sendFileButton').addEventListener('click', function() {
    const fileInput = document.getElementById('fileInput');
    const targetClientId = document.getElementById('targetClientId').value;

    if (fileInput.files.length > 0 && targetClientId) {
        const file = fileInput.files[0];

        if (file.size > MAX_FILE_SIZE) {
            openModal('File size exceeds the 25 MB limit. Please select a smaller file.', false);
            return;
        }

        sendFileInChunks(file, targetClientId);
    } else {
        openModal('Please select a file and enter a target ID.', false);
    }
});

function sendFileInChunks(file, targetClientId) {
    const reader = new FileReader();
    let offset = 0;

    reader.onload = function(event) {
        const chunk = event.target.result;
        socket.emit('fileChunk', {
            targetClientId: targetClientId,
            fileName: file.name,
            fileType: file.type,
            fileData: chunk,
            offset: offset,
            lastChunk: offset + chunk.byteLength >= file.size
        });
        offset += chunk.byteLength;
        if (offset < file.size) {
            readNextChunk();
        }
    };

    function readNextChunk() {
        const slice = file.slice(offset, offset + CHUNK_SIZE);
        reader.readAsArrayBuffer(slice);
    }

    readNextChunk();
}

socket.on('fileReceive', (data) => {
    const { fileName, fileType, fileData, senderClientId } = data;
    const link = document.createElement('div');
    link.innerHTML = `
        <div class="flex flex-col gap-1 items-center mt-6 m-auto max-w-sm">
            <p class="font-bold text-white">Files Received From ID</p>
            <span class="text-yellow-500 w-full bg-zinc-900 px-2 py-1 border border-zinc-700 rounded-md text-center">
                ${senderClientId}
            </span>
            <p class="mt-4 font-bold text-white">Files Name</p>
            <span class="text-yellow-500 w-full bg-zinc-900 px-2 py-1 border border-zinc-700 rounded-md text-center">
                ${fileName}
            </span>
            <a href="${`data:${fileType};base64,${fileData}`}" download="${fileName}" class="mt-4 bg-green-700 px-4 py-2 rounded hover:bg-green-600 text-white font-semibold">
                Download
            </a>
        </div>
    `;
    document.getElementById('fileList').appendChild(link);
    document.getElementById('fileList').appendChild(document.createElement('br'));
});

socket.on('fileStatus', (status) => {
    openModal(status.message, status.success);
});

socket.on('error', (error) => {
    openModal(error.message, false);
});

closeModalBtn.addEventListener('click', closeModal);
