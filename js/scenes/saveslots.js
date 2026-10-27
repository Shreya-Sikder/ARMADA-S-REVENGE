// ============================================================
//  Save Slot Scene
// ============================================================

const saveSlotsScene = {
    mode: 'new',

    time: 0,
    titleFlicker: 1.0,
    slotRects: [],

    saveNameInput: '',
    typingActive: false,
    cursorBlink: 0,
    selectedSlotForNaming: -1,
    confirmingOverwrite: false,
    pendingSlotForOverwrite: -1,

    backButton: { x: 380, y: 540, w: 200, h: 42 },
    keyHandler: null,

    onEnter() {
        this.time = 0;
        this.saveNameInput = this.makeDefaultSaveName();
        this.typingActive = false;
        this.selectedSlotForNaming = -1;
        this.confirmingOverwrite = false;
        this.pendingSlotForOverwrite = -1;

        const slotW = 600, slotH = 90, gap = 18;
        const startY = 200;
        const startX = (canvas.width - slotW) / 2;
        this.slotRects = [];
        for (let i = 0; i < 3; i++) {
            this.slotRects.push({
                index: i + 1,
                x: startX,
                y: startY + i * (slotH + gap),
                w: slotW,
                h: slotH
            });
        }

        this.keyHandler = (e) => {
            if (!this.typingActive) return;
            if (e.key === 'Backspace') {
                this.saveNameInput = this.saveNameInput.slice(0, -1);
                e.preventDefault();
            } else if (e.key === 'Enter') {
                this.confirmName();
                e.preventDefault();
            } else if (e.key === 'Escape') {
                this.cancelTyping();
                e.preventDefault();
            } else if (e.key.length === 1 && this.saveNameInput.length < 24) {
                this.saveNameInput += e.key;
            }
        };
        window.addEventListener('keydown', this.keyHandler);
    },

    onExit() {
        if (this.keyHandler) {
            window.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
    },

    makeDefaultSaveName() {
        const d = new Date();
        const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
        return `SADID ${months[d.getMonth()]} ${d.getDate()}`;
    },

    update(dt) {
        this.time += dt;
        this.titleFlicker = 0.82 + Math.random() * 0.18;
        if (Math.random() < 0.02) this.titleFlicker = 0.5;
        this.cursorBlink += dt;

        if (keysPressed['escape']) {
            if (this.typingActive || this.confirmingOverwrite) {
                this.cancelTyping();
            } else {
                changeScene(menuScene);
            }
            return;
        }

        if (mouse.clicked) {
            const b = this.backButton;
            if (pointInRect(mouse.x, mouse.y, b.x, b.y, b.w, b.h)) {
                this.cancelTyping();
                changeScene(menuScene);
                return;
            }

            if (this.confirmingOverwrite) {
                this.handleOverwriteClick();
                return;
            }

            if (this.typingActive) {
                this.confirmName();
                return;
            }

            for (const slot of this.slotRects) {
                if (pointInRect(mouse.x, mouse.y, slot.x, slot.y, slot.w, slot.h)) {
                    this.handleSlotClick(slot.index);
                    break;
                }
            }
        }
    },

    handleSlotClick(slotNumber) {
        const existing = getSave(slotNumber);

        if (this.mode === 'load') {
            if (existing) {
                setActiveSlot(slotNumber);
                // A game in progress goes straight back in; a slot that was
                // created but never played still gets the intro.
                changeScene(existing.state ? gameplayScene : cutsceneScene);
            }
            return;
        }

        if (existing) {
            this.confirmingOverwrite = true;
            this.pendingSlotForOverwrite = slotNumber;
        } else {
            this.selectedSlotForNaming = slotNumber;
            this.saveNameInput = this.makeDefaultSaveName();
            this.typingActive = true;
        }
    },

    handleOverwriteClick() {
        const cw = 120, ch = 36;
        const yes = { x: canvas.width / 2 - cw - 20, y: 460, w: cw, h: ch };
        const no  = { x: canvas.width / 2 + 20,       y: 460, w: cw, h: ch };

        if (pointInRect(mouse.x, mouse.y, yes.x, yes.y, yes.w, yes.h)) {
            this.selectedSlotForNaming = this.pendingSlotForOverwrite;
            this.confirmingOverwrite = false;
            this.pendingSlotForOverwrite = -1;
            this.saveNameInput = this.makeDefaultSaveName();
            this.typingActive = true;
        } else if (pointInRect(mouse.x, mouse.y, no.x, no.y, no.w, no.h)) {
            this.confirmingOverwrite = false;
            this.pendingSlotForOverwrite = -1;
        }
    },

    confirmName() {
        if (this.selectedSlotForNaming === -1) {
            this.cancelTyping();
            return;
        }
        const name = this.saveNameInput.trim() || this.makeDefaultSaveName();
        createNewSave(this.selectedSlotForNaming, name);
        this.typingActive = false;
        this.selectedSlotForNaming = -1;
        changeScene(cutsceneScene);
    },

    cancelTyping() {
        this.typingActive = false;
        this.selectedSlotForNaming = -1;
        this.confirmingOverwrite = false;
        this.pendingSlotForOverwrite = -1;
    },

    drawBloodyText(ctx, text, x, y, fontSize) {
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#5a0000';
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#1a0000';
        ctx.fillText(text, x + 2, y + 2);
        ctx.fillStyle = '#5a0000';
        ctx.fillText(text, x + 1, y + 1);
        ctx.fillStyle = '#dd0000';
        ctx.fillText(text, x, y);
        ctx.fillStyle = 'rgba(255, 80, 80, 0.6)';
        ctx.fillText(text, x - 1, y - 1);
    },

    draw(ctx) {
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const vignette = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 60,
            canvas.width / 2, canvas.height / 2, 500
        );
        vignette.addColorStop(0, 'rgba(70, 0, 0, 0.25)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 80; i++) {
            ctx.fillStyle = `rgba(60, 0, 0, ${Math.random() * 0.3})`;
            ctx.fillRect(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                2, 2
            );
        }

        ctx.save();
        ctx.globalAlpha = this.titleFlicker;
        ctx.textAlign = 'center';
        ctx.font = 'bold 42px "Times New Roman", serif';

        const tx = canvas.width / 2;
        const ty = 80;
        const titleText = this.mode === 'load' ? 'LOAD GAME' : 'CREATE NEW SAVE';

        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#660000';
        ctx.fillText(titleText, tx, ty);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#1a0000';
        ctx.fillText(titleText, tx + 4, ty + 5);
        ctx.fillStyle = '#5a0000';
        ctx.fillText(titleText, tx + 2, ty + 3);
        ctx.fillStyle = '#cc0000';
        ctx.fillText(titleText, tx, ty);
        ctx.fillStyle = 'rgba(255, 60, 60, 0.5)';
        ctx.fillText(titleText, tx - 1, ty - 1);
        ctx.restore();

        ctx.fillStyle = '#666666';
        ctx.font = 'italic 14px serif';
        ctx.textAlign = 'center';
        const subtitle = this.mode === 'load' ? '— select a save to continue —' : '— select a slot —';
        ctx.fillText(subtitle, canvas.width / 2, 130);

        for (const slot of this.slotRects) {
            const existing = getSave(slot.index);
            const isHover = !this.typingActive && !this.confirmingOverwrite &&
                            pointInRect(mouse.x, mouse.y, slot.x, slot.y, slot.w, slot.h);
            const dimmed = this.mode === 'load' && !existing;

            ctx.fillStyle = dimmed ? '#080808' : (isHover ? '#1a0000' : '#0c0c0c');
            ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
            ctx.strokeStyle = dimmed ? '#222' : (isHover ? '#aa0000' : '#3a3a3a');
            ctx.lineWidth = 2;
            ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);

            ctx.fillStyle = dimmed ? '#444' : '#666';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`SLOT ${slot.index}`, slot.x + 16, slot.y + 22);

            if (existing) {
                ctx.fillStyle = isHover ? '#ff5555' : '#dddddd';
                ctx.font = 'bold 22px monospace';
                ctx.fillText(existing.name, slot.x + 16, slot.y + 50);

                ctx.fillStyle = '#888';
                ctx.font = '12px monospace';
                ctx.fillText(`FLOOR ${existing.floor}   ·   LAST SAVED ${formatSaveDate(existing.lastSavedAt)}`, slot.x + 16, slot.y + 75);
            } else {
                ctx.fillStyle = dimmed ? '#333' : (isHover ? '#cc2222' : '#666');
                ctx.font = 'italic 22px monospace';
                ctx.fillText('— EMPTY —', slot.x + 16, slot.y + 56);
            }
        }

        if (this.typingActive) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const boxW = 540, boxH = 130;
            const boxX = (canvas.width - boxW) / 2;
            const boxY = 220;

            ctx.fillStyle = '#0a0000';
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeStyle = '#aa0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            ctx.fillStyle = '#ddd';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('NAME YOUR SAVE', boxX + 18, boxY + 28);

            const fX = boxX + 18, fY = boxY + 50, fW = boxW - 36, fH = 38;
            ctx.fillStyle = '#000';
            ctx.fillRect(fX, fY, fW, fH);
            ctx.strokeStyle = '#7a0000';
            ctx.lineWidth = 1;
            ctx.strokeRect(fX, fY, fW, fH);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px monospace';
            ctx.textBaseline = 'middle';
            const showCursor = Math.floor(this.cursorBlink * 2) % 2 === 0;
            const display = this.saveNameInput + (showCursor ? '_' : ' ');
            ctx.fillText(display, fX + 10, fY + fH / 2);
            ctx.textBaseline = 'alphabetic';

            ctx.fillStyle = '#666';
            ctx.font = '11px monospace';
            ctx.fillText('TYPE NAME · ENTER to confirm · ESC to cancel', boxX + 18, boxY + boxH - 12);
        }

        if (this.confirmingOverwrite) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const boxW = 560, boxH = 200;
            const boxX = (canvas.width - boxW) / 2;
            const boxY = 230;

            ctx.fillStyle = '#0a0000';
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeStyle = '#aa0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            ctx.fillStyle = '#ff5555';
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('OVERWRITE THIS SAVE?', canvas.width / 2, boxY + 40);

            ctx.fillStyle = '#bbb';
            ctx.font = '14px monospace';
            ctx.fillText('This will permanently erase your existing save.', canvas.width / 2, boxY + 80);
            ctx.fillText('You cannot undo this.', canvas.width / 2, boxY + 102);

            const cw = 120, ch = 36;
            const yes = { x: canvas.width / 2 - cw - 20, y: 460, w: cw, h: ch };
            const no  = { x: canvas.width / 2 + 20,       y: 460, w: cw, h: ch };

            const yesH = pointInRect(mouse.x, mouse.y, yes.x, yes.y, yes.w, yes.h);
            const noH  = pointInRect(mouse.x, mouse.y, no.x,  no.y,  no.w,  no.h);

            ctx.fillStyle = yesH ? '#5a0000' : '#0c0c0c';
            ctx.fillRect(yes.x, yes.y, yes.w, yes.h);
            ctx.strokeStyle = yesH ? '#ff2222' : '#aa0000';
            ctx.strokeRect(yes.x, yes.y, yes.w, yes.h);
            ctx.fillStyle = yesH ? '#ff5555' : '#cc2222';
            ctx.font = 'bold 16px monospace';
            ctx.textBaseline = 'middle';
            ctx.fillText('OVERWRITE', yes.x + yes.w / 2, yes.y + yes.h / 2);

            ctx.fillStyle = noH ? '#1a1a1a' : '#0c0c0c';
            ctx.fillRect(no.x, no.y, no.w, no.h);
            ctx.strokeStyle = noH ? '#aaa' : '#3a3a3a';
            ctx.strokeRect(no.x, no.y, no.w, no.h);
            ctx.fillStyle = noH ? '#ddd' : '#888';
            ctx.fillText('CANCEL', no.x + no.w / 2, no.y + no.h / 2);

            ctx.textBaseline = 'alphabetic';
        }

        const b = this.backButton;
        const backHover = !this.typingActive && !this.confirmingOverwrite &&
                          pointInRect(mouse.x, mouse.y, b.x, b.y, b.w, b.h);

        ctx.fillStyle = '#0c0c0c';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = backHover ? '#5a0000' : '#3a3a3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        const lx = b.x + b.w / 2;
        const ly = b.y + b.h / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (backHover) {
            this.drawBloodyText(ctx, 'BACK', lx, ly, 22);
        } else {
            ctx.font = 'bold 20px monospace';
            ctx.fillStyle = '#999';
            ctx.fillText('BACK', lx, ly);
        }
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
    }
};