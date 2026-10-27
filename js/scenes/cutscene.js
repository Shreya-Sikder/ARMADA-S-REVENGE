// ============================================================
//  Opening Cutscene — The Interview
//  Black screen and a dialogue box. Nothing else: the room, the
//  table and both men are left to the player's imagination, which
//  does a better job of them than we can.
// ============================================================

const cutsceneScene = {
    lines: [
        { speaker: 'Sadid',  text: "Mr. Novikov. My name is Sadid. I've been assigned to your case." },
        { speaker: 'Armada', text: "...They told me someone would come. A long time ago." },
        { speaker: 'Sadid',  text: "I apologize for the delay. The paperwork on you is... unusual." },
        { speaker: 'Armada', text: "Paperwork. That's a kind word for it." },
        { speaker: '',       text: "*He doesn't look up. His hands are chained to the table.*" },
        { speaker: 'Sadid',  text: "I just want to talk. That's all." },
        { speaker: 'Armada', text: "Everyone says that. At first." },
        { speaker: 'Sadid',  text: "I'd like to ask you about your military service. The eastern campaign." },
        { speaker: 'Armada', text: "I don't talk about that." },
        { speaker: 'Sadid',  text: "The records say you were decorated. Then something happened." },
        { speaker: 'Armada', text: "Records are paper. Paper burns." },
        { speaker: 'Sadid',  text: "Your unit. The men who served under you." },
        { speaker: 'Armada', text: "They're dead. Next question." },
        { speaker: 'Sadid',  text: "And the village in the report?" },
        { speaker: '',       text: "*Armada finally looks up. His voice goes quieter — more dangerous.*" },
        { speaker: 'Armada', text: "I said I don't talk about that." },
        { speaker: 'Sadid',  text: "There are accounts of what was done there. To the prisoners. To the families." },
        { speaker: 'Armada', text: "...you weren't there." },
        { speaker: 'Sadid',  text: "I'm trying to understand." },
        { speaker: 'Armada', text: "Cold floor. Concrete. A bag over my head. That's understanding." },
        { speaker: '',       text: "*Sadid pauses. Writes something down. Doesn't catch it.*" },
        { speaker: 'Sadid',  text: "I'm sorry?" },
        { speaker: 'Armada', text: "Nothing. Move on." },
        { speaker: 'Sadid',  text: "Then let's talk about before the war. Your wife." },
        { speaker: '',       text: "*Armada's voice changes. Softer.*" },
        { speaker: 'Armada', text: "...Elena." },
        { speaker: 'Sadid',  text: "Yes. Elena." },
        { speaker: 'Armada', text: "She died. A long time ago. Childbirth." },
        { speaker: 'Sadid',  text: "I'm sorry." },
        { speaker: 'Armada', text: "Don't be. She was the kindest part of my life. That's all that matters." },
        { speaker: 'Sadid',  text: "And your daughter?" },
        { speaker: '',       text: "*Long silence. Armada's chains creak as his hands tighten.*" },
        { speaker: 'Armada', text: "...what about her?" },
        { speaker: 'Sadid',  text: "Her name was Nikki, yes?" },
        { speaker: 'Armada', text: "...Nikki." },
        { speaker: 'Sadid',  text: "The file says she was last seen in Moscow. Late 2003." },
        { speaker: 'Armada', text: "Stop." },
        { speaker: 'Sadid',  text: "Mr. Novikov, I'm just trying to understand what happened to her —" },
        { speaker: 'Armada', text: "I said stop.", shake: 0.2 },
        { speaker: 'Sadid',  text: "Did you ever find her? After everything that happened?" },
        { speaker: 'Armada', text: "...don't." },
        { speaker: 'Sadid',  text: "The records suggest she may still be —" },
        { speaker: 'Armada', text: "SHE'S DEAD.", shake: 0.5 },
        { speaker: '',       text: "*Sadid flinches. The clipboard shakes in his hand.*" },
        { speaker: 'Sadid',  text: "I... I'm sorry, I didn't —" },
        { speaker: 'Armada', text: "They told me. After a month. They told me. With the bag still on my head." },
        { speaker: '',       text: "*Sadid stops writing.*" },
        { speaker: 'Sadid',  text: "...Mr. Novikov, I don't think I —" },
        { speaker: 'Armada', text: "You don't think. You don't know. NONE OF YOU KNOW.", shake: 0.6 },
        { speaker: 'Sadid',  text: "Please calm down —" },
        { speaker: 'Armada', text: "I REMEMBER NOW.", shake: 0.9, snap: true },
        { speaker: '',       text: "*The chains snap. He stands. The light overhead bursts.*", shake: 1.0 },
        { speaker: 'Armada', text: "I REMEMBER ALL OF IT.", shake: 1.0, fade: true }
    ],

    lineIndex: 0,
    charsShown: 0,
    charSpeed: 32,
    shakeAmount: 0,
    fadeAmount: 0,
    fadingOut: false,
    time: 0,
    skipHover: false,
    skipConfirmTimer: 0,
    snapTriggered: false,

    skipButton: { x: 800, y: 14, w: 144, h: 28 },

    onEnter() {
        this.lineIndex = 0;
        this.charsShown = 0;
        this.shakeAmount = 0;
        this.fadeAmount = 0;
        this.fadingOut = false;
        this.time = 0;
        this.skipConfirmTimer = 0;
        this.snapTriggered = false;
    },

    update(dt) {
        this.time += dt;
        this.shakeAmount *= 0.88;
        if (this.skipConfirmTimer > 0) this.skipConfirmTimer -= dt;

        const sb = this.skipButton;
        this.skipHover = pointInRect(mouse.x, mouse.y, sb.x, sb.y, sb.w, sb.h);
        if (mouse.clicked && this.skipHover) {
            if (this.skipConfirmTimer > 0) {
                this.beginFadeOut();
            } else {
                this.skipConfirmTimer = 3.0;
            }
            return;
        }

        if (this.fadingOut) {
            this.fadeAmount += dt * 0.4;
            if (this.fadeAmount >= 1.6) {
                changeScene(gameplayScene);
            }
            return;
        }

        const line = this.lines[this.lineIndex];

        if (this.charsShown < line.text.length) {
            this.charsShown += this.charSpeed * dt;
            if (this.charsShown >= line.text.length) {
                this.charsShown = line.text.length;
                if (line.shake) this.shakeAmount = line.shake * 24;
                if (line.snap) this.snapTriggered = true;
            }
        }

        const advancePressed = mouse.clicked || keysPressed[' '] || keysPressed['enter'];
        if (advancePressed) {
            if (this.charsShown < line.text.length) {
                this.charsShown = line.text.length;
                if (line.shake) this.shakeAmount = line.shake * 24;
                if (line.snap) this.snapTriggered = true;
            } else {
                if (this.lineIndex < this.lines.length - 1) {
                    this.lineIndex++;
                    this.charsShown = 0;
                } else {
                    if (line.fade) this.beginFadeOut();
                }
            }
        }
    },

    beginFadeOut() {
        this.fadingOut = true;
    },

    draw(ctx) {
        // ---- black, and only black ----
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        if (this.shakeAmount > 0.3) {
            ctx.translate(
                (Math.random() - 0.5) * this.shakeAmount,
                (Math.random() - 0.5) * this.shakeAmount
            );
        }

        // once the chains go, the dark gets a red cast
        if (this.snapTriggered) {
            const pulse = 0.10 + Math.sin(this.time * 4) * 0.05;
            ctx.fillStyle = `rgba(60, 0, 0, ${pulse})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const line = this.lines[this.lineIndex];
        const boxW = 760, boxH = 190;
        const boxX = canvas.width / 2 - boxW / 2;
        const boxY = canvas.height / 2 - boxH / 2;

        ctx.fillStyle = 'rgba(8, 6, 6, 0.95)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = this.snapTriggered ? '#7a0000' : '#3a3028';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // speaker
        if (line.speaker) {
            ctx.fillStyle = line.speaker === 'Armada' ? '#dd2222' : '#d0c98c';
            ctx.font = 'bold 17px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(line.speaker.toUpperCase(), boxX + 26, boxY + 38);
            ctx.fillStyle = 'rgba(120, 110, 95, 0.35)';
            ctx.fillRect(boxX + 26, boxY + 48, boxW - 52, 1);
        }

        // the line itself
        ctx.fillStyle = line.speaker ? '#dddddd' : '#8a8a8a';
        ctx.font = line.speaker ? '17px monospace' : 'italic 16px monospace';
        ctx.textAlign = 'left';
        const visibleText = line.text.substring(0, Math.floor(this.charsShown));
        wrapText(ctx, visibleText, boxX + 26, boxY + (line.speaker ? 78 : 64), boxW - 52, 24);

        // how far through the interview we are
        ctx.fillStyle = 'rgba(90, 80, 70, 0.5)';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText((this.lineIndex + 1) + ' / ' + this.lines.length,
                     boxX + 26, boxY + boxH - 16);

        if (this.charsShown >= line.text.length && !this.fadingOut) {
            if (Math.floor(performance.now() / 500) % 2 === 0) {
                ctx.fillStyle = '#888888';
                ctx.font = '12px monospace';
                ctx.textAlign = 'right';
                ctx.fillText('▼ click / space', boxX + boxW - 26, boxY + boxH - 16);
            }
        }

        ctx.restore();

        // ---- skip ----
        const sb = this.skipButton;
        const showConfirm = this.skipConfirmTimer > 0;
        const sbHover = this.skipHover;
        ctx.fillStyle = sbHover ? 'rgba(50, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(sb.x, sb.y, sb.w, sb.h);
        ctx.strokeStyle = sbHover ? '#aa0000' : '#3a3a3a';
        ctx.lineWidth = 1;
        ctx.strokeRect(sb.x, sb.y, sb.w, sb.h);

        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = showConfirm ? '#ff5555' : (sbHover ? '#cc2222' : '#888888');
        ctx.fillText(showConfirm ? 'CLICK AGAIN TO SKIP' : 'SKIP CUTSCENE',
                     sb.x + sb.w / 2, sb.y + sb.h / 2);
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';

        if (this.fadeAmount > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(this.fadeAmount, 1)})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
};