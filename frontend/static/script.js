document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileListContainer = document.getElementById('file-list-container');
    const fileList = document.getElementById('file-list');
    const fileCount = document.getElementById('file-count');
    const clearBtn = document.getElementById('clear-btn');
    const processBtn = document.getElementById('process-btn');
    const processStatus = document.getElementById('process-status');
    const resultSection = document.getElementById('result-section');
    const downloadLink = document.getElementById('download-link');
    const resetBtn = document.getElementById('reset-btn');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    let selectedFiles = [];

    // Warm up the Render backend (Free Tier spins down after inactivity)
    // Send a lightweight request to wake it up as soon as the frontend loads
    fetch('https://wmukebiao.onrender.com/', { method: 'GET' })
        .then(() => console.log('Backend woken up'))
        .catch(err => console.log('Backend wake-up ping sent'));

    // Drag and Drop Events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('dragover');
    }

    function unhighlight(e) {
        dropZone.classList.remove('dragover');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // File Input Change
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        const newFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.zip'));
        
        if (newFiles.length === 0 && files.length > 0) {
            showError("请只上传 .zip 格式的文件");
            return;
        }

        selectedFiles = [...selectedFiles, ...newFiles];
        updateFileList();
        hideError();
    }

    function updateFileList() {
        fileList.innerHTML = '';
        fileCount.textContent = selectedFiles.length;

        if (selectedFiles.length > 0) {
            fileListContainer.style.display = 'block';
            dropZone.style.display = 'none';
        } else {
            fileListContainer.style.display = 'none';
            dropZone.style.display = 'block';
        }

        selectedFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.innerHTML = `
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatSize(file.size)}</span>
                </div>
                <span class="remove-file" onclick="removeFile(${index})">×</span>
            `;
            fileList.appendChild(li);
        });
    }

    window.removeFile = function(index) {
        selectedFiles.splice(index, 1);
        updateFileList();
    };

    function formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Clear List
    clearBtn.addEventListener('click', () => {
        selectedFiles = [];
        updateFileList();
        fileInput.value = ''; // Reset input
    });

    // Process Files
    processBtn.addEventListener('click', () => {
        if (selectedFiles.length === 0) return;

        fileListContainer.style.display = 'none';
        processStatus.style.display = 'block';
        hideError();

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files[]', file);
        });

        // Use the Render backend URL
        fetch('https://wmukebiao.onrender.com/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || 'Processing failed'); });
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            downloadLink.href = url;
            downloadLink.download = 'course_schedule.ics'; // Default name, browser might use header
            
            processStatus.style.display = 'none';
            resultSection.style.display = 'block';
        })
        .catch(error => {
            processStatus.style.display = 'none';
            fileListContainer.style.display = 'block';
            showError(error.message);
        });
    });

    // Reset
    resetBtn.addEventListener('click', () => {
        selectedFiles = [];
        updateFileList();
        resultSection.style.display = 'none';
        dropZone.style.display = 'block';
        fileInput.value = '';
    });

    function showError(msg) {
        errorText.textContent = msg;
        errorMessage.style.display = 'flex';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }
});
