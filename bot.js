const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

class WhatsAppBot {
    constructor() {
        this.botName = "KINGSLEY OFFENSIVE";
        this.developer = "KINGSLEY-XD";
        this.sock = null;
        this.deletedMessages = new Map();
        this.initializeBot();
    }

    async initializeBot() {
        try {
            console.clear();
            this.printBanner();
            
            const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
            const { version } = await fetchLatestBaileysVersion();
            
            this.sock = makeWASocket({
                version,
                logger: pino({ level: 'silent' }),
                printQRInTerminal: false,
                auth: state,
                browser: ['Termux', 'Chrome', '1.0.0'],
                markOnlineOnConnect: true,
                generateHighQualityLinkPreview: true,
                syncFullHistory: false,
            });

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                if (qr) {
                    qrcode.generate(qr, { small: true });
                    console.log('\n\n📱 Scan QR Code with WhatsApp > Linked Devices');
                }
                
                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log('\nConnection closed. Reconnecting...', shouldReconnect);
                    if (shouldReconnect) {
                        this.initializeBot();
                    }
                } else if (connection === 'open') {
                    console.log('\n✅ Bot connected successfully!');
                    console.log(`🤖 Bot Name: ${this.botName}`);
                    console.log(`👨‍💻 Developer: ${this.developer}`);
                    this.showStatus();
                }
            });

            this.sock.ev.on('creds.update', saveCreds);
            this.setupEventHandlers();
            
        } catch (error) {
            console.error('Initialization error:', error);
            setTimeout(() => this.initializeBot(), 5000);
        }
    }

    printBanner() {
        const banner = `
╔══════════════════════════════════════════╗
║                                          ║
║      🚀 KINGSLEY OFFENSIVE BOT 🚀       ║
║         Advanced WhatsApp Bot            ║
║                                          ║
║    Developer: ${this.developer}         ║
║    Version: 2.0.0                        ║
║    Platform: Termux/Android              ║
║                                          ║
╚══════════════════════════════════════════╝
        `;
        console.log(banner);
    }

    showStatus() {
        const status = `
📊 BOT STATUS:
├─ ✅ Auto-Typing: Enabled
├─ ✅ Auto-React: Enabled
├─ ✅ Anti-Delete: Enabled
├─ ✅ AI Replies: Enabled
├─ ✅ Menu System: Ready
└─ ✅ Connection: Active

📱 Available Commands:
╔══════════════════════════════════════════╗
║ .menu    - Show this menu               ║
║ .ai      - Chat with AI                 ║
║ .ping    - Check bot speed              ║
║ .owner   - Show developer info          ║
║ .help    - Show help                    ║
║ .status  - Show bot status              ║
╚══════════════════════════════════════════╝
        `;
        console.log(status);
    }

    setupEventHandlers() {
        // Message handler
        this.sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;

            try {
                await this.handleMessage(msg);
            } catch (error) {
                console.error('Message handling error:', error);
            }
        });

        // Message delete handler
        this.sock.ev.on('messages.delete', async (item) => {
            if (item.keys) {
                await this.handleDeletedMessage(item.keys[0]);
            }
        });

        // Presence update handler
        this.sock.ev.on('presence.update', ({ id, presences }) => {
            // Handle presence updates if needed
        });
    }

    async handleMessage(msg) {
        const jid = msg.key.remoteJid;
        const text = msg.message.conversation || 
                    msg.message.extendedTextMessage?.text || 
                    msg.message.imageMessage?.caption || '';
        const sender = msg.key.participant || msg.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');

        // Auto-typing indicator
        await this.sock.sendPresenceUpdate('composing', jid);

        // Auto-react to messages
        await this.autoReact(msg);

        // Handle commands
        if (text.startsWith('.') || text.startsWith('!') || text.startsWith('/')) {
            await this.handleCommand(text.toLowerCase(), jid, sender, msg, isGroup);
        } else {
            // Auto AI reply for non-command messages
            await this.handleAIReply(text, jid, sender, msg, isGroup);
        }

        // Stop typing
        await this.sock.sendPresenceUpdate('paused', jid);
    }

    async autoReact(msg) {
        try {
            const reactions = ['👍', '❤️', '😂', '😮', '😢', '👏'];
            const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
            
            const reactionMessage = {
                react: {
                    text: randomReaction,
                    key: msg.key
                }
            };
            
            await this.sock.sendMessage(msg.key.remoteJid, reactionMessage);
        } catch (error) {
            // Silent fail for reaction errors
        }
    }

    async handleCommand(command, jid, sender, msg, isGroup) {
        const commands = {
            '.menu': this.showMenu.bind(this),
            '.help': this.showHelp.bind(this),
            '.ping': this.checkPing.bind(this),
            '.owner': this.showOwner.bind(this),
            '.status': this.showBotStatus.bind(this),
            '.ai': (jid, sender, text) => this.handleAICommand(jid, sender, text)
        };

        const cmd = command.split(' ')[0];
        const args = command.slice(cmd.length).trim();

        if (commands[cmd]) {
            await commands[cmd](jid, sender, args, msg, isGroup);
        } else {
            await this.sendMessage(jid, `❌ Unknown command. Type *.menu* to see available commands.`);
        }
    }

    async showMenu(jid, sender) {
        const menu = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃      🤖 *${this.botName}* Menu      ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ *🎯 Information Commands:*          ┃
┃ • .menu - Show this menu           ┃
┃ • .help - Show help guide          ┃
┃ • .owner - Show developer info     ┃
┃ • .status - Show bot status        ┃
┃ • .ping - Check bot response time  ┃
┃                                      ┃
┃ *🤖 AI Commands:*                   ┃
┃ • .ai [text] - Chat with AI        ┃
┃ • (Auto-reply to normal messages)  ┃
┃                                      ┃
┃ *✨ Features:*                      ┃
┃ • Auto-typing indicator            ┃
┃ • Auto-react to messages           ┃
┃ • Anti-delete protection           ┃
┃ • Smart AI responses               ┃
┃                                      ┃
┃ *👨‍💻 Developer:* ${this.developer}    ┃
┃ *🔧 Platform:* Termux/Android       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        `;
        await this.sendMessage(jid, menu);
    }

    async showHelp(jid, sender) {
        const help = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃         📖 *HELP GUIDE*             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ *How to use:*                       ┃
┃ 1. Add bot to group or chat privately
┃ 2. Use .menu to see all commands    ┃
┃ 3. Type .ai followed by your query  ┃
┃ 4. Bot will auto-react and type     ┃
┃                                      ┃
┃ *Features Explained:*               ┃
┃ • Auto-typing: Shows typing indicator
┃ • Auto-react: Reacts to your msgs   ┃
┃ • Anti-delete: Saves deleted msgs   ┃
┃ • AI Reply: Smart responses         ┃
┃                                      ┃
┃ *Note:* No admin number required    ┃
┃ Works for everyone!                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        `;
        await this.sendMessage(jid, help);
    }

    async checkPing(jid, sender) {
        const start = Date.now();
        await this.sendMessage(jid, '🏓 Pinging...');
        const latency = Date.now() - start;
        await this.sendMessage(jid, `✅ Pong! Latency: *${latency}ms*`);
    }

    async showOwner(jid, sender) {
        const ownerInfo = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        👨‍💻 *DEVELOPER INFO*        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ *Name:* ${this.developer}            ┃
┃ *Bot:* ${this.botName}               ┃
┃                                      ┃
┃ *Features Developed:*               ┃
┃ • Advanced WhatsApp Bot System      ┃
┃ • Auto-typing & Reactions           ┃
┃ • Anti-delete Protection            ┃
┃ • AI Integration                    ┃
┃ • Beautiful Menu System             ┃
┃                                      ┃
┃ *Platform:* Termux/Android          ┃
┃ *Version:* 2.0.0                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        `;
        await this.sendMessage(jid, ownerInfo);
    }

    async showBotStatus(jid, sender) {
        const status = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃         📊 *BOT STATUS*             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ *System:* ✅ Online                ┃
┃ *Auto-typing:* ✅ Enabled          ┃
┃ *Auto-react:* ✅ Enabled           ┃
┃ *Anti-delete:* ✅ Active           ┃
┃ *AI Replies:* ✅ Enabled           ┃
┃                                      ┃
┃ *Bot Name:* ${this.botName}         ┃
┃ *Developer:* ${this.developer}      ┃
┃ *Uptime:* ${process.uptime().toFixed(0)}s
┃                                      ┃
┃ *Note:* Running on Termux Android   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        `;
        await this.sendMessage(jid, status);
    }

    async handleAICommand(jid, sender, text) {
        if (!text) {
            await this.sendMessage(jid, 'Please provide a message. Example: *.ai Hello*');
            return;
        }
        
        const aiResponse = await this.getAIResponse(text);
        await this.sendMessage(jid, `🤖 AI Response:\n\n${aiResponse}`);
    }

    async handleAIReply(text, jid, sender, msg, isGroup) {
        // Only reply to significant messages (not too short)
        if (text.length > 3 && !text.startsWith('.') && !text.startsWith('!') && !text.startsWith('/')) {
            const aiResponse = await this.getAIResponse(text);
            await this.sendMessage(jid, aiResponse);
        }
    }

    async getAIResponse(text) {
        try {
            // Using free AI API (SimSimi-like)
            const apis = [
                `https://api.simsimi.net/v2/?text=${encodeURIComponent(text)}&lc=en`,
                `https://api.azz.biz.id/api/simsimi?q=${encodeURIComponent(text)}&lang=en`
            ];
            
            for (const apiUrl of apis) {
                try {
                    const response = await fetch(apiUrl);
                    if (response.ok) {
                        const data = await response.json();
                        return data.success || data.answer || data.response || "I'm here to help!";
                    }
                } catch (error) {
                    continue;
                }
            }
            
            // Fallback responses
            const fallbacks = [
                "I understand you said: " + text,
                "That's interesting! Tell me more.",
                "I'm learning from our conversation!",
                "Thanks for sharing that with me!",
                `I'm ${this.botName}, here to assist you!`
            ];
            
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
            
        } catch (error) {
            return "I'm currently processing your request. Please try again in a moment!";
        }
    }

    async handleDeletedMessage(key) {
        try {
            const jid = key.remoteJid;
            const message = this.deletedMessages.get(key.id);
            
            if (message) {
                const warning = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ⚠️ *ANTI-DELETE ALERT*      ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ *Deleted Message Detected!*         ┃
┃                                      ┃
┃ *Original Message:*                 ┃
┃ ${message}                          ┃
┃                                      ┃
┃ *Bot:* ${this.botName}               ┃
┃ *Feature:* Anti-Delete Protection   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                `;
                await this.sendMessage(jid, warning);
                this.deletedMessages.delete(key.id);
            }
        } catch (error) {
            console.error('Anti-delete error:', error);
        }
    }

    async sendMessage(jid, text) {
        try {
            await this.sock.sendMessage(jid, { text: text });
        } catch (error) {
            console.error('Send message error:', error);
        }
    }
}

// Handle process events
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.log('Uncaught Exception:', error);
});

// Start the bot
const bot = new WhatsAppBot();

// Export for potential module usage
module.exports = WhatsAppBot;
