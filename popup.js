document.addEventListener('DOMContentLoaded', () => {
    // Tabs
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Inputs - CSV
    const csvInput = document.getElementById('csvFile');
    const zipInput = document.getElementById('zipFile');
    const msgTemplate = document.getElementById('messageTemplate');
    const btnAddToQueueCsv = document.getElementById('btnAddToQueueCsv');

    // Inputs - Manual
    const manualPhone = document.getElementById('manualPhone');
    const manualMsg = document.getElementById('manualMsg');
    const manualFile = document.getElementById('manualFile');
    const btnAddManual = document.getElementById('btnAddManual');

    // Queue & Controls
    const queueList = document.getElementById('queueList');
    const queueCount = document.getElementById('queueCount');
    const btnClearQueue = document.getElementById('btnClearQueue');
    const minDelayInput = document.getElementById('minDelay');
    const maxDelayInput = document.getElementById('maxDelay');

    // Action Buttons
    const btnStart = document.getElementById('btnStart');
    const btnPause = document.getElementById('btnPause');
    const btnResume = document.getElementById('btnResume');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const statusBar = document.getElementById('statusBar');

    // File input handlers to display filename
    csvInput.addEventListener('change', (e) => {
        const display = document.getElementById('csvFileName');
        if (e.target.files.length > 0) {
            display.textContent = e.target.files[0].name;
            display.style.display = 'flex';
        } else {
            display.style.display = 'none';
        }
    });

    zipInput.addEventListener('change', (e) => {
        const display = document.getElementById('zipFileName');
        if (e.target.files.length > 0) {
            display.textContent = e.target.files[0].name;
            display.style.display = 'flex';
        } else {
            display.style.display = 'none';
        }
    });

    manualFile.addEventListener('change', (e) => {
        const display = document.getElementById('manualFileName');
        if (e.target.files.length > 0) {
            display.textContent = e.target.files[0].name;
            display.style.display = 'flex';
        } else {
            display.style.display = 'none';
        }
    });

    // State
    let mainQueue = []; // Array of { phone, message, attachment }
    let zipContent = null;

    // --- TABS LOGIC ---
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });

    // --- INITIALIZATION ---
    // Restore state
    chrome.storage.local.get(['queue', 'minDelay', 'maxDelay'], (res) => {
        if (res.queue) {
            mainQueue = res.queue;
            renderQueue();
        }
        if (res.minDelay) minDelayInput.value = res.minDelay;
        if (res.maxDelay) maxDelayInput.value = res.maxDelay;
    });

    // Save delay settings
    [minDelayInput, maxDelayInput].forEach(el => {
        el.addEventListener('change', () => {
            chrome.storage.local.set({
                minDelay: parseInt(minDelayInput.value),
                maxDelay: parseInt(maxDelayInput.value)
            });
        });
    });

    // --- ZIP HANDLING ---
    zipInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const zip = new JSZip();
            zipContent = await zip.loadAsync(file);
            statusBar.textContent = 'ZIP loaded successfully';
        } catch (err) {
            statusBar.textContent = 'Error loading ZIP';
            console.error(err);
        }
    });

    // --- ADD TO QUEUE: CSV ---
    btnAddToQueueCsv.addEventListener('click', async () => {
        const file = csvInput.files[0];
        const template = msgTemplate.value;

        if (!file) { alert('Please select a CSV file'); return; }
        if (!template) { alert('Please enter a message template'); return; }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const contacts = parseCSV(text);
            let count = 0;

            for (const contact of contacts) {
                let message = template.replace(/{name}/g, contact.name || '');
                let attachment = null;

                // Process Attachment from ZIP if exists
                if (contact.file && zipContent) {
                    const zipFile = zipContent.file(contact.file);
                    if (zipFile) {
                        try {
                            const base64 = await zipFile.async('base64');
                            const type = getMimeType(contact.file);
                            attachment = {
                                name: contact.file,
                                data: base64, // base64 string only
                                type: type
                            };
                        } catch (err) {
                            console.error(`Failed to load ${contact.file} from zip`, err);
                        }
                    }
                }

                mainQueue.push({
                    phone: contact.phone,
                    message: message,
                    attachment: attachment
                });
                count++;
            }

            saveQueue();
            renderQueue();
            statusBar.textContent = `Added ${count} items from CSV`;
            csvInput.value = ''; // Reset
        };
        reader.readAsText(file);
    });

    // --- ADD TO QUEUE: MANUAL ---
    btnAddManual.addEventListener('click', () => {
        let phone = manualPhone.value.trim().replace(/\D/g, '');

        // Auto-fix ID User: 0812 -> 62812
        if (phone.startsWith('0')) {
            phone = '62' + phone.substring(1);
        }

        const message = manualMsg.value;
        const file = manualFile.files[0];

        if (!phone) { alert('Phone number is required'); return; }
        if (phone.length < 10) { alert('Phone number seems too short. Check format (e.g. 628...)'); return; }
        // Message can be empty if there is an file, but usually we want one.
        if (!message && !file) { alert('Enter a message or attach a file'); return; }

        const addItem = (att) => {
            mainQueue.push({
                phone: phone,
                message: message,
                attachment: att
            });
            saveQueue();
            renderQueue();

            // Allow chaining adds easily
            manualPhone.value = '';
            // manualMsg.value = ''; // Keep message for reuse? Maybe clear it. 
            // Let's clear everything for safety.
            manualMsg.value = '';
            manualFile.value = '';
        };

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result.split(',')[1]; // Remove data URL prefix
                const type = file.type || getMimeType(file.name);
                addItem({
                    name: file.name,
                    data: base64,
                    type: type
                });
            };
            reader.readAsDataURL(file);
        } else {
            addItem(null);
        }
    });

    // --- QUEUE MANAGEMENT ---
    function renderQueue() {
        queueList.innerHTML = '';
        queueCount.textContent = mainQueue.length;
        progressText.textContent = `0 / ${mainQueue.length}`;

        if (mainQueue.length === 0) {
            queueList.innerHTML = '<div class="empty-state">Queue is empty</div>';
            return;
        }

        mainQueue.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'queue-item';

            const attText = item.attachment ? `<span class="q-file">📎 ${item.attachment.name}</span>` : '';
            div.innerHTML = `
                <div class="q-info">
                    <span class="q-phone">${item.phone}</span>: ${item.message.substring(0, 20)}${item.message.length > 20 ? '...' : ''} ${attText}
                </div>
                <span class="q-remove" data-index="${index}">×</span>
            `;
            queueList.appendChild(div);
        });

        // Add remove handlers
        document.querySelectorAll('.q-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                mainQueue.splice(idx, 1);
                saveQueue();
                renderQueue();
            });
        });
    }

    function saveQueue() {
        chrome.storage.local.set({ queue: mainQueue });
    }

    btnClearQueue.addEventListener('click', () => {
        if (confirm('Clear entire queue?')) {
            mainQueue = [];
            saveQueue();
            renderQueue();
        }
    });

    // --- CONTROLS ---
    btnStart.addEventListener('click', () => {
        if (mainQueue.length === 0) { alert('Queue is empty!'); return; }

        const minDelay = parseInt(minDelayInput.value) || 5;
        const maxDelay = parseInt(maxDelayInput.value) || 10;

        chrome.runtime.sendMessage({
            action: 'START_QUEUE',
            queue: mainQueue,
            config: { minDelay, maxDelay }
        });

        toggleUI(true);
    });

    // Listen from Background
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === 'UPDATE_PROGRESS') {
            const { current, total, status } = msg;
            const pct = (current / total) * 100;
            progressBar.style.width = `${pct}%`;
            progressText.textContent = `${current} / ${total}`;
            statusBar.textContent = status;

            // Re-render queue to show active item?? 
            // For now simple progress is enough.

            if (current >= total && total > 0) {
                toggleUI(false);
                statusBar.textContent = 'Finished!';
            }
        }
    });

    // Pause/Resume
    btnPause.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'PAUSE_QUEUE' });
        btnPause.classList.add('hidden');
        btnResume.classList.remove('hidden');
    });

    btnResume.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'RESUME_QUEUE' });
        btnResume.classList.add('hidden');
        btnPause.classList.remove('hidden');
    });

    function toggleUI(running) {
        if (running) {
            btnStart.classList.add('hidden');
            btnPause.classList.remove('hidden');
            // Disable inputs
            [btnAddManual, btnAddToQueueCsv, btnClearQueue].forEach(b => b.disabled = true);
        } else {
            btnStart.classList.remove('hidden');
            btnPause.classList.add('hidden');
            btnResume.classList.add('hidden');
            [btnAddManual, btnAddToQueueCsv, btnClearQueue].forEach(b => b.disabled = false);
        }
    }

    // Utils
    function parseCSV(text) {
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const result = [];
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(',');
            if (row.length < headers.length) continue;
            const obj = {};
            headers.forEach((h, index) => {
                obj[h] = row[index] ? row[index].trim() : '';
            });
            if (obj.phone) {
                let p = obj.phone.replace(/\D/g, '');
                if (p.startsWith('0')) p = '62' + p.substring(1);
                obj.phone = p;
                if (obj.phone) result.push(obj);
            }
        }
        return result;
    }

    function getMimeType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const types = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
            'mp4': 'video/mp4',
            'txt': 'text/plain',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
        return types[ext] || 'application/octet-stream';
    }
});
