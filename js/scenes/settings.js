// ============================================================
//  Settings Scene
// ============================================================

const settingsScene = {
    time: 0,
    titleFlicker: 1.0,
    draggingIndex: -1,

    sliders: [
        { label: 'MASTER VOLUME', target: 'audio',   key: 'masterVolume', x: 240, y: 130, w: 380, h: 12 },
        { label: 'SFX VOLUME',    target: 'audio',   key: 'sfxVolume',    x: 240, y: 185, w: 380, h: 12 },
        { label: 'MUSIC VOLUME',  target: 'audio',   key: 'musicVolume',  x: 240, y: 240, w: 380, h: 12 },
        { label: 'BRIGHTNESS',    target: 'display', key: 'brightness',   x: 240, y: 295, w: 380, h: 12 }
    ],

    toggles: [
        { label: 'MUTE',       target: 'audio',   key: 'muted',      x: 240, y: 340, w: 100, h: 30 },
        { label: 'FULLSCREEN', target: 'display', key: 'fullscreen', x: 480, y: 340, w: 140, h: 30 }
    ],

    goreOptions: ['OFF', 'LOW', 'MEDIUM', 'HIGH'],
    goreButtons: [],

    resOptions: ['SMALL', 'MEDIUM', 'LARGE', 'HUGE'],
    resButtons: [],

    backButton: { label: 'BACK', x: 380, y: 530, w: 200, h: 42 },

    onEnter() {
        this.time = 0;
        this.draggingIndex = -1;

        const gn = 4, gw = 78, gh = 30, gap = 8;
        const goreTotalW = gn * gw + (gn - 1) * gap;
        const goreStartX = (canvas.width - goreTotalW) / 2;
        this.goreButtons = [];
        for (let i = 0; i < gn; i++) {
            this.goreButtons.push({
                label: this.goreOptions[i],
                x: goreStartX + i * (gw + gap),
                y: 410,
                w: gw,
                h: gh
            });
        }

        const rn = 4, rw = 78, rh = 30;
        const resTotalW = rn * rw + (rn - 1) * gap;
        const resStartX = (canvas.width - resTotalW) / 2;
        this.resButtons = [];
        for (let i = 0; i < rn; i++) {
            this.resButtons.push({
                label: this.resOptions[i],
                x: resStartX + i * (rw + gap),
                y: 475,
                w: rw,
                h: rh
            });
        }
    },

    update(dt) {
        this.time += dt;

        this.titleFlicker = 0.82 + Math.random() * 0.18;
        if (Math.random() < 0.02) this.titleFlicker = 0.5;

        if (keysPressed['escape']) {
            changeScene(menuScene);
            return;
        }

        if (mouse.clicked) {
            for (let i = 0; i < this.sliders.length; i++) {
                const s = this.sliders[i];
                if (pointInRect(mouse.x, mouse.y, s.x - 8, s.y - 12, s.w + 16, s.h + 24)) {
                    this.draggingIndex = i;
                    this.applyDrag(i);
                    break;
                }
            }
        }
        if (mouse.down && this.draggingIndex !== -1) {
            this.applyDrag(this.draggingIndex);
        }
        if (!mouse.down) {
            this.draggingIndex = -1;
        }

        if (mouse.clicked) {
            for (const t of this.toggles) {
                if (pointInRect(mouse.x, mouse.y, t.x, t.y, t.w, t.h)) {
                    const obj = t.target === 'audio' ? audioSettings : displaySettings;
                    const newValue = !obj[t.key];
                    obj[t.key] = newValue;
                    if (t.key === 'fullscreen') setFullscreen(newValue);
                }
            }
        }

        if (mouse.clicked) {
            for (const g of this.goreButtons) {
                if (pointInRect(mouse.x, mouse.y, g.x, g.y, g.w, g.h)) {
                    displaySettings.gore = g.label;
                }
            }
        }

        if (mouse.clicked && !displaySettings.fullscreen) {
            for (const r of this.resButtons) {
                if (pointInRect(mouse.x, mouse.y, r.x, r.y, r.w, r.h)) {
                    displaySettings.resolution = r.label;
                    applyResolution();
                }
            }
        }

        if (mouse.clicked) {
            const b = this.backButton;
            if (pointInRect(mouse.x, mouse.y, b.x, b.y, b.w, b.h)) {
                changeScene(menuScene);
            }
        }
    },

    applyDrag(i) {
        const s = this.sliders[i];
        let t = (mouse.x - s.x) / s.w;
        if (t < 0) t = 0;
        if (t > 1) t = 1;
        const obj = s.target === 'audio' ? audioSettings : displaySettings;
        obj[s.key] = t;
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
        ctx.font = 'bold 44px "Times New Roman", serif';

        const tx = canvas.width / 2;
        const ty = 70;

        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#660000';
        ctx.fillText('SETTINGS', tx, ty);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#1a0000';
        ctx.fillText('SETTINGS', tx + 4, ty + 5);
        ctx.fillStyle = '#5a0000';
        ctx.fillText('SETTINGS', tx + 2, ty + 3);
        ctx.fillStyle = '#cc0000';
        ctx.fillText('SETTINGS', tx, ty);
        ctx.fillStyle = 'rgba(255, 60, 60, 0.5)';
        ctx.fillText('SETTINGS', tx - 1, ty - 1);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = this.titleFlicker;
        const titleDrips = [
            { x: 410, base: 7,  speed: 1.2, phase: 0.3 },
            { x: 445, base: 11, speed: 0.9, phase: 1.1 },
            { x: 480, base: 6,  speed: 1.4, phase: 0.7 },
            { x: 515, base: 12, speed: 0.7, phase: 1.6 },
            { x: 550, base: 8,  speed: 1.1, phase: 0.5 }
        ];
        for (const d of titleDrips) {
            const len = d.base + Math.sin(this.time * d.speed + d.phase) * 3;
            ctx.fillStyle = '#5a0000';
            ctx.fillRect(d.x, ty + 4, 3, len);
            ctx.fillStyle = '#aa0000';
            ctx.fillRect(d.x + 1, ty + 4, 1, len * 0.6);
        }
        ctx.restore();

        // SLIDERS
        ctx.font = 'bold 13px monospace';
        for (let i = 0; i < this.sliders.length; i++) {
            const s = this.sliders[i];
            const obj = s.target === 'audio' ? audioSettings : displaySettings;
            const value = obj[s.key];
            const handleX = s.x + value * s.w;
            const isHover = pointInRect(mouse.x, mouse.y, s.x - 8, s.y - 12, s.w + 16, s.h + 24);
            const isDragging = this.draggingIndex === i;
            const active = isHover || isDragging;

            ctx.fillStyle = active ? '#cc2222' : '#aaaaaa';
            ctx.textAlign = 'left';
            ctx.fillText(s.label, s.x, s.y - 13);

            ctx.textAlign = 'right';
            ctx.fillStyle = active ? '#ff4444' : '#888888';
            ctx.fillText(Math.round(value * 100) + '%', s.x + s.w, s.y - 13);

            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(s.x, s.y, s.w, s.h);
            ctx.strokeStyle = '#3a3a3a';
            ctx.lineWidth = 1;
            ctx.strokeRect(s.x, s.y, s.w, s.h);

            ctx.fillStyle = '#7a0000';
            ctx.fillRect(s.x, s.y, value * s.w, s.h);
            ctx.fillStyle = 'rgba(220, 30, 30, 0.4)';
            ctx.fillRect(s.x, s.y, value * s.w, 3);

            const handleW = 11, handleH = s.h + 12, handleY = s.y - 6;
            if (active) { ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 10; }
            ctx.fillStyle = '#3a0000';
            ctx.fillRect(handleX - handleW / 2, handleY, handleW, handleH);
            ctx.fillStyle = isDragging ? '#ee2222' : (isHover ? '#cc1111' : '#a80000');
            ctx.fillRect(handleX - handleW / 2 + 1, handleY + 1, handleW - 2, handleH - 2);
            ctx.fillStyle = 'rgba(255, 80, 80, 0.6)';
            ctx.fillRect(handleX - handleW / 2 + 1, handleY + 1, handleW - 2, 3);
            ctx.shadowBlur = 0;
        }

        // TOGGLES
        for (const t of this.toggles) {
            const obj = t.target === 'audio' ? audioSettings : displaySettings;
            const value = obj[t.key];
            const isHover = pointInRect(mouse.x, mouse.y, t.x, t.y, t.w, t.h);

            ctx.fillStyle = isHover ? '#cc2222' : '#aaaaaa';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(t.label, t.x, t.y - 6);

            ctx.fillStyle = value ? '#5a0000' : '#0c0c0c';
            ctx.fillRect(t.x, t.y, t.w, t.h);

            ctx.strokeStyle = isHover ? '#ff2222' : (value ? '#aa0000' : '#3a3a3a');
            ctx.lineWidth = 2;
            ctx.strokeRect(t.x, t.y, t.w, t.h);

            ctx.font = 'bold 15px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = value ? '#ff5555' : '#888888';
            ctx.fillText(value ? 'ON' : 'OFF', t.x + t.w / 2, t.y + t.h / 2);
            ctx.textBaseline = 'alphabetic';
        }

        // GORE
        ctx.fillStyle = '#aaaaaa';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GORE LEVEL', canvas.width / 2, 400);

        for (const g of this.goreButtons) {
            const isHover = pointInRect(mouse.x, mouse.y, g.x, g.y, g.w, g.h);
            const isSelected = displaySettings.gore === g.label;

            ctx.fillStyle = isSelected ? '#5a0000' : '#0c0c0c';
            ctx.fillRect(g.x, g.y, g.w, g.h);
            ctx.strokeStyle = isHover ? '#ff2222' : (isSelected ? '#aa0000' : '#3a3a3a');
            ctx.lineWidth = 2;
            ctx.strokeRect(g.x, g.y, g.w, g.h);

            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isSelected ? '#ff5555' : (isHover ? '#cc2222' : '#888888');
            ctx.fillText(g.label, g.x + g.w / 2, g.y + g.h / 2);
            ctx.textBaseline = 'alphabetic';
        }

        // RESOLUTION
        const resDisabled = displaySettings.fullscreen;
        ctx.fillStyle = resDisabled ? '#444444' : '#aaaaaa';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        const resHeading = resDisabled ? 'RESOLUTION (disabled in fullscreen)' : 'RESOLUTION';
        ctx.fillText(resHeading, canvas.width / 2, 465);

        for (const r of this.resButtons) {
            const isHover = !resDisabled && pointInRect(mouse.x, mouse.y, r.x, r.y, r.w, r.h);
            const isSelected = displaySettings.resolution === r.label;

            let fill = '#0c0c0c';
            let stroke = '#3a3a3a';
            let textColor = '#888888';
            if (resDisabled) {
                fill = '#0a0a0a';
                stroke = '#252525';
                textColor = '#444444';
            } else {
                if (isSelected) { fill = '#5a0000'; stroke = '#aa0000'; textColor = '#ff5555'; }
                if (isHover)    { stroke = '#ff2222'; textColor = '#cc2222'; }
                if (isSelected && isHover) { textColor = '#ff5555'; }
            }

            ctx.fillStyle = fill;
            ctx.fillRect(r.x, r.y, r.w, r.h);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 2;
            ctx.strokeRect(r.x, r.y, r.w, r.h);

            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = textColor;
            ctx.fillText(r.label, r.x + r.w / 2, r.y + r.h / 2);
            ctx.textBaseline = 'alphabetic';
        }

        // BACK
        const b = this.backButton;
        const backHover = pointInRect(mouse.x, mouse.y, b.x, b.y, b.w, b.h);

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
            this.drawBloodyText(ctx, b.label, lx, ly, 22);
        } else {
            ctx.font = 'bold 20px monospace';
            ctx.fillStyle = '#999999';
            ctx.fillText(b.label, lx, ly);
        }
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';

        ctx.fillStyle = '#444444';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Drag sliders   ·   Click toggles   ·   ESC to go back', canvas.width / 2, 588);
        ctx.textAlign = 'left';
    }
};