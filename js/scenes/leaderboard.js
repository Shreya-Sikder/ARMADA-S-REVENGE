// ============================================================
//  Leaderboard — fastest escapes from Greenvale Asylum
//  Times come from the server via netChat; your own best is
//  kept locally so the board still shows something offline.
// ============================================================

const leaderboardScene = {
    backRect: { x: 0, y: 0, w: 0, h: 0 },
    hoverBack: false,
    time: 0,

    onEnter() {
        this.time = 0;
        // ask the server for a fresh copy if we can
        if (typeof netChat !== 'undefined' && netChat && netChat.requestLeaderboard) {
            netChat.requestLeaderboard();
        }
    },

    update(dt) {
        this.time += dt;

        const b = this.backRect;
        this.hoverBack = mouse.x >= b.x && mouse.x <= b.x + b.w &&
                         mouse.y >= b.y && mouse.y <= b.y + b.h;

        if (keysPressed['escape'] || keysPressed['backspace'] ||
            (mouse.clicked && this.hoverBack)) {
            changeScene(menuScene);
        }
    },

    draw(ctx) {
        const W = canvas.width, H = canvas.height;

        ctx.fillStyle = '#0a0908';
        ctx.fillRect(0, 0, W, H);

        // a few old stains behind the panel
        ctx.fillStyle = 'rgba(70, 12, 12, 0.25)';
        for (let i = 0; i < 18; i++) {
            const x = (i * 137.5) % W, y = (i * 311.7) % H;
            ctx.fillRect(x, y, 26 + (i % 5) * 9, 12 + (i % 3) * 7);
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#e8e2d6';
        ctx.font = 'bold 34px "Times New Roman"';
        ctx.fillText('FASTEST ESCAPES', W / 2, 92);

        ctx.font = 'italic 15px "Times New Roman"';
        ctx.fillStyle = '#6a655e';
        ctx.fillText('Greenvale Asylum — four floors, front door to front door', W / 2, 118);

        const nc = (typeof netChat !== 'undefined') ? netChat : null;
        const rows = (nc && nc.leaderboard) ? nc.leaderboard.slice(0, 10) : [];
        const mine = nc ? nc.myName : '';

        // panel
        const px = W / 2 - 250, py = 150, pw = 500, ph = 330;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = 'rgba(150, 140, 125, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, pw, ph);

        // column headings
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#6a655e';
        ctx.textAlign = 'left';
        ctx.fillText('#', px + 24, py + 28);
        ctx.fillText('SURVIVOR', px + 60, py + 28);
        ctx.textAlign = 'right';
        ctx.fillText('TIME', px + pw - 28, py + 28);
        ctx.fillStyle = 'rgba(150, 140, 125, 0.25)';
        ctx.fillRect(px + 20, py + 38, pw - 40, 1);

        if (rows.length === 0) {
            ctx.textAlign = 'center';
            ctx.font = 'italic 15px "Times New Roman"';
            ctx.fillStyle = '#5a554e';
            ctx.fillText(nc && nc.connected
                ? 'Nobody has made it out yet.'
                : 'Not connected — times are not shared.', W / 2, py + 120);
            if (nc && nc.myBest > 0) {
                ctx.font = 'bold 14px monospace';
                ctx.fillStyle = '#9a948a';
                ctx.fillText('YOUR BEST   ' + nc.formatTime(nc.myBest), W / 2, py + 156);
            }
        } else {
            for (let i = 0; i < rows.length; i++) {
                const y = py + 64 + i * 27;
                const you = rows[i].name === mine;

                if (you) {
                    ctx.fillStyle = 'rgba(255, 204, 68, 0.10)';
                    ctx.fillRect(px + 14, y - 15, pw - 28, 24);
                }
                // the top three get a little weight
                const top = i < 3;
                ctx.fillStyle = you ? '#ffcc44' : (top ? '#cfc7b8' : '#9a948a');
                ctx.font = (you || top ? 'bold ' : '') + '15px monospace';

                ctx.textAlign = 'right';
                ctx.fillText(String(i + 1), px + 34, y);
                ctx.textAlign = 'left';
                ctx.fillText(rows[i].name.substring(0, 20), px + 60, y);
                ctx.textAlign = 'right';
                ctx.fillText(nc.formatTime(rows[i].time), px + pw - 28, y);
            }

            // where you sit, if you're off the bottom of the list
            if (nc && nc.myBest > 0 && !rows.some(r => r.name === mine)) {
                const y = py + ph - 24;
                ctx.fillStyle = 'rgba(150, 140, 125, 0.25)';
                ctx.fillRect(px + 20, y - 26, pw - 40, 1);
                ctx.fillStyle = '#ffcc44';
                ctx.font = 'bold 14px monospace';
                ctx.textAlign = 'left';
                ctx.fillText('YOUR BEST', px + 60, y);
                ctx.textAlign = 'right';
                ctx.fillText(nc.formatTime(nc.myBest), px + pw - 28, y);
            }
        }

        // connection state
        ctx.textAlign = 'center';
        ctx.font = '11px monospace';
        ctx.fillStyle = (nc && nc.connected) ? '#4a7a4a' : '#7a4a4a';
        ctx.fillText((nc && nc.connected) ? 'connected' : 'offline', W / 2, py + ph + 22);

        // back button
        const bw = 150, bh = 40;
        const b = this.backRect;
        b.x = W / 2 - bw / 2; b.y = py + ph + 38; b.w = bw; b.h = bh;
        ctx.fillStyle = this.hoverBack ? 'rgba(255, 204, 68, 0.14)' : 'rgba(0,0,0,0.5)';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = this.hoverBack ? '#ffcc44' : 'rgba(150, 140, 125, 0.5)';
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = this.hoverBack ? '#ffcc44' : '#cfc7b8';
        ctx.font = 'bold 15px "Times New Roman"';
        ctx.fillText('BACK', W / 2, b.y + 26);

        ctx.textAlign = 'left';
    }
};