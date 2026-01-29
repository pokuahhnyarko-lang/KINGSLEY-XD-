# KINGSLEY-XD 👑👑
Installation Instructions for Termux:

1. First, update Termux:

```bash
pkg update && pkg upgrade
pkg install nodejs git -y
```
```bash
git clone git clone https://github.com/pokuahhnyarko-lang/KINGSLEY-XD-.git
cd KINGSLEY-XD-
```
1. Initialize npm and install dependencies:

```bash
npm init -y
npm install @whiskeysockets/baileys qrcode-terminal pino
```
1. Run the bot:

```bash
node bot.js
```
1. Scan the QR code with WhatsApp (Linked Devices)

Features Included:
1. Auto-Typing ✓ - Shows typing indicator when processing
2. Auto-React ✓ - Random reactions to messages
3. Anti-Delete ✓ - Detects and reports deleted messages
4. AI Auto-Replies ✓ - Using free AI APIs
5. Beautiful Menu ✓ - Well-formatted ASCII menu
6. No Admin Required ✓ - Works for everyone
7. Termux Optimized ✓ - Lightweight for Android

Commands Available:
· .menu - Show bot menu
· .help - Help guide
· .owner - Developer info
· .status - Bot status
· .ping - Check latency
· .ai [text] - Chat with AI

Notes:

· The bot uses free AI APIs with fallback responses
· No external dependencies except pino and qrcode-terminal
· Optimized for Termux on Android
· Error handling included
· Clean ASCII interface

The bot will automatically reconnect if disconnected and maintains session data in the auth_info folder.![Screenshot_20260128_213742_Termux](https://github.com/user-attachments/assets/5be94227-0539-4e25-b4e6-e470c00cba48)
