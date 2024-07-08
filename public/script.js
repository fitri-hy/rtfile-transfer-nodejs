        const socket = io();

        socket.on('clientId', (data) => {
            document.getElementById('clientId').textContent = data.clientId;
        });

        document.getElementById('sendFileButton').addEventListener('click', function() {
            const fileInput = document.getElementById('fileInput');
            const targetClientId = document.getElementById('targetClientId').value;
            if (fileInput.files.length > 0 && targetClientId) {
                const file = fileInput.files[0];
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const fileData = {
                        targetClientId: targetClientId,
                        fileName: file.name,
                        fileType: file.type,
                        fileData: evt.target.result
                    };
                    socket.emit('fileTransfer', fileData);
                };
                reader.readAsDataURL(file);
            }
        });

        socket.on('fileReceive', (data) => {
			const { fileName, fileType, fileData, senderClientId } = data;
			const link = document.createElement('div');
			link.innerHTML = `
				<div class="flex flex-col gap-1 items-center mt-16 m-auto max-w-sm">
					<p class="font-bold text-white">Files Received From ID</p>
					<span class="text-yellow-500 w-full bg-zinc-900 px-2 py-1 border border-zinc-700 rounded-md text-center">
						${senderClientId}
					</span>
					<p class="mt-4 font-bold text-white">Files Name</p>
					<span class="text-yellow-500 w-full bg-zinc-900 px-2 py-1 border border-zinc-700 rounded-md text-center">
						${fileName}
					</span>
					<a href="${fileData}" download="${fileName}" class="mt-4 bg-green-700 px-4 py-2 rounded hover:bg-green-600 text-white font-semibold" id="sendFileButton">
						Download
					</a>
				</div>
			`;
			document.getElementById('fileList').appendChild(link);
			document.getElementById('fileList').appendChild(document.createElement('br'));
		});


        socket.on('error', (error) => {
            alert(error.message);
        });