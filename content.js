// WA Sender Pro - Content Script (Fixed Attachment Flow)

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    (async () => {
        if (msg.action === 'PING') {
            const input = await waitForElement('div[contenteditable="true"]', 500);
            const bodyText = document.body.innerText;
            const isInvalid = bodyText.includes('Phone number shared via url is invalid') || bodyText.includes('Tautan salah');

            if (isInvalid) {
                sendResponse({ status: 'INVALID_NUMBER' });
            } else if (input) {
                sendResponse({ status: 'READY' });
            } else {
                sendResponse({ status: 'WAITING' });
            }
        }

        else if (msg.action === 'CLICK_SEND') {
            const success = await clickSendWithRetry();
            sendResponse({ success });
        }

        else if (msg.action === 'SEND_ATTACHMENT') {
            const success = await handleAttachment(msg.attachment);
            sendResponse({ success });
        }
    })();
    return true;
});

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function waitForElement(selector, timeout = 3000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const el = document.querySelector(selector);
        if (el) return el;
        await sleep(200);
    }
    return null;
}

async function clickSendWithRetry() {
    const start = Date.now();
    while (Date.now() - start < 10000) {

        const input = document.querySelector('div[contenteditable="true"][data-tab="10"]') ||
            document.querySelector('div[contenteditable="true"][data-tab="1"]');

        if (input) {
            input.focus();
            input.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(100);
        }

        const btn = document.querySelector('span[data-icon="send"]') ||
            document.querySelector('button[aria-label="Send"]') ||
            document.querySelector('button[aria-label="Kirim"]');

        if (btn) {
            console.log('Sending via button...');
            (btn.closest('div[role="button"]') || btn.closest('button') || btn).click();
            return true;
        }

        if (input) {
            console.log('Sending via Enter...');
            input.focus();
            const event = new KeyboardEvent('keydown', {
                bubbles: true,
                cancelable: true,
                view: window,
                keyCode: 13,
                which: 13,
                key: 'Enter',
                code: 'Enter'
            });
            input.dispatchEvent(event);

            await sleep(300);
            if (!input.innerText || input.innerText.trim() === '') return true;
        }

        await sleep(800);
    }
    return false;
}

async function handleAttachment(attachment) {
    try {
        console.log('========================================');
        console.log('📎 ATTACHMENT UPLOAD START');
        console.log('File:', attachment.name);
        console.log('Type:', attachment.type);
        console.log('========================================');

        const isMedia = attachment.type.startsWith('image') || attachment.type.startsWith('video');
        console.log('Detected as:', isMedia ? '🖼️ IMAGE/VIDEO' : '📄 DOCUMENT');

        // STEP 1: Click attach/clip button
        console.log('Step 1: Finding attach button...');

        let clipIcon = null;
        const clipSelectors = [
            'span[data-icon="clip"]',
            'span[data-icon="plus"]',
            'span[data-icon="attach-menu-plus"]',
            'div[title="Attach"]',
            'button[aria-label*="Attach"]',
            'button[aria-label*="Lampir"]'
        ];

        for (const selector of clipSelectors) {
            clipIcon = document.querySelector(selector);
            if (clipIcon) {
                console.log('✓ Found attach button:', selector);
                break;
            }
        }

        if (!clipIcon) {
            console.error('❌ Attach button not found');
            return false;
        }

        console.log('✓ Clicking attach button...');
        const clipBtn = clipIcon.closest('div[role="button"]') || clipIcon.closest('button') || clipIcon;
        clipBtn.click();

        // STEP 2: Wait for menu to fully open
        console.log('Step 2: Waiting for menu to open...');
        await sleep(1500);

        // STEP 3: Find and click the correct menu button
        console.log('Step 3: Looking for menu button...');

        const targetKeywords = isMedia ?
            ['attach image', 'image/video', 'photo', 'foto', 'gambar'] :
            ['attach document', 'document', 'dokumen', 'berkas'];

        let menuButton = null;
        let attempts = 0;
        const maxAttempts = 10;

        // Retry loop to find button
        while (!menuButton && attempts < maxAttempts) {
            const allButtons = Array.from(document.querySelectorAll('button, div[role="button"], li'));

            menuButton = allButtons.find(btn => {
                const text = (btn.innerText || btn.textContent || '').trim().toLowerCase();
                return targetKeywords.some(keyword => text.includes(keyword));
            });

            if (!menuButton) {
                console.log(`  Attempt ${attempts + 1}: Menu button not found, waiting...`);
                await sleep(300);
                attempts++;
            }
        }

        if (!menuButton) {
            console.error(`❌ ${isMedia ? 'IMAGE/VIDEO' : 'DOCUMENT'} menu button NOT FOUND after ${maxAttempts} attempts`);
            const allButtons = document.querySelectorAll('button, div[role="button"]');
            console.error('Available buttons:');
            Array.from(allButtons).slice(0, 15).forEach((btn, idx) => {
                const text = (btn.innerText || '').trim().substring(0, 40);
                if (text) console.error(`  [${idx}] "${text}"`);
            });
            return false;
        }

        console.log('✓ Found menu button:', menuButton.innerText.trim());
        console.log('Step 4: Clicking menu button...');
        menuButton.click();

        // STEP 4: Wait for file input to appear AFTER clicking button
        console.log('Step 5: Waiting for file input to appear...');
        await sleep(1200); // Increased

        let targetInput = null;
        attempts = 0;

        // Retry loop to find file input
        while (!targetInput && attempts < maxAttempts) {
            const allInputs = Array.from(document.querySelectorAll('input[type="file"]'));

            if (allInputs.length > 0) {
                console.log(`  Attempt ${attempts + 1}: Found ${allInputs.length} file input(s)`);

                // Log all inputs
                allInputs.forEach((inp, idx) => {
                    console.log(`    Input ${idx}: accept="${inp.accept || 'any'}"`);
                });

                // Select correct input based on type
                if (isMedia) {
                    targetInput = allInputs.find(i => i.accept && (i.accept.includes('image') || i.accept.includes('video')));
                } else {
                    // For DOCUMENTS: skip image, video, and CSV inputs
                    targetInput = allInputs.find(i => {
                        const accept = i.accept || '';

                        // Skip image inputs
                        if (accept.includes('image')) return false;

                        // Skip video inputs
                        if (accept.includes('video')) return false;

                        // Skip CSV inputs (extension's own upload)
                        if (accept.includes('.csv') || accept.includes('csv')) return false;

                        // Accept wildcard
                        if (accept === '*') return true;

                        // Accept empty (no restriction)
                        if (accept === '') return true;

                        // Accept anything else
                        return true;
                    });
                }

                // Fallback: use last input
                if (!targetInput && allInputs.length > 0) {
                    console.log('  Using fallback: last input');
                    targetInput = allInputs[allInputs.length - 1];
                }
            }

            if (!targetInput) {
                await sleep(300);
                attempts++;
            }
        }

        if (!targetInput) {
            console.error('❌ File input not found after clicking menu button');
            return false;
        }

        console.log('✓ Found file input with accept:', targetInput.accept || 'any');

        // STEP 5: Create file
        console.log('Step 6: Creating file...');
        const blob = b64toBlob(attachment.data, attachment.type);
        const file = new File([blob], attachment.name, { type: attachment.type });
        console.log('✓ File created:', file.size, 'bytes');

        // STEP 6: Click input element first (important for WhatsApp)
        console.log('Step 7: Clicking input element...');
        try {
            targetInput.click();
            await sleep(500);
        } catch (e) {
            console.log('  Input click failed (might be hidden), continuing...');
        }

        // STEP 7: Assign file to input
        console.log('Step 8: Assigning file to input...');
        const dt = new DataTransfer();
        dt.items.add(file);
        targetInput.files = dt.files;

        console.log('Step 9: Triggering change events...');
        targetInput.dispatchEvent(new Event('change', { bubbles: true }));
        targetInput.dispatchEvent(new Event('input', { bubbles: true }));

        // Also try focus event
        targetInput.focus();
        targetInput.dispatchEvent(new Event('focus', { bubbles: true }));

        // Wait for preview modal
        const waitTime = isMedia ? 3000 : 6000;
        console.log(`✓ Waiting ${waitTime}ms for preview modal...`);
        await sleep(waitTime);

        // STEP 8: Check if preview modal appeared
        console.log('Step 10: Checking for preview modal...');
        const previewSelectors = [
            'div[data-animate-modal-popup="true"]',
            'div[data-animate-modal-body="true"]',
            'div[role="dialog"]',
            'div.modal',
            'div[data-testid="media-viewer"]'
        ];

        let previewFound = false;
        for (const selector of previewSelectors) {
            if (document.querySelector(selector)) {
                console.log('✓ Preview modal found:', selector);
                previewFound = true;
                break;
            }
        }

        if (!previewFound) {
            console.warn('⚠ Preview modal not detected with standard selectors');
        }

        // STEP 9: Find and click send button
        console.log('Step 11: Finding Send button in preview...');

        for (let attempt = 0; attempt < 40; attempt++) {
            // Try multiple selectors for send button
            const sendSelectors = [
                'span[data-icon="send"]',
                'span[data-icon="wds-ic-send-filled"]',
                'button[aria-label*="Send"]',
                'button[aria-label*="Kirim"]',
                'div[aria-label*="Send"]',
                'div[aria-label*="Kirim"]'
            ];

            let sendBtn = null;
            for (const selector of sendSelectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    sendBtn = elements[elements.length - 1]; // Use last one (modal)
                    console.log(`✓ Found send button with: ${selector} (${elements.length} total)`);
                    break;
                }
            }

            if (sendBtn) {
                const clickable = sendBtn.closest('div[role="button"]') || sendBtn.closest('button') || sendBtn;

                console.log('Clicking send button...');
                clickable.click();

                await sleep(2500);
                console.log('========================================');
                console.log('✅ ATTACHMENT SENT SUCCESSFULLY!');
                console.log('========================================');
                return true;
            }

            await sleep(400);
        }

        console.error('========================================');
        console.error('❌ FAILED: Send button not found in preview after 16s');
        console.error('❌ Preview modal may not have appeared');
        console.error('========================================');
        return false;

    } catch (e) {
        console.error('========================================');
        console.error('❌ EXCEPTION:', e);
        console.error('========================================');
        return false;
    }
}

function b64toBlob(b64Data, contentType) {
    contentType = contentType || '';
    const sliceSize = 512;
    try {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: contentType });
    } catch (e) {
        return new Blob([], { type: contentType });
    }
}

function injectUI() {
    if (document.getElementById('wa-sender-btn')) return;

    // Find left sidebar navigation
    const sidebar = document.querySelector('div[role="navigation"]') ||
        document.querySelector('nav') ||
        document.querySelector('#side');

    if (sidebar) {
        const btn = document.createElement('div');
        btn.id = 'wa-sender-btn';
        btn.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; border-radius: 8px; transition: all 0.2s; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);">
                <div style="width: 36px; height: 36px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; backdrop-filter: blur(10px);">
                    🚀
                </div>
                <span style="color: white; font-weight: 600; font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">Kirim pesan otomatis</span>
            </div>
        `;
        btn.title = 'Kirim Pesan Otomatis - Wsender PRO';

        // Style the container
        btn.style.margin = '8px 12px';
        btn.style.cursor = 'pointer';

        // Hover effect
        const innerDiv = btn.querySelector('div');
        btn.addEventListener('mouseenter', () => {
            innerDiv.style.transform = 'translateY(-2px)';
            innerDiv.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.4)';
        });
        btn.addEventListener('mouseleave', () => {
            innerDiv.style.transform = 'translateY(0)';
            innerDiv.style.boxShadow = '0 2px 8px rgba(231, 76, 60, 0.3)';
        });

        btn.addEventListener('click', toggleSidebar);

        // Insert at the top of sidebar (after search area if exists)
        const firstChild = sidebar.firstElementChild;
        if (firstChild) {
            sidebar.insertBefore(btn, firstChild);
        } else {
            sidebar.appendChild(btn);
        }

        console.log('✓ WA Sender Button Injected (Sidebar)');
    }
}

function toggleSidebar() {
    let sidebar = document.getElementById('wa-sender-sidebar');
    if (sidebar) {
        if (sidebar.style.right === '0px') {
            sidebar.style.right = '-420px';
        } else {
            sidebar.style.right = '0px';
        }
    } else {
        sidebar = document.createElement('iframe');
        sidebar.id = 'wa-sender-sidebar';
        sidebar.src = chrome.runtime.getURL('popup.html');

        sidebar.style.position = 'fixed';
        sidebar.style.top = '0';
        sidebar.style.right = '0px';
        sidebar.style.width = '400px';
        sidebar.style.height = '100vh';
        sidebar.style.border = 'none';
        sidebar.style.background = 'white';
        sidebar.style.zIndex = '99999';
        sidebar.style.boxShadow = '-2px 0 5px rgba(0,0,0,0.1)';
        sidebar.style.transition = 'right 0.3s ease';

        document.body.appendChild(sidebar);
    }
}

setInterval(injectUI, 2000);
injectUI();
