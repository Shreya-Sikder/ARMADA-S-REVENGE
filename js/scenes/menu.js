// ============================================================
//  Main Menu Scene
// ============================================================

const menuScene = {
    time: 0,
    titleFlicker: 1.0,
    loadGameMessage: '',
    loadMessageTimer: 0,
    nextFlickerAt: 5,
    flickerActive: 0,
    screenDim: 1.0,

    buttons: [
        { label: 'NEW GAME',    x: 380, y: 320, w: 200, h: 44, action: 'new'         },
        { label: 'LOAD GAME',   x: 380, y: 372, w: 200, h: 44, action: 'load'        },
        { label: 'LEADERBOARD', x: 380, y: 424, w: 200, h: 44, action: 'leaderboard' },
        { label: 'SETTINGS',    x: 380, y: 476, w: 200, h: 44, action: 'settings'    },
        { label: 'QUIT',        x: 380, y: 528, w: 200, h: 44, action: 'quit'        }
    ],

    onEnter() {
        this.time = 0;
        this.loadGameMessage = '';
        this.loadMessageTimer = 0;
        this.nextFlickerAt = 5;
        this.flickerActive = 0;
        this.screenDim = 1.0;
    },

    update(dt) {
        this.time += dt;

        this.titleFlicker = 0.78 + Math.random() * 0.22;
        if (Math.random() < 0.03) this.titleFlicker = 0.45;

        this.nextFlickerAt -= dt;
        if (this.nextFlickerAt <= 0) {
            this.flickerActive = 0.45;
            this.nextFlickerAt = 5 + Math.random() * 1.5;
        }

        if (this.flickerActive > 0) {
            this.flickerActive -= dt;
            const r = Math.random();
            if (r < 0.55)      this.screenDim = 0.08;
            else if (r < 0.80) this.screenDim = 0.30;
            else if (r < 0.95) this.screenDim = 0.85;
            else               this.screenDim = 1.0;
        } else {
            this.screenDim += (1.0 - this.screenDim) * 0.2;
        }

        if (this.loadMessageTimer > 0) this.loadMessageTimer -= dt;

        if (mouse.clicked) {
            for (const btn of this.buttons) {
                if (pointInRect(mouse.x, mouse.y, btn.x, btn.y, btn.w, btn.h)) {
                    this.handleButton(btn.action);
                }
            }
        }
    },

    handleButton(action) {
        if (action === 'new') {
            saveSlotsScene.mode = 'new';
            changeScene(saveSlotsScene);
        } else if (action === 'load') {
            const allSaves = loadAllSaves();
            const anyExists = allSaves.slot1 || allSaves.slot2 || allSaves.slot3;
            if (anyExists) {
                saveSlotsScene.mode = 'load';
                changeScene(saveSlotsScene);
            } else {
                this.loadGameMessage = 'NO SAVED GAME FOUND';
                this.loadMessageTimer = 2.0;
            }
        } else if (action === 'leaderboard') {
            changeScene(leaderboardScene);
        } else if (action === 'settings') {
            changeScene(settingsScene);
        } else if (action === 'quit') {
            this.loadGameMessage = 'CLOSE THE TAB TO QUIT';
            this.loadMessageTimer = 2.5;
        }
    },

    draw(ctx) {
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const vignette = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 60,
            canvas.width / 2, canvas.height / 2, 500
        );
        vignette.addColorStop(0, 'rgba(70, 0, 0, 0.30)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 100; i++) {
            ctx.fillStyle = `rgba(60, 0, 0, ${Math.random() * 0.35})`;
            ctx.fillRect(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                2, 2
            );
        }

        // ----- TITLE -----
        ctx.save();
        ctx.globalAlpha = this.titleFlicker;
        ctx.textAlign = 'center';
        ctx.font = 'bold 80px "Times New Roman", serif';

        const titleText = "ARMADA'S REVENGE";
        const titleX = canvas.width / 2;
        const titleY = 170;

        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#660000';
        ctx.fillText(titleText, titleX, titleY);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#1a0000';
        ctx.fillText(titleText, titleX + 6, titleY + 8);
        ctx.fillText(titleText, titleX + 5, titleY + 7);

        ctx.fillStyle = '#5a0000';
        ctx.fillText(titleText, titleX + 3, titleY + 4);
        ctx.fillText(titleText, titleX + 2, titleY + 3);

        ctx.fillStyle = '#cc0000';
        ctx.fillText(titleText, titleX, titleY);

        ctx.fillStyle = 'rgba(255, 60, 60, 0.55)';
        ctx.fillText(titleText, titleX - 1, titleY - 1);

        ctx.save();
        ctx.beginPath();
        ctx.rect(titleX - 380, titleY - 60, 760, 80);
        ctx.clip();
        ctx.fillStyle = 'rgba(40, 0, 0, 0.45)';
        for (let i = 0; i < 12; i++) {
            const sx = titleX - 370 + i * 65;
            const sy = titleY - 50 + (i % 3) * 20;
            const sw = 40 + (i % 4) * 10;
            ctx.fillRect(sx, sy, sw, 2);
        }
        ctx.fillStyle = 'rgba(220, 30, 30, 0.35)';
        for (let i = 0; i < 8; i++) {
            const sx = titleX - 350 + i * 90;
            const sy = titleY - 40 + (i % 2) * 25;
            ctx.fillRect(sx, sy, 30, 2);
        }
        ctx.restore();
        ctx.restore();

        // ----- BLOOD DRIPS -----
        ctx.save();
        ctx.globalAlpha = this.titleFlicker;
        const dripSeeds = [
            { x: 195, base: 18, speed: 1.2, phase: 0.0  },
            { x: 215, base: 12, speed: 1.8, phase: 1.2  },
            { x: 240, base: 28, speed: 0.8, phase: 1.7  },
            { x: 268, base: 14, speed: 1.5, phase: 0.4  },
            { x: 290, base: 22, speed: 1.0, phase: 2.0  },
            { x: 312, base: 36, speed: 0.6, phase: 2.2  },
            { x: 345, base: 20, speed: 1.0, phase: 1.0  },
            { x: 370, base: 14, speed: 1.4, phase: 0.5  },
            { x: 395, base: 16, speed: 1.3, phase: 0.8  },
            { x: 420, base: 30, speed: 0.7, phase: 1.5  },
            { x: 448, base: 12, speed: 1.7, phase: 0.2  },
            { x: 475, base: 22, speed: 1.1, phase: 0.3  },
            { x: 500, base: 40, speed: 0.5, phase: 2.5  },
            { x: 525, base: 18, speed: 1.3, phase: 1.4  },
            { x: 550, base: 14, speed: 1.4, phase: 0.9  },
            { x: 575, base: 26, speed: 0.9, phase: 1.8  },
            { x: 600, base: 16, speed: 1.2, phase: 1.1  },
            { x: 622, base: 11, speed: 1.6, phase: 0.6  },
            { x: 650, base: 32, speed: 0.7, phase: 2.0  },
            { x: 680, base: 16, speed: 1.4, phase: 0.7  },
            { x: 705, base: 22, speed: 1.0, phase: 1.2  },
            { x: 735, base: 28, speed: 0.8, phase: 0.5  },
            { x: 760, base: 14, speed: 1.5, phase: 1.6  },
            { x: 780, base: 18, speed: 1.3, phase: 1.9  }
        ];

        for (const d of dripSeeds) {
            const len = d.base + Math.sin(this.time * d.speed + d.phase) * 5;
            ctx.fillStyle = '#3a0000';
            ctx.fillRect(d.x - 1, titleY + 4, 5, len);
            ctx.fillStyle = '#7a0000';
            ctx.fillRect(d.x, titleY + 4, 3, len);
            ctx.fillStyle = '#cc0000';
            ctx.fillRect(d.x + 1, titleY + 4, 1, len * 0.7);
            if (len > 22) {
                ctx.fillStyle = '#aa0000';
                ctx.fillRect(d.x - 2, titleY + 4 + len, 7, 5);
                ctx.fillStyle = '#ff3333';
                ctx.fillRect(d.x, titleY + 5 + len, 2, 2);
            }
        }
        ctx.restore();

        // ----- SPLATTER -----
        ctx.save();
        const splatterPulse = 0.7 + Math.sin(this.time * 0.8) * 0.1;
        ctx.globalAlpha = splatterPulse * 0.7;
        const splatters = [
            { x: 140, y: 100, r: 5 },  { x: 170, y: 145, r: 3 },
            { x: 110, y: 175, r: 2 },  { x: 800, y: 110, r: 4 },
            { x: 825, y: 145, r: 2 },  { x: 850, y: 180, r: 5 },
            { x: 130, y: 220, r: 2 },  { x: 850, y: 220, r: 3 },
            { x: 240, y: 90,  r: 3 },  { x: 720, y: 95,  r: 2 },
            { x: 480, y: 85,  r: 2 },  { x: 600, y: 100, r: 3 },
            { x: 360, y: 92,  r: 2 },  { x: 660, y: 88,  r: 2 }
        ];
        for (const s of splatters) {
            ctx.fillStyle = '#7a0000';
            ctx.fillRect(s.x, s.y, s.r * 2, s.r * 2);
            ctx.fillStyle = '#3a0000';
            ctx.fillRect(s.x + s.r * 2 + 1, s.y + 1, 2, 2);
            ctx.fillStyle = '#aa0000';
            ctx.fillRect(s.x + 1, s.y + 1, 2, 2);
        }
        ctx.restore();

        // ----- SUBTITLE -----
        ctx.fillStyle = '#666666';
        ctx.font = 'italic 16px serif';
        ctx.textAlign = 'center';
        ctx.fillText('— a tale of broken men —', canvas.width / 2, 260);

        // ----- BUTTONS -----
        for (const btn of this.buttons) {
            const hover = pointInRect(mouse.x, mouse.y, btn.x, btn.y, btn.w, btn.h);

            ctx.fillStyle = '#0c0c0c';
            ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

            ctx.strokeStyle = hover ? '#5a0000' : '#3a3a3a';
            ctx.lineWidth = 2;
            ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

            const lx = btn.x + btn.w / 2;
            const ly = btn.y + btn.h / 2;

            if (hover) {
                ctx.font = (btn.label.length > 10 ? 'bold 18px monospace'
                                                  : 'bold 22px monospace');
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 12;
                ctx.fillStyle = '#5a0000';
                ctx.fillText(btn.label, lx, ly);
                ctx.shadowBlur = 0;

                ctx.fillStyle = '#1a0000';
                ctx.fillText(btn.label, lx + 2, ly + 3);
                ctx.fillStyle = '#5a0000';
                ctx.fillText(btn.label, lx + 1, ly + 2);
                ctx.fillStyle = '#dd0000';
                ctx.fillText(btn.label, lx, ly);
                ctx.fillStyle = 'rgba(255, 80, 80, 0.6)';
                ctx.fillText(btn.label, lx - 1, ly - 1);

                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';
                const labelWidth = ctx.measureText(btn.label).width;
                const labelLeft = lx - labelWidth / 2;
                const labelBottom = ly + 8;
                const labelDripOffsets = [0.15, 0.35, 0.55, 0.75, 0.92];
                for (let i = 0; i < labelDripOffsets.length; i++) {
                    const dx = labelLeft + labelWidth * labelDripOffsets[i];
                    const dlen = 4 + Math.sin(this.time * 3 + i * 1.7) * 2 + Math.random() * 2;
                    ctx.fillStyle = '#3a0000';
                    ctx.fillRect(dx, labelBottom, 2, dlen);
                    ctx.fillStyle = '#cc0000';
                    ctx.fillRect(dx, labelBottom, 1, dlen * 0.7);
                }
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
            } else {
                ctx.fillStyle = '#999999';
                ctx.font = (btn.label.length > 10 ? 'bold 17px monospace'
                                                  : 'bold 20px monospace');
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(btn.label, lx, ly);
            }
        }
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';

        if (this.loadMessageTimer > 0) {
            const alpha = Math.min(1, this.loadMessageTimer);
            ctx.fillStyle = `rgba(255, 80, 80, ${alpha})`;
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.loadGameMessage, canvas.width / 2, 585);
            ctx.textAlign = 'left';
        }

        if (this.screenDim < 0.99) {
            ctx.fillStyle = `rgba(0, 0, 0, ${1 - this.screenDim})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
};