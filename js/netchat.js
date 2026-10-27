// ============================================================
//  NetChat — in-game multiplayer chat over WebSocket
// ============================================================

const netChat = {
    socket: null,
    connected: false,
    myName: (function() {
        try {
            const saved = localStorage.getItem('playerName');
            if (saved && saved.trim().length > 0) return saved;
        } catch (e) {}
        return 'Survivor' + Math.floor(Math.random() * 100);
    })(),

    messages: [],          // recent chat messages {name, text, time}
    maxVisible: 6,         // how many recent messages to show

    inputOpen: false,      // is the chat input box open?
    inputText: '',         // what the player is currently typing

    // Where the server is. In order:
    //   1. whatever you set with netChat.setServer('192.168.0.14')
    //   2. the machine that served this page — so if everyone opens the game
    //      from the host laptop's address, they all land on the same server
    //   3. localhost, for working on your own
    serverUrl() {
        try {
            const saved = localStorage.getItem('chatServer');
            if (saved && saved.trim()) {
                const h = saved.trim();
                return h.indexOf('ws') === 0 ? h : 'ws://' + h + ':8080/chat';
            }
        } catch (e) {}

        const host = (typeof location !== 'undefined' && location.hostname)
            ? location.hostname : 'localhost';
        if (host && host !== 'localhost' && host !== '127.0.0.1' && host !== '') {
            const secure = (typeof location !== 'undefined' && location.protocol === 'https:');
            return (secure ? 'wss://' : 'ws://') + host + ':8080/chat';
        }
        return 'ws://localhost:8080/chat';
    },

    // Point every laptop at one machine: netChat.setServer('192.168.0.14')
    setServer(host) {
        try { localStorage.setItem('chatServer', host); } catch (e) {}
        this.addSystem('Server set to ' + host + '. Reload to connect.');
    },

    connect() {
        try {
            this.socket = new WebSocket(this.serverUrl());

            this.socket.onopen = () => {
                this.connected = true;
                this.addSystem('Connected to chat.');
            };

            this.socket.onmessage = (event) => {
                const raw = event.data;

                // Try to parse as a JSON death event first
                let death = null;
                try {
                    const obj = JSON.parse(raw);
                    if (obj && obj.type === 'death') death = obj;
                } catch (e) { /* not JSON → it's a normal chat line */ }

                if (death) {
                    this.addDeath(death);
                    return;
                }

                // loot messages from the server
                try {
                    const obj = JSON.parse(raw);
                    if (obj && obj.type === 'lootDropped') { this.addLootPile(obj); return; }
                    if (obj && obj.type === 'lootTaken')   { this.onLootTaken(obj); return; }
                    if (obj && obj.type === 'lootExpired') { this.removeLootPile(obj.id); return; }
                    if (obj && obj.type === 'claimFailed') { this.onClaimFailed(obj); return; }
                    if (obj && obj.type === 'leaderboard') { this.onLeaderboard(obj); return; }
                } catch (e) { /* not JSON */ }

                // Otherwise it's a normal chat message "Name: text"
                const idx = raw.indexOf(': ');
                let name = '', text = raw;
                if (idx !== -1) {
                    name = raw.substring(0, idx);
                    text = raw.substring(idx + 2);
                }
                this.messages.push({ name, text, time: performance.now() });
                if (this.messages.length > 40) this.messages.shift();
            };

            this.socket.onclose = () => {
                this.connected = false;
                this.addSystem('Chat disconnected.');
            };

            this.socket.onerror = () => {
                this.connected = false;
            };
        } catch (e) {
            this.connected = false;
        }
    },

    addSystem(text) {
        this.messages.push({ name: '', text, time: performance.now(), system: true });
        if (this.messages.length > 40) this.messages.shift();
    },

    send(text) {
        if (!text.trim()) return;
        if (this.connected && this.socket) {
            this.socket.send(this.myName + ': ' + text);
        } else {
            // show locally even if offline so the player sees their own text
            this.messages.push({ name: this.myName, text, time: performance.now() });
        }
    },

    // ---- Leaderboard: lowest completion times ----
    leaderboard: [],          // [{name, time}] fastest first, from the server
    myBest: (function() {
        try {
            const v = parseInt(localStorage.getItem('bestTime') || '0', 10);
            return isNaN(v) ? 0 : v;
        } catch (e) { return 0; }
    })(),

    // Ask the server to send the board again (the menu screen calls this).
    requestLeaderboard() {
        if (this.connected && this.socket) {
            this.socket.send(JSON.stringify({ type: 'leaderboardRequest' }));
        }
    },

    onLeaderboard(obj) {
        if (!obj || !Array.isArray(obj.entries)) return;
        this.leaderboard = obj.entries
            .filter(e => e && typeof e.time === 'number')
            .sort((a, b) => a.time - b.time);
    },

    // Called by the game when the player finishes a run.
    sendFinish(seconds) {
        const t = Math.max(1, Math.round(seconds));

        // remember your own best even with no server
        if (this.myBest === 0 || t < this.myBest) {
            this.myBest = t;
            try { localStorage.setItem('bestTime', String(t)); } catch (e) {}
        }

        if (this.connected && this.socket) {
            this.socket.send(JSON.stringify({ type: 'finish', name: this.myName, time: t }));
        } else {
            // offline: at least show yourself on the board
            const mine = this.leaderboard.find(e => e.name === this.myName);
            if (mine) { if (t < mine.time) mine.time = t; }
            else this.leaderboard.push({ name: this.myName, time: t });
            this.leaderboard.sort((a, b) => a.time - b.time);
        }
    },

    formatTime(sec) {
        const m = Math.floor(sec / 60);
        const t = Math.floor(sec % 60);
        return m + ':' + (t < 10 ? '0' : '') + t;
    },

    // ---- Death feed + shared bloodstains ----
    deaths: [],          // recent deaths from all players {name, room, x, y, msg, time}
    maxDeaths: 5,        // keep only the latest 5 in the world
    feed: [],            // death feed lines to display {text, time}

    // Called by the game when THIS player dies (sends room + position)
    sendDeath(room, x, y, msg, loot) {
        const packet = {
            type: 'death',
            name: this.myName,
            room: room,
            x: x, y: y,
            msg: msg || '',
            loot: loot || []
        };
        if (this.connected && this.socket) {
            this.socket.send(JSON.stringify(packet));
        }
    },

    // ---- dropped loot ----
    lootPiles: [],
    pendingClaim: null,      // pile id we've asked the server for
    lootNotice: '', lootNoticeTime: 0,

    addLootPile(obj) {
        if (this.lootPiles.some(p => p.id === obj.id)) return;
        this.lootPiles.push({
            id: obj.id,
            owner: obj.owner || 'Someone',
            room: obj.room || '',
            x: obj.x || 0,
            y: obj.y || 0,
            loot: obj.loot || []
        });
    },

    removeLootPile(id) {
        const i = this.lootPiles.findIndex(p => p.id === id);
        if (i !== -1) this.lootPiles.splice(i, 1);
    },

    lootInRoom(room) {
        return this.lootPiles.filter(p => p.room === room);
    },

    // Ask the server for a pile. The server decides who actually gets it.
    requestClaim(id) {
        if (!this.connected || !this.socket) return false;
        this.pendingClaim = id;
        this.socket.send(JSON.stringify({ type: 'claim', id: id, name: this.myName }));
        return true;
    },

    onLootTaken(obj) {
        this.removeLootPile(obj.id);
        if (obj.by === this.myName && this.pendingClaim === obj.id) {
            this.pendingClaim = null;
            if (typeof gameplayScene !== 'undefined' && gameplayScene.receiveLoot) {
                gameplayScene.receiveLoot(obj.loot || []);
            }
        } else {
            this.lootNotice = obj.by + ' took the loot.';
            this.lootNoticeTime = 3.0;
            if (this.pendingClaim === obj.id) this.pendingClaim = null;
        }
    },

    onClaimFailed(obj) {
        this.removeLootPile(obj.id);
        if (this.pendingClaim === obj.id) this.pendingClaim = null;
        this.lootNotice = 'Someone got there first.';
        this.lootNoticeTime = 3.0;
    },

    // Called when a death event arrives (from anyone, including ourselves)
    addDeath(d) {
        this.deaths.push({
            name: d.name || 'Someone',
            room: d.room || '',
            x: d.x || 0,
            y: d.y || 0,
            msg: d.msg || '',
            time: performance.now()
        });
        // keep only the latest 5 bloodstains in the world
        while (this.deaths.length > this.maxDeaths) this.deaths.shift();

        // add to the death feed
        let line = `${d.name || 'Someone'} died`;
        if (d.room) line += ` in the ${this.roomLabel(d.room)}`;
        this.feed.push({ text: line, msg: d.msg || '', time: performance.now() });
        if (this.feed.length > 8) this.feed.shift();
    },

    roomLabel(room) {
        if (room === 'room1') return 'Ward';
        if (room === 'hallway') return 'Hallway';
        if (room === 'a02') return 'Room A-02';
        if (room === 'lobby') return 'Lobby';
        if (room === 'kitchen') return 'Kitchen';
        if (room === 'lounge') return 'Lounge';
        if (room === 'roof') return 'Roof';
        if (room === 'f3hallway') return 'Floor 3 Corridor';
        if (room === 'f3hallway2') return 'Cell Block';
        if (room === 'f3lobby') return 'Floor 3 Lobby';
        if (room === 'dining') return 'Dining Hall';
        if (room === 'games') return 'Games Room';
        if (room === 'cell1') return 'Cell 1';
        if (room === 'cell2') return 'Cell 2';
        if (room === 'cell3') return 'Cell 3';
        if (room === 'torture') return 'the other room';
        return room;
    },

    // Get other players' death bloodstains for a given room (for the game to draw)
    deathsInRoom(room) {
        return this.deaths.filter(d => d.room === room);
    },

    // Is the player typing their last words on the death screen? While they
    // are, the keyboard belongs to that box and T must not open the chat.
    deathScreenHasKeyboard() {
        return typeof gameplayScene !== 'undefined' && gameplayScene &&
               gameplayScene.isDead === true && gameplayScene.deathWordsSent === false;
    },

    // Called every frame from main.js
    handleInput() {
        const openRequested = !!window.netChatOpenRequest;
        window.netChatOpenRequest = false;

        // T pressed while typing last words: that letter belongs to the death
        // box, not to the chat. input.js turned it into an open-request before
        // the game could see it, so hand it back.
        if (openRequested && this.deathScreenHasKeyboard()) {
            if (!keysPressed['t']) gameplayScene.deathWords += 't';
            return;
        }

        // Open chat with T (the flag is set by input.js)
        if (!this.inputOpen && openRequested) {
            this.inputOpen = true;
            this.inputText = '';
            window.netChatTyping = true;   // tell input.js we're capturing keys
            return;
        }

        if (this.inputOpen) {
            // Send on Enter
            if (keysPressed['enter']) {
                this.send(this.inputText);
                this.inputText = '';
                this.inputOpen = false;
                window.netChatTyping = false;
                return;
            }
            // Cancel on Escape
            if (keysPressed['escape']) {
                this.inputText = '';
                this.inputOpen = false;
                window.netChatTyping = false;
                return;
            }
            // Backspace
            if (keysPressed['backspace']) {
                this.inputText = this.inputText.slice(0, -1);
            }
            // Regular characters (letters, numbers, space, punctuation)
            for (const k in keysPressed) {
                if (k.length === 1 && k !== ' ') {
                    this.inputText += k;
                } else if (k === ' ') {
                    this.inputText += ' ';
                }
            }
            if (this.inputText.length > 100) {
                this.inputText = this.inputText.substring(0, 100);
            }
        }
    },

    // Is the chat capturing keyboard right now? (game checks this to pause movement)
    isTyping() {
        return this.inputOpen;
    },

    draw(ctx) {
        const canvasW = ctx.canvas.width;
        const canvasH = ctx.canvas.height;

        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        // ----- recent messages (bottom-left) -----
        const now = performance.now();
        const visible = this.messages.slice(-this.maxVisible);
        let y = canvasH - (this.inputOpen ? 60 : 30);
        ctx.font = '13px monospace';
        for (let i = visible.length - 1; i >= 0; i--) {
            const m = visible[i];
            // fade older messages when input is closed
            let alpha = 1;
            if (!this.inputOpen) {
                const age = (now - m.time) / 1000;
                alpha = age > 8 ? Math.max(0, 1 - (age - 8) / 3) : 1;
            }
            if (alpha <= 0) { y -= 18; continue; }

            let line;
            let color;
            if (m.system) {
                line = m.text;
                color = `rgba(150, 150, 160, ${alpha})`;
            } else {
                line = m.name ? `${m.name}: ${m.text}` : m.text;
                color = `rgba(230, 230, 230, ${alpha})`;
            }
            // shadow for readability
            ctx.fillStyle = `rgba(0,0,0,${alpha * 0.8})`;
            ctx.fillText(line, 13, y + 1);
            ctx.fillStyle = color;
            ctx.fillText(line, 12, y);
            y -= 18;
        }

        // ----- input box (when open) -----
        if (this.inputOpen) {
            const boxH = 26;
            const boxY = canvasH - boxH - 6;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(8, boxY, canvasW - 16, boxH);
            ctx.strokeStyle = 'rgba(180, 180, 160, 0.9)';
            ctx.lineWidth = 1;
            ctx.strokeRect(8, boxY, canvasW - 16, boxH);

            ctx.fillStyle = '#dddddd';
            ctx.font = '14px monospace';
            const prompt = 'Say: ' + this.inputText;
            ctx.fillText(prompt, 16, boxY + 18);

            // blinking cursor
            if (Math.sin(now / 200) > 0) {
                const w = ctx.measureText(prompt).width;
                ctx.fillRect(16 + w + 2, boxY + 7, 2, 14);
            }
        }

        // ----- death feed (top-right) -----
        this.drawDeathFeed(ctx, canvasW);

        ctx.restore();
    },

    // Death feed panel in the top-right corner
    drawDeathFeed(ctx, canvasW) {
        const now = performance.now();
        ctx.textAlign = 'right';
        ctx.font = '12px monospace';
        let fy = 64;
        for (let i = this.feed.length - 1; i >= 0; i--) {
            const f = this.feed[i];
            const age = (now - f.time) / 1000;
            let alpha = age > 10 ? Math.max(0, 1 - (age - 10) / 3) : 1;
            if (alpha <= 0) continue;
            ctx.fillStyle = `rgba(0,0,0,${alpha * 0.8})`;
            ctx.fillText('+ ' + f.text, canvasW - 11, fy + 1);
            ctx.fillStyle = `rgba(200, 60, 60, ${alpha})`;
            ctx.fillText('+ ' + f.text, canvasW - 12, fy);
            fy += 18;
        }
        ctx.textAlign = 'left';
    }
};

// Connect as soon as the script loads
netChat.connect();