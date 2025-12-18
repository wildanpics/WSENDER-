# 🚀 Wsender PRO
**Automated WhatsApp Bulk Sender - Offline & No License Required**
A powerful Chrome Extension for sending bulk WhatsApp messages with attachments. Perfect for educational institutions, small businesses, and personal use. Completely offline, no server required, and absolutely free!
![Wsender PRO](https://img.shields.io/badge/version-1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Chrome-yellow.svg)
---
## ✨ Features
### 🎯 Core Features
- **📤 Bulk Message Sending** - Send messages to multiple contacts automatically
- **📎 Attachment Support** - Send images, videos, PDFs, and documents
- **📊 CSV Import** - Upload contact lists from CSV files
- **📦 ZIP Attachments** - Batch upload attachments via ZIP file
- **✍️ Manual Input** - Add contacts one by one with custom messages
- **🔄 Message Templates** - Use `{name}` variable for personalization
### 🛡️ Privacy & Security
- **🔒 100% Offline** - All processing happens locally in your browser
- **🚫 No Server** - No data sent to external servers
- **🆓 No License** - Completely free, no subscription required
- **🔐 No API** - Direct interaction with WhatsApp Web DOM
### 🎨 User Experience
- **🎨 Modern UI** - Beautiful gradient design with purple theme
- **📱 Embedded Sidebar** - Integrated directly into WhatsApp Web
- **⏱️ Smart Delays** - Configurable delays to avoid spam detection
- **📋 Queue Management** - View and manage sending queue
- **📈 Progress Tracking** - Real-time progress bar and status
---
## 📦 Installation
### Method 1: Install from Release (Recommended)
1. Download the latest release from [Releases](../../releases)
2. Extract the ZIP file
3. Open Chrome and go to `chrome://extensions/`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked**
6. Select the extracted folder
7. Done! ✅
### Method 2: Clone from GitHub
```bash
git clone https://github.com/yourusername/wsender-pro.git
cd wsender-pro
```
Then follow steps 3-7 from Method 1.
---
## 🚀 Usage Guide
### 1️⃣ Open WhatsApp Web
- Navigate to [web.whatsapp.com](https://web.whatsapp.com)
- Log in with your WhatsApp account
- Look for the **red "Kirim pesan otomatis"** button in the left sidebar
### 2️⃣ Manual Input Mode (Default)
1. Click the red button to open the sidebar
2. Enter phone number (with country code, e.g., `62812345678`)
3. Type your message
4. (Optional) Attach a file
5. Click **"Add to Queue"**
6. Configure delays (min/max in seconds)
7. Click **"Start Sending"**
### 3️⃣ CSV Bulk Mode
1. Switch to **"CSV Upload"** tab
2. Prepare your CSV file with format:
   ```csv
   phone,name,file
   62812345678,John,document.pdf
   62823456789,Jane,image.jpg
   ```
3. Upload CSV file
4. (Optional) Upload ZIP file containing attachments
5. Write message template using `{name}` variable
   - Example: `Hello {name}, here's your document!`
6. Click **"Load to Queue"**
7. Click **"Start Sending"**
---
## 📋 CSV File Format
Your CSV file should have the following columns:
| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| `phone` | Phone number with country code | ✅ Yes | `62812345678` |
| `name` | Contact name (for template variable) | ✅ Yes | `John Doe` |
| `file` | Filename from ZIP (optional) | ❌ No | `invoice.pdf` |
**Example CSV:**
```csv
phone,name,file
62812345678,John Smith,report.pdf
62823456789,Jane Doe,certificate.pdf
62834567890,Bob Johnson,
```
---
## 🎨 Features Overview
### Smart Anti-Ban System
- ✅ Random delays between messages (configurable)
- ✅ One-by-one sending (no batch)
- ✅ Human-like interaction simulation
- ✅ Respects WhatsApp rate limits
### Attachment Handling
- ✅ Images (JPG, PNG, GIF)
- ✅ Videos (MP4, AVI, MOV)
- ✅ Documents (PDF, DOCX, XLSX, PPT)
- ✅ Automatic file type detection
- ✅ Preview before sending
### Queue Management
- ✅ View all pending messages
- ✅ Remove individual items
- ✅ Clear entire queue
- ✅ Progress tracking
- ✅ Pause/Resume functionality
---
## ⚙️ Technical Details
### Technologies Used
- **JavaScript (ES6+)** - Core logic
- **Chrome Extension API** - Manifest V3
- **JSZip** - ZIP file handling
- **WhatsApp Web DOM** - Direct interaction
- **CSS3 Gradients** - Modern UI
### Browser Compatibility
- ✅ Google Chrome (v88+)
- ✅ Microsoft Edge (Chromium)
- ✅ Brave Browser
- ✅ Opera
- ❌ Firefox (not compatible)
### File Structure
```
wa-sender-extension/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── content.js            # WhatsApp Web interaction
├── popup.html            # UI interface
├── popup.js              # UI logic
├── popup.css             # Styling
├── zip.js                # JSZip library
└── icon.png              # Extension icon
```
---
## 🔧 Configuration
### Delay Settings
- **Min Delay:** Minimum time between messages (seconds)
- **Max Delay:** Maximum time between messages (seconds)
- **Recommended:** Min: 5s, Max: 10s
### Phone Number Formats
- **Indonesian:** `62` + number (e.g., `62812345678`)
- **US:** `1` + number (e.g., `14155552671`)
- **UK:** `44` + number (e.g., `447911123456`)
---
## 🐛 Troubleshooting
### Extension not appearing?
1. Refresh WhatsApp Web page
2. Check if extension is enabled in `chrome://extensions/`
3. Reload the extension
### Messages not sending?
1. Make sure you're logged into WhatsApp Web
2. Check phone number format (include country code)
3. Increase delay settings
4. Check browser console for errors
### Attachments not uploading?
1. Ensure file is under 16MB (WhatsApp limit)
2. Check file format is supported
3. For ZIP mode, ensure filenames match CSV
### Button not visible?
1. Reload WhatsApp Web
2. Check if you're on the main chat list page
3. Disable other WhatsApp extensions temporarily
---
## 📝 Best Practices
### ✅ Do's
- Use realistic delays (5-10 seconds minimum)
- Test with 2-3 contacts first
- Keep messages under 1000 characters
- Use proper phone number format
- Stay within WhatsApp's fair use limits
### ❌ Don'ts
- Don't send too fast (risk of ban)
- Don't spam the same message repeatedly
- Don't use for marketing without consent
- Don't exceed 100+ messages per session
- Don't use on shared/public computers
---
## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
---
## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
---
## ⚠️ Disclaimer
This tool is for educational and personal use only. Use responsibly and respect WhatsApp's Terms of Service. The developers are not responsible for any misuse or account bans resulting from improper usage.
**Important:**
- This tool automates WhatsApp Web interactions
- Use at your own risk
- Excessive usage may result in temporary or permanent WhatsApp ban
- Always get consent before sending bulk messages
---
## 👨‍💻 Credits
**Created by:** Wildanpics  
**Version:** 1.0  
**Year:** 2025
---
## 📞 Support
If you encounter any issues or have questions:
- 📧 Open an [Issue](../../issues)
- 💬 Start a [Discussion](../../discussions)
- ⭐ Star this repo if you find it useful!
---
## 🎉 Changelog
### Version 1.0 (Initial Release)
- ✅ Manual input mode
- ✅ CSV bulk upload
- ✅ ZIP attachment support
- ✅ Message templates with variables
- ✅ Queue management
- ✅ Progress tracking
- ✅ Embedded sidebar UI
- ✅ Modern gradient design
- ✅ Smart delay system
- ✅ Offline operation
---
<div align="center">
**Made with ❤️ for the WhatsApp community**
If this project helped you, please consider giving it a ⭐!
</div>
