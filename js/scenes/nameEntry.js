// ============================================================
//  Name Entry — one-time screen to set the player's name
// ============================================================

const nameEntryScene = {
    typed: '',
    maxLen: 16,
    blink: 0,

    onEnter() {
        this.typed = '';
        this.blink = 0;
    },

    update(dt) {
        this.blink += dt;

        // Confirm with Enter
        if (keysPressed['enter']) {
            let name = this.typed.trim();
            if (name.length === 0) {
                name = 'Survivor' + Math.floor(Math.random() * 100);
            }
            // Save it in the browser so returning players skip this screen
            try { localStorage.setItem('playerName', name); } catch (e) {}
            // Tell the chat system the name
            if (typeof netChat !== 'undefined') netChat.myName = name;
            // Move on to the main menu
            changeScene(menuScene);
            return;
        }

        // Backspace
        if (keysPressed['backspace']) {
            this.typed = this.typed.slice(0, -1);
        }

        // Add typed characters (letters, numbers, space, simple punctuation)
        for (const k in keysPressed) {
            if (k === 'backspace' || k === 'enter' || k === 'shift' ||
                k === 'control' || k === 'alt' || k === 'capslock' ||
                k === 'tab' || k === 'escape') continue;
            if (k.length === 1) {
                if (this.typed.length < this.maxLen) this.typed += k;
            }
        }
    },

    draw(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // dark background
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, w, h);

        // faint blood tint at edges for mood
        const grad = ctx.createRadialGradient(w / 2, h / 2, 150, w / 2, h / 2, 500);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(60,0,0,0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // title
        ctx.fillStyle = '#c0392b';
        ctx.font = 'bold 40px "Times New Roman"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("ARMADA'S REVENGE", w / 2, h / 2 - 120);

        // prompt
        ctx.fillStyle = '#cccccc';
        ctx.font = '20px monospace';
        ctx.fillText('Enter your name, survivor:', w / 2, h / 2 - 40);

        // input box
        const boxW = 360, boxH = 44;
        const boxX = w / 2 - boxW / 2;
        const boxY = h / 2 - boxH / 2 + 10;
        ctx.fillStyle = 'rgba(20,20,24,0.9)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#8a2020';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // typed text
        ctx.fillStyle = '#ffffff';
        ctx.font = '22px monospace';
        ctx.textAlign = 'left';
        const displayText = this.typed;
        ctx.fillText(displayText, boxX + 14, boxY + boxH / 2);

        // blinking cursor
        if (Math.sin(this.blink * 6) > 0) {
            const tw = ctx.measureText(displayText).width;
            ctx.fillRect(boxX + 14 + tw + 2, boxY + 10, 2, boxH - 20);
        }

        // hint
        ctx.fillStyle = '#777777';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Press ENTER to continue', w / 2, h / 2 + 80);

        // char count
        ctx.fillStyle = '#555555';
        ctx.font = '12px monospace';
        ctx.fillText(this.typed.length + ' / ' + this.maxLen, w / 2, boxY + boxH + 20);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }
};