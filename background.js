let queue = [];
let currentIndex = 0;
let isRunning = false;
let config = { minDelay: 5, maxDelay: 10 };
let activeTabId = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'START_QUEUE') {
        queue = msg.queue;
        config = msg.config;
        currentIndex = 0;
        isRunning = true;
        processQueue();
    } else if (msg.action === 'PAUSE_QUEUE') {
        isRunning = false;
    } else if (msg.action === 'RESUME_QUEUE') {
        isRunning = true;
        processQueue();
    }
});

async function processQueue() {
    if (!isRunning || currentIndex >= queue.length) return;

    const item = queue[currentIndex];
    const { phone, message, attachment } = item;

    // Report progress
    chrome.runtime.sendMessage({
        action: 'UPDATE_PROGRESS',
        current: currentIndex,
        total: queue.length,
        status: `Preparing to send to ${phone}...`
    }).catch(() => { }); // Ignore error if popup closed

    try {
        // Reuse existing tab if possible
        const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

        if (!activeTabId) {
            // Search for existing tab first
            const tabs = await chrome.tabs.query({ url: "https://web.whatsapp.com/*" });
            if (tabs.length > 0) {
                activeTabId = tabs[0].id;
            }
        }

        if (activeTabId) {
            try {
                await chrome.tabs.update(activeTabId, { url: url, active: true });
            } catch (e) {
                const tab = await chrome.tabs.create({ url: url, active: true });
                activeTabId = tab.id;
            }
        } else {
            const tab = await chrome.tabs.create({ url: url, active: true });
            activeTabId = tab.id;
        }

        // Wait for tab navigation to actually start/complete
        await sleep(2000);

        // Wait for page load logic
        let ready = false;
        let attempts = 0;

        while (!ready && attempts < 60) {
            try {
                const response = await chrome.tabs.sendMessage(activeTabId, { action: 'PING' });
                if (response && response.status === 'READY') {
                    ready = true;
                } else if (response && response.status === 'INVALID_NUMBER') {
                    throw new Error('Invalid Number');
                }
            } catch (e) {
                if (e.message === 'Invalid Number') throw e;
            }
            if (!ready) await sleep(1000);
            attempts++;
        }

        if (!ready) throw new Error('Timeout waiting for WhatsApp Web');

        // 1. Send TEXT first (solves draft issue)
        // The text is already in the input from URL. We just need to click send.
        const textResult = await chrome.tabs.sendMessage(activeTabId, { action: 'CLICK_SEND' });
        if (!textResult.success) {
            throw new Error('Failed to send text');
        }

        // Wait a bit after text sent
        await sleep(2000);

        // 2. Send ATTACHMENT if needed
        if (attachment) {
            const attResult = await chrome.tabs.sendMessage(activeTabId, {
                action: 'SEND_ATTACHMENT',
                attachment: attachment
            });

            if (!attResult || !attResult.success) {
                console.error('Attachment send failed');
            }

            // Wait longer for attachment to fully send
            await sleep(6000);
        }

        if (true) { // Success (assumed if we got here)
            currentIndex++;

            // Random Delay
            const delay = Math.floor(Math.random() * (config.maxDelay - config.minDelay + 1) + config.minDelay) * 1000;

            chrome.runtime.sendMessage({
                action: 'UPDATE_PROGRESS',
                current: currentIndex,
                total: queue.length,
                status: `Sent! Waiting ${delay / 1000}s...`
            }).catch(() => { });

            await sleep(delay);

            // recurse
            processQueue();
        } else {
            throw new Error('Failed to click send');
        }

    } catch (err) {
        console.error(err);
        // On error, maybe skip or retry? For now skip
        currentIndex++;
        processQueue();
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
