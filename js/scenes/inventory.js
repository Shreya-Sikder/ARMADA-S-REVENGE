// ============================================================
//  Inventory Scene — Overlay panel with INVENTORY, CRAFT and
//  COMPANIONS tabs. Q / E cycle between them.
// ============================================================

const inventoryScene = {
    cols: 5,
    rows: 4,
    slotSize: 90,
    slotGap: 12,

    hoveredSlot: -1,
    hoveredRecipe: -1,
    hoveredCompanion: -1,
    time: 0,

    tabs: ['inventory', 'craft', 'companions'],
    activeTab: 'inventory',

    useNotice: '',
    useNoticeTime: 0,
    useNoticeColor: '#ffcc44',

    itemInfo: {
        shard:    { title: 'GLASS SHARD',  desc: 'A sharp piece of broken glass.\nCraft with cloth to make\na shiv.',                       usable: false },
        cloth:    { title: 'CLOTH STRIP',  desc: 'A piece of dirty cloth.\nUsed to make shivs\nand bandages.',                              usable: false },
        alcohol:  { title: 'ALCOHOL',      desc: 'A small bottle of alcohol.\nCombine with cloth to\nmake bandages.',                       usable: false },
        scissors: { title: 'SCISSORS',     desc: 'Sharp medical scissors.\nCan be thrown like a\nshuriken. (RARE)',                         usable: false },
        medicine: { title: 'MEDICINE',     desc: 'A bottle of unknown medicine.\nRestores health to full.\n(RARE)',                         usable: true },
        bandages: { title: 'BANDAGES',     desc: 'Sterile bandages.\nRestores 1 health bar.',                                               usable: true },
        pistol:   { title: 'PISTOL',       desc: "The guard's sidearm.\nFires a real bullet — but\nevery round is one you had.",      usable: false },
        f2keycard:{ title: 'KEYCARD',      desc: 'Floor 2 access.\nTaken off whatever was\nwearing it.',                           usable: false },
        burst:    { title: 'SEMI-AUTO',    desc: 'Hidden in a cell.\nTap for one shot.\nHold for three.',                        usable: false },
        shreyaId: { title: 'ID CARD',      desc: 'Greenvale Asylum.\nResearch Director.\nYou know the face.',                    usable: false },
        freezegun:{ title: 'FREEZE GUN',   desc: 'Taken off the cold man.\nFires a spread of ice.\nCold is what he cannot take.',    usable: false },
        shotgun:  { title: 'SHOTGUN',      desc: 'From a locker in the lounge.\nOne shell per target.\nThey do not stay standing.', usable: false },
        ammo:     { title: 'ROUNDS',       desc: 'Pistol ammunition.\nPicked up automatically.',                                        usable: false },
        keycard2: { title: 'KEYCARD',      desc: 'Floor 3 access.\nOff his belt.',                                                        usable: false },
        shiv:     { title: 'SHIV',         desc: 'A shard of glass wrapped\nin cloth. Weak, but deadly.\nDurability: 20 hits.',             usable: false }
    },

    recipes: [
        {
            id: 'shiv',
            name: 'SHIV',
            ingredients: [
                { id: 'shard', name: 'GLASS SHARD', qty: 1 },
                { id: 'cloth', name: 'CLOTH STRIP', qty: 1 }
            ],
            result: { id: 'shiv', name: 'SHIV', qty: 1 },
            desc: 'A crude but deadly weapon.\nTriggers something dark.'
        },
        {
            id: 'bandages',
            name: 'BANDAGES',
            ingredients: [
                { id: 'alcohol', name: 'ALCOHOL', qty: 1 },
                { id: 'cloth', name: 'CLOTH STRIP', qty: 1 }
            ],
            result: { id: 'bandages', name: 'BANDAGES', qty: 1 },
            desc: 'Alcohol-sterilized bandages.\nRestores 1 HP when used.'
        }
    ],

    // Everyone who can join you. Everyone you recruit travels with you.
    companionList: [
        {
            id: 'doctor',
            name: 'THE DOCTOR',
            perkTitle: 'FIELD MEDIC',
            perk: 'Heals one full health bar\nevery 8 seconds while\nyou are hurt.',
            recruitHint: 'Bring him the\nconfidential file.',
            met: () => !!gameplayScene.doctorTriggered
        },
        {
            id: 'guard',
            name: 'THE GUARD',
            perkTitle: 'VOLLEY',
            perk: 'Hold attack to throw three\nblades in a spread.\nCosts half a stamina bar.',
            recruitHint: 'Kill the thing in the\nward for him.',
            met: () => !!gameplayScene.guardQuest
        }
        ,
        {
            id: 'shreya',
            name: 'SHREYA',
            perkTitle: 'LIVE WIRE',
            perk: 'Tases an enemy every 15\nseconds. Hold attack to throw\na charged blade — all stamina.',
            recruitHint: 'Get her off the roof.',
            met: () => !!gameplayScene.shreya && (gameplayScene.shreya.present ||
                       gameplayScene.raymondScene.done)
        }
    ],

    onEnter() {
        this.time = 0;
        this.hoveredSlot = -1;
        this.hoveredRecipe = -1;
        this.hoveredCompanion = -1;
        this.useNotice = '';
        this.useNoticeTime = 0;
    },

    onExit() {},

    update(dt) {
        this.time += dt;

        if (keysPressed['escape'] || keysPressed['i']) {
            changeScene(gameplayScene);
            return;
        }

        // Q / E cycle the tabs
        const idx = this.tabs.indexOf(this.activeTab);
        if (keysPressed['e']) {
            this.activeTab = this.tabs[(idx + 1) % this.tabs.length];
        } else if (keysPressed['q']) {
            this.activeTab = this.tabs[(idx - 1 + this.tabs.length) % this.tabs.length];
        }

        if (mouse.clicked) {
            for (let i = 0; i < this.tabs.length; i++) {
                const r = this.getTabRect(i);
                if (pointInRect(mouse.x, mouse.y, r.x, r.y, r.w, r.h)) {
                    this.activeTab = this.tabs[i];
                    return;
                }
            }
        }

        if (this.activeTab === 'inventory') {
            this.updateInventoryTab();
        } else if (this.activeTab === 'craft') {
            this.updateCraftTab();
        } else {
            this.updateCompanionsTab();
        }

        if (this.useNoticeTime > 0) this.useNoticeTime -= dt;
    },

    getTabRect(i) {
        return { x: 60 + i * 160, y: 100, w: 150, h: 26 };
    },

    updateInventoryTab() {
        this.hoveredSlot = -1;
        const gridInfo = this.getGridInfo();
        for (let i = 0; i < this.cols * this.rows; i++) {
            const slot = this.getSlotRect(i, gridInfo);
            if (pointInRect(mouse.x, mouse.y, slot.x, slot.y, slot.w, slot.h)) {
                this.hoveredSlot = i;
                break;
            }
        }

        if (mouse.clicked && this.hoveredSlot >= 0) {
            this.useSlot(this.hoveredSlot);
        }

        for (let n = 1; n <= 5; n++) {
            if (keysPressed[String(n)]) {
                this.useSlot(n - 1);
            }
        }
    },

    updateCraftTab() {
        this.hoveredRecipe = -1;
        for (let i = 0; i < this.recipes.length; i++) {
            const r = this.getRecipeRect(i);
            if (pointInRect(mouse.x, mouse.y, r.x, r.y, r.w, r.h)) {
                this.hoveredRecipe = i;
                break;
            }
        }

        if (mouse.clicked && this.hoveredRecipe >= 0) {
            this.tryCraft(this.hoveredRecipe);
        }
    },

    // ----- companions -----

    companionState(c) {
        const g = gameplayScene;
        if (c.id === 'guard' && g.guardDead) return 'gone';
        if (g.companionsRecruited && g.companionsRecruited[c.id]) return 'active';
        return c.met() ? 'met' : 'unknown';
    },

    getCompanionRect(i) {
        const gap = 24;
        const n = this.companionList.length;
        const w = (canvas.width - 120 - gap * (n - 1)) / n;
        return { x: 60 + i * (w + gap), y: 145, w: w, h: 385 };
    },

    updateCompanionsTab() {
        this.hoveredCompanion = -1;
        for (let i = 0; i < this.companionList.length; i++) {
            const r = this.getCompanionRect(i);
            if (pointInRect(mouse.x, mouse.y, r.x, r.y, r.w, r.h)) {
                this.hoveredCompanion = i;
                break;
            }
        }

        if (mouse.clicked && this.hoveredCompanion >= 0) {
            const c = this.companionList[this.hoveredCompanion];
            const state = this.companionState(c);
            if (state === 'active') {
                this.showNotice('ALREADY TRAVELLING WITH YOU', '#aaaaaa');
            } else {
                this.showNotice('NOT RECRUITED YET', '#aa6666');
            }
        }
    },

    canCraft(recipe) {
        const inventory = gameplayScene.inventory;
        for (const ingredient of recipe.ingredients) {
            const invItem = inventory.find(i => i.id === ingredient.id);
            if (!invItem || invItem.qty < ingredient.qty) return false;
        }
        return true;
    },

    tryCraft(recipeIndex) {
        const recipe = this.recipes[recipeIndex];
        if (!recipe) return;

        if (!this.canCraft(recipe)) {
            this.showNotice("MISSING INGREDIENTS", '#aa6666');
            return;
        }

        for (const ingredient of recipe.ingredients) {
            const invItem = gameplayScene.inventory.find(i => i.id === ingredient.id);
            invItem.qty -= ingredient.qty;
            if (invItem.qty <= 0) {
                const idx = gameplayScene.inventory.indexOf(invItem);
                gameplayScene.inventory.splice(idx, 1);
            }
        }

        const existing = gameplayScene.inventory.find(i => i.id === recipe.result.id);
        if (existing) {
            existing.qty += recipe.result.qty;
        } else {
            gameplayScene.inventory.push({
                id: recipe.result.id,
                name: recipe.result.name,
                qty: recipe.result.qty
            });
        }

        if (recipe.id === 'shiv' && !gameplayScene.firstShivCrafted) {
            gameplayScene.firstShivCrafted = true;
            gameplayScene.armadaIncoming = true;
            gameplayScene.armadaIncomingTime = 4.0;
            this.showNotice('⚡ SHIV CRAFTED — SOMETHING IS COMING ⚡', '#ff4444');
        } else {
            this.showNotice(`CRAFTED: ${recipe.name}`, '#66dd66');
        }
    },

    useSlot(slotIndex) {
        const inventory = gameplayScene.inventory;
        const item = inventory[slotIndex];
        if (!item) return;

        const info = this.itemInfo[item.id];
        if (!info || !info.usable) {
            this.showNotice("CAN'T USE THIS ALONE", '#aa6666');
            return;
        }

        if (item.id === 'medicine') {
            if (gameplayScene.player.hp >= gameplayScene.player.maxHp) {
                this.showNotice('ALREADY AT FULL HEALTH', '#aa6666');
                return;
            }
            gameplayScene.healPlayer(gameplayScene.player.maxHp);
            this.consumeItem(slotIndex);
            this.showNotice('MEDICINE USED — FULLY HEALED', '#66dd66');
            return;
        }

        if (item.id === 'bandages') {
            if (gameplayScene.player.hp >= gameplayScene.player.maxHp) {
                this.showNotice('ALREADY AT FULL HEALTH', '#aa6666');
                return;
            }
            gameplayScene.healPlayer(1);
            this.consumeItem(slotIndex);
            this.showNotice('BANDAGES USED — +1 HP', '#66dd66');
            return;
        }
    },

    consumeItem(slotIndex) {
        const inventory = gameplayScene.inventory;
        const item = inventory[slotIndex];
        if (!item) return;
        item.qty -= 1;
        if (item.qty <= 0) inventory.splice(slotIndex, 1);
    },

    showNotice(text, color) {
        this.useNotice = text;
        this.useNoticeTime = 2.5;
        this.useNoticeColor = color;
    },

    getGridInfo() {
        const gridW = this.cols * this.slotSize + (this.cols - 1) * this.slotGap;
        const gridH = this.rows * this.slotSize + (this.rows - 1) * this.slotGap;
        const gridX = 60;
        const gridY = 140;
        return { gridX, gridY, gridW, gridH };
    },

    getSlotRect(i, gridInfo) {
        const col = i % this.cols;
        const row = Math.floor(i / this.cols);
        const x = gridInfo.gridX + col * (this.slotSize + this.slotGap);
        const y = gridInfo.gridY + row * (this.slotSize + this.slotGap);
        return { x, y, w: this.slotSize, h: this.slotSize };
    },

    getRecipeRect(i) {
        return {
            x: 60,
            y: 150 + i * 130,
            w: canvas.width - 120,
            h: 110
        };
    },

    draw(ctx) {
        gameplayScene.draw(ctx);

        ctx.fillStyle = 'rgba(10, 5, 5, 0.88)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(80, 0, 0, 0.15)';
        for (let i = 0; i < 30; i++) {
            const bx = Math.random() * canvas.width;
            const by = Math.random() * canvas.height;
            const bs = 20 + Math.random() * 40;
            ctx.fillRect(bx, by, bs, bs);
        }

        const titles = { inventory: 'INVENTORY', craft: 'CRAFTING', companions: 'COMPANIONS' };
        const title = titles[this.activeTab];
        ctx.fillStyle = '#5a0000';
        ctx.font = 'bold 48px "Times New Roman"';
        ctx.textAlign = 'center';
        ctx.fillText(title, canvas.width / 2 + 2, 62 + 2);
        ctx.fillStyle = '#8a0000';
        ctx.fillText(title, canvas.width / 2 + 1, 62 + 1);
        ctx.fillStyle = '#c81010';
        ctx.fillText(title, canvas.width / 2, 62);

        ctx.fillStyle = '#5a0000';
        ctx.fillRect(60, 90, canvas.width - 120, 2);

        const labels = { inventory: 'INVENTORY', craft: 'CRAFTING', companions: 'COMPANIONS' };
        for (let i = 0; i < this.tabs.length; i++) {
            const r = this.getTabRect(i);
            this.drawTab(ctx, r.x, r.y, r.w, r.h, labels[this.tabs[i]], this.activeTab === this.tabs[i]);
        }

        if (this.activeTab === 'inventory') {
            this.drawInventoryTab(ctx);
        } else if (this.activeTab === 'craft') {
            this.drawCraftTab(ctx);
        } else {
            this.drawCompanionsTab(ctx);
        }

        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Q / E switch tabs  ·  ESC/I close', canvas.width / 2, canvas.height - 20);

        if (this.useNoticeTime > 0) {
            const alpha = Math.min(1, this.useNoticeTime / 1);
            const noticeW = 460;
            const noticeH = 40;
            const nx = canvas.width / 2 - noticeW / 2;
            const ny = 130;
            ctx.fillStyle = `rgba(0, 0, 0, ${0.9 * alpha})`;
            ctx.fillRect(nx, ny, noticeW, noticeH);
            ctx.strokeStyle = `rgba(255, 200, 40, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(nx, ny, noticeW, noticeH);
            ctx.fillStyle = this.useNoticeColor;
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.useNotice, canvas.width / 2, ny + noticeH / 2);
            ctx.textBaseline = 'alphabetic';
            ctx.textAlign = 'left';
            ctx.globalAlpha = 1;
        }
    },

    drawTab(ctx, x, y, w, h, label, active) {
        ctx.fillStyle = active ? 'rgba(120, 20, 20, 0.9)' : 'rgba(30, 10, 10, 0.85)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = active ? '#dd4444' : '#5a1a1a';
        ctx.lineWidth = active ? 2 : 1;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = active ? '#ffffff' : '#888';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w / 2, y + h / 2);
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
    },

    drawInventoryTab(ctx) {
        const gridInfo = this.getGridInfo();
        const inventory = gameplayScene.inventory;

        for (let i = 0; i < this.cols * this.rows; i++) {
            const slot = this.getSlotRect(i, gridInfo);
            const item = inventory[i];
            const isHovered = (i === this.hoveredSlot);
            const isUsable = item && this.itemInfo[item.id] && this.itemInfo[item.id].usable;

            ctx.fillStyle = item
                ? (isHovered ? 'rgba(40, 10, 10, 0.95)' : 'rgba(25, 8, 8, 0.9)')
                : (isHovered ? 'rgba(20, 15, 15, 0.7)' : 'rgba(15, 10, 10, 0.6)');
            ctx.fillRect(slot.x, slot.y, slot.w, slot.h);

            let borderColor;
            if (item) {
                if (isUsable && isHovered) {
                    const pulse = 0.6 + Math.sin(this.time * 8) * 0.4;
                    borderColor = `rgba(255, 220, 100, ${pulse})`;
                } else if (isHovered) {
                    borderColor = '#aa2020';
                } else if (isUsable) {
                    borderColor = '#886611';
                } else {
                    borderColor = '#5a0808';
                }
            } else {
                borderColor = isHovered ? '#3a2020' : '#2a1a1a';
            }
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = (isHovered && item) ? 2 : 1;
            ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);

            if (i < 5) {
                ctx.fillStyle = 'rgba(255, 220, 100, 0.6)';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`[${i + 1}]`, slot.x + 4, slot.y + 12);
            }

            if (item) {
                const centerX = slot.x + slot.w / 2;
                const centerY = slot.y + slot.h / 2 - 8;

                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.scale(2.2, 2.2);
                ctx.translate(-centerX, -centerY);
                this.drawItemIcon(ctx, item.id, centerX, centerY);
                ctx.restore();

                ctx.fillStyle = isHovered ? '#eeeeee' : '#aaaaaa';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(item.name, slot.x + slot.w / 2, slot.y + slot.h - 6);

                if (item.qty > 1) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(slot.x + slot.w - 26, slot.y + 4, 22, 14);
                    ctx.fillStyle = '#ffcc44';
                    ctx.font = 'bold 11px monospace';
                    ctx.textAlign = 'right';
                    ctx.fillText(`×${item.qty}`, slot.x + slot.w - 6, slot.y + 14);
                }
            }
        }

        const detailX = gridInfo.gridX + gridInfo.gridW + 30;
        const detailY = gridInfo.gridY;
        const detailW = canvas.width - detailX - 40;
        const detailH = gridInfo.gridH;

        ctx.fillStyle = 'rgba(20, 10, 10, 0.85)';
        ctx.fillRect(detailX, detailY, detailW, detailH);
        ctx.strokeStyle = '#5a0808';
        ctx.lineWidth = 1;
        ctx.strokeRect(detailX, detailY, detailW, detailH);

        const hoveredItem = (this.hoveredSlot >= 0) ? inventory[this.hoveredSlot] : null;
        if (hoveredItem) {
            const info = this.itemInfo[hoveredItem.id];
            ctx.fillStyle = '#dd2222';
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(info ? info.title : hoveredItem.name, detailX + 20, detailY + 34);

            ctx.fillStyle = '#5a0000';
            ctx.fillRect(detailX + 20, detailY + 42, detailW - 40, 1);

            ctx.fillStyle = '#dddddd';
            ctx.font = '13px monospace';
            const description = info ? info.desc : 'No description available.';
            const lines = description.split('\n');
            lines.forEach((line, idx) => {
                ctx.fillText(line, detailX + 20, detailY + 68 + idx * 20);
            });

            if (info && info.usable) {
                ctx.fillStyle = '#ffcc44';
                ctx.font = 'bold 12px monospace';
                ctx.fillText('CLICK OR PRESS NUMBER TO USE', detailX + 20, detailY + detailH - 42);
            }

            ctx.fillStyle = '#ffcc44';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`YOU HAVE: ${hoveredItem.qty}`, detailX + 20, detailY + detailH - 20);
        } else {
            ctx.fillStyle = '#666';
            ctx.font = 'italic 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Hover an item to see details', detailX + detailW / 2, detailY + detailH / 2);
        }
    },

    drawCraftTab(ctx) {
        const inventory = gameplayScene.inventory;

        for (let i = 0; i < this.recipes.length; i++) {
            const recipe = this.recipes[i];
            const rect = this.getRecipeRect(i);
            const isHovered = (i === this.hoveredRecipe);
            const canMake = this.canCraft(recipe);

            ctx.fillStyle = canMake
                ? (isHovered ? 'rgba(50, 30, 10, 0.95)' : 'rgba(30, 20, 8, 0.9)')
                : 'rgba(20, 10, 10, 0.75)';
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

            if (canMake && isHovered) {
                const pulse = 0.6 + Math.sin(this.time * 8) * 0.4;
                ctx.strokeStyle = `rgba(255, 220, 100, ${pulse})`;
                ctx.lineWidth = 3;
            } else if (canMake) {
                ctx.strokeStyle = '#886611';
                ctx.lineWidth = 2;
            } else {
                ctx.strokeStyle = '#4a1010';
                ctx.lineWidth = 1;
            }
            ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

            ctx.fillStyle = canMake ? '#ffcc44' : '#886666';
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(recipe.name, rect.x + 20, rect.y + 28);

            ctx.fillStyle = canMake ? '#cccccc' : '#666';
            ctx.font = '12px monospace';
            const descLines = recipe.desc.split('\n');
            descLines.forEach((line, idx) => {
                ctx.fillText(line, rect.x + 20, rect.y + 50 + idx * 15);
            });

            let ingX = rect.x + 320;
            const ingY = rect.y + rect.h / 2;
            for (let j = 0; j < recipe.ingredients.length; j++) {
                const ing = recipe.ingredients[j];
                const invItem = inventory.find(x => x.id === ing.id);
                const have = invItem ? invItem.qty : 0;
                const hasEnough = have >= ing.qty;

                ctx.fillStyle = 'rgba(20, 10, 10, 0.8)';
                ctx.fillRect(ingX - 30, ingY - 30, 60, 60);
                ctx.strokeStyle = hasEnough ? '#66aa44' : '#aa4444';
                ctx.lineWidth = 2;
                ctx.strokeRect(ingX - 30, ingY - 30, 60, 60);

                ctx.save();
                ctx.translate(ingX, ingY - 5);
                ctx.scale(1.5, 1.5);
                ctx.translate(-ingX, -(ingY - 5));
                this.drawItemIcon(ctx, ing.id, ingX, ingY - 5);
                ctx.restore();

                ctx.fillStyle = hasEnough ? '#66dd66' : '#dd6666';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`${have}/${ing.qty}`, ingX, ingY + 24);

                if (j < recipe.ingredients.length - 1) {
                    ctx.fillStyle = '#888';
                    ctx.font = 'bold 24px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('+', ingX + 45, ingY + 6);
                }

                ingX += 90;
            }

            ctx.fillStyle = canMake ? '#ffcc44' : '#666';
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('→', ingX + 5, ingY + 6);

            const resX = ingX + 60;
            ctx.fillStyle = 'rgba(20, 10, 10, 0.8)';
            ctx.fillRect(resX - 30, ingY - 30, 60, 60);
            ctx.strokeStyle = canMake ? '#ffcc44' : '#5a0808';
            ctx.lineWidth = 2;
            ctx.strokeRect(resX - 30, ingY - 30, 60, 60);

            ctx.save();
            ctx.translate(resX, ingY - 5);
            ctx.scale(1.6, 1.6);
            ctx.translate(-resX, -(ingY - 5));
            this.drawItemIcon(ctx, recipe.result.id, resX, ingY - 5);
            ctx.restore();

            ctx.fillStyle = canMake ? '#ffcc44' : '#666';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(recipe.result.name, resX, ingY + 26);

            if (canMake && isHovered) {
                ctx.fillStyle = '#ffcc44';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'right';
                ctx.fillText('CLICK TO CRAFT', rect.x + rect.w - 20, rect.y + 28);
            } else if (!canMake) {
                ctx.fillStyle = '#aa4444';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'right';
                ctx.fillText('MISSING INGREDIENTS', rect.x + rect.w - 20, rect.y + 28);
            }

            ctx.textAlign = 'left';
        }
    },

    drawCompanionsTab(ctx) {
        for (let i = 0; i < this.companionList.length; i++) {
            const c = this.companionList[i];
            const r = this.getCompanionRect(i);
            const state = this.companionState(c);
            const isHovered = (i === this.hoveredCompanion);
            const cx = r.x + r.w / 2;

            // card
            ctx.fillStyle = state === 'active'
                ? 'rgba(40, 30, 10, 0.95)'
                : (isHovered && state === 'resting' ? 'rgba(40, 14, 14, 0.95)' : 'rgba(22, 10, 10, 0.9)');
            ctx.fillRect(r.x, r.y, r.w, r.h);

            if (state === 'active') {
                const pulse = 0.65 + Math.sin(this.time * 4) * 0.35;
                ctx.strokeStyle = `rgba(255, 210, 90, ${pulse})`;
                ctx.lineWidth = 3;
            } else if (state === 'resting') {
                ctx.strokeStyle = isHovered ? '#dd4444' : '#886611';
                ctx.lineWidth = 2;
            } else {
                ctx.strokeStyle = '#3a1414';
                ctx.lineWidth = 1;
            }
            ctx.strokeRect(r.x, r.y, r.w, r.h);

            // portrait
            const px = cx, py = r.y + 118;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(r.x + 20, r.y + 20, r.w - 40, 190);

            if (state === 'unknown') {
                // a figure you haven't met yet
                ctx.fillStyle = '#0c0808';
                ctx.fillRect(px - 20, py - 50, 40, 36);
                ctx.fillRect(px - 32, py - 12, 64, 72);
                ctx.fillStyle = '#3a2020';
                ctx.font = 'bold 48px "Times New Roman"';
                ctx.textAlign = 'center';
                ctx.fillText('?', px, py + 30);
            } else {
                ctx.save();
                if (state === 'met') ctx.globalAlpha = 0.4;
                if (state === 'gone') ctx.globalAlpha = 0.22;
                ctx.translate(px, py);
                ctx.scale(3, 3);
                ctx.translate(-px, -py);
                if (c.id === 'guard') gameplayScene.drawGuardBody(ctx, px, py);
                else if (c.id === 'shreya') gameplayScene.drawShreyaBody(ctx, px, py, true);
                else gameplayScene.drawDoctorBody(ctx, px, py);
                ctx.restore();
            }

            // name
            ctx.textAlign = 'center';
            ctx.fillStyle = state === 'unknown' ? '#5a3a3a'
                : (state === 'met' ? '#998888' : (state === 'gone' ? '#6a5252' : '#eeeeee'));
            ctx.font = 'bold 20px monospace';
            ctx.fillText(state === 'unknown' ? '???' : c.name, cx, r.y + 240);

            // status
            const status = {
                active:  'TRAVELLING WITH YOU',
                resting: 'RESTING',
                met:     'NOT YET RECRUITED',
                unknown: 'NOT YET MET',
                gone:    'DIED ON THE ROOF'
            }[state];
            ctx.fillStyle = { active: '#ffcc44', resting: '#aaaaaa', met: '#aa6666',
                              unknown: '#553333', gone: '#7a3a3a' }[state];
            ctx.font = 'bold 12px monospace';
            ctx.fillText(status, cx, r.y + 262);

            // perk (hidden until you've met them)
            ctx.fillStyle = '#5a0000';
            ctx.fillRect(r.x + 30, r.y + 275, r.w - 60, 1);

            if (state !== 'unknown') {
                ctx.fillStyle = state === 'met' ? '#886655' : '#dd8844';
                ctx.font = 'bold 12px monospace';
                ctx.fillText('PERK — ' + c.perkTitle, cx, r.y + 297);
                ctx.fillStyle = state === 'met' ? '#776666' : '#cccccc';
                ctx.font = '12px monospace';
                c.perk.split('\n').forEach((line, li) => {
                    ctx.fillText(line, cx, r.y + 318 + li * 16);
                });
            }

            // what to do next
            ctx.font = 'bold 11px monospace';
            if (state === 'met') {
                ctx.fillStyle = '#aa6666';
                const hint = c.recruitHint.split('\n');
                hint.forEach((line, li) => {
                    ctx.fillText(line, cx, r.y + r.h - 14 - (hint.length - 1 - li) * 14);
                });
            }

            ctx.textAlign = 'left';
        }
    },

    drawItemIcon(ctx, id, x, y) {
        if (id === 'shard')       gameplayScene.drawShard(ctx, x, y);
        else if (id === 'cloth')  gameplayScene.drawCloth(ctx, x, y);
        else if (id === 'alcohol') gameplayScene.drawAlcohol(ctx, x, y);
        else if (id === 'scissors') gameplayScene.drawScissors(ctx, x, y);
        else if (id === 'medicine') gameplayScene.drawMedicine(ctx, x, y);
        else if (id === 'bandages') gameplayScene.drawBandages(ctx, x, y);
        else if (id === 'shiv')   this.drawShiv(ctx, x, y);
        else if (id === 'pistol' || id === 'burst' || id === 'freezegun' || id === 'shotgun') gameplayScene.drawPistol(ctx, x, y);
        else if (id === 'ammo')   gameplayScene.drawAmmo(ctx, x, y);
        else if (id === 'keycard2' || id === 'f2keycard' || id === 'shreyaId') gameplayScene.drawKeycard(ctx, x, y);
        else gameplayScene.drawUnknown(ctx, x, y);
    },

    drawShiv(ctx, px, py) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(px - 8, py + 7, 18, 3);
        ctx.fillStyle = '#e0eaf0';
        ctx.fillRect(px - 3, py - 8, 4, 10);
        ctx.fillRect(px - 2, py - 10, 3, 12);
        ctx.fillStyle = '#9eb0c0';
        ctx.fillRect(px - 1, py - 8, 1, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px - 2, py - 9, 1, 4);
        ctx.fillStyle = '#c8c0a8';
        ctx.fillRect(px - 5, py + 2, 8, 6);
        ctx.fillStyle = '#9a9078';
        ctx.fillRect(px - 5, py + 4, 8, 1);
        ctx.fillRect(px - 5, py + 6, 8, 1);
        ctx.fillStyle = 'rgba(150, 0, 0, 0.6)';
        ctx.fillRect(px - 1, py - 6, 2, 3);
    }
};