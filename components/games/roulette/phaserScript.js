// components/games/roulette/phaserScript.js
// NOTE: on exporte une STRING contenant tout le code Phaser.

export const phaserScript = `
(() => {
    // --- Constantes de roulette (européenne) ---
    const NUMBERS_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
    const REDS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const BLACKS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
    const NUMBERS = Array.from({ length: 37 }, (_, i) => i);
    const COLUMNS = [
        NUMBERS.filter(n => n !== 0 && n % 3 === 1),
        NUMBERS.filter(n => n !== 0 && n % 3 === 2),
        NUMBERS.filter(n => n !== 0 && n % 3 === 0),
    ];
    const DOZENS = [
        NUMBERS.filter(n => n >= 1 && n <= 12),
        NUMBERS.filter(n => n >= 13 && n <= 24),
        NUMBERS.filter(n => n >= 25 && n <= 36),
    ];
    const TAU = Math.PI * 2;
    const POINTER_WORLD_ANGLE = -Math.PI / 2;

    const CHIP_COLOR_MAP = {
        10: 0x2196f3, // bleu
        20: 0x2ecc71, // vert
        50: 0xf44336, // rouge
        100: 0x222222, // noir
        500: 0x8e44ad  // violet
    };

    const SAFE_LEFT = 16, SAFE_BOTTOM = 20;
    const LEFT_PANEL_GAP = 10;

    // --- État jeu ---
    let tokens = WALLET_BALANCE;
    let selectedChip = 10;
    const CHIP_VALUES = [10, 20, 50, 100, 500];

    // Agrégation par case: key -> {type, value, amount, chipNode, cellCenter}
    let agg = {};
    let lastAgg = {};
    let mise = 0;

    // Wheel anim
    let wheelContainer = null;
    let wheelRotation = 0;
    let wheelSpeed = 0;
    let wheelDirection = 1;
    let targetWheelRotation = 0;
    let isSpinning = false;
    let pendingResult = null;

    // UI refs
    let tokenText, miseText, toastText;
    let btnSpin, btnClear, btnRepeat, btnBack;
    let chipsBar = [];
    let tableCells = []; // {key, type, value, rect, center:{x,y}}

    // Utils
    function sectorCenterRelAngle(index) {
        const a0 = (index / 37) * TAU - Math.PI / 2;
        const a1 = ((index + 1) / 37) * TAU - Math.PI / 2;
        const gold = (a1 - a0) * 0.08;
        const mainStart = a0 + gold;
        return mainStart + (a1 - mainStart) * 0.5;
    }
    function colorOf(n) {
        if (n === 0) return 'green';
        if (REDS.includes(n)) return 'red';
        return 'black';
    }
    function showToast(scene, msg) {
        if (toastText) toastText.destroy();
        toastText = scene.add.text(scene.scale.width / 2, 120, msg, { font: '28px Arial', fill: '#fff', backgroundColor: '#dc3545' })
            .setPadding(10, 6).setOrigin(0.5).setDepth(2000).setAlpha(0);
        scene.tweens.add({ targets: toastText, alpha: 1, duration: 120 });
        scene.time.delayedCall(1600, () => {
            if (!toastText) return;
            scene.tweens.add({ targets: toastText, alpha: 0, duration: 180, onComplete: () => { toastText && toastText.destroy(); toastText = null; } });
        });
    }

    // Payout calc from aggregated bets
    function calcGain(num) {
        let gain = 0;
        Object.values(agg).forEach(b => {
            const a = b.amount;
            if (b.type === 'number' && b.value == num) gain += a * 36;
            else if (b.type === 'red' && REDS.includes(num)) gain += a * 2;
            else if (b.type === 'black' && BLACKS.includes(num)) gain += a * 2;
            else if (b.type === 'even' && num !== 0 && num % 2 === 0) gain += a * 2;
            else if (b.type === 'odd' && num % 2 === 1) gain += a * 2;
            else if (b.type === 'column' && COLUMNS[b.value - 1].includes(num)) gain += a * 3;
            else if (b.type === 'dozen' && DOZENS[b.value - 1].includes(num)) gain += a * 3;
            else if (b.type === 'low' && num >= 1 && num <= 18) gain += a * 2;
            else if (b.type === 'high' && num >= 19 && num <= 36) gain += a * 2;
        });
        return gain;
    }

    function aggKey(t, v) { return t + ':' + (v ?? ''); }

    function addBetToAgg(scene, type, value, amount, center) {
        const key = aggKey(type, value);
        if (!agg[key]) {
            agg[key] = { type, value, amount: 0, chipNode: null, center };
        }
        agg[key].amount += amount;
        mise += amount;

        // (Re)dessine le jeton agrégé
        const a = agg[key];
        if (a.chipNode) a.chipNode.destroy();
        a.chipNode = drawChip(scene, a.center.x, a.center.y, a.amount);
    }

    function clearBets() {
        Object.values(agg).forEach(b => { if (b.chipNode) b.chipNode.destroy(); });
        agg = {};
        mise = 0;
    }
    function repeatBets(scene) {
        clearBets();
        Object.values(lastAgg).forEach(b => addBetToAgg(scene, b.type, b.value, b.amount, b.center));
    }

    function cloneAgg(source) {
        const out = {};
        Object.entries(source).forEach(([k, v]) => {
            out[k] = { ...v, chipNode: null }; // sans node
        });
        return out;
    }

    function setButtonEnabled(btn, enabled) {
        if (!btn) return;
        if (enabled) {
            btn.zone.setInteractive({ useHandCursor: true });
            btn.g.setAlpha(1); btn.t.setAlpha(1);
        } else {
            btn.zone.disableInteractive();
            btn.g.setAlpha(0.5); btn.t.setAlpha(0.5);
        }
    }

    function drawButton(
        scene, x, y, w, h, label,
        bg = 0xFFD700, fg = '#222',
        onTap = () => { },
        depth = 1000
    ) {
        const g = scene.add.graphics().setDepth(depth);
        g.fillStyle(bg, 1).lineStyle(4, 0x000000, 0.2)
            .fillRoundedRect(x - w / 2, y - h / 2, w, h, 16)
            .strokeRoundedRect(x - w / 2, y - h / 2, w, h, 16);

        const t = scene.add.text(x, y, label, { font: 'bold 32px Arial', color: fg })
            .setOrigin(0.5).setDepth(depth + 1).setRotation(0);

        const pad = 24;
        if (t.width > w - pad) t.setScale((w - pad) / t.width);

        const zone = scene.add.zone(x, y, w, h)
            .setDepth(depth + 2)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', onTap);

        return { g, t, zone, destroy() { g.destroy(); t.destroy(); zone.destroy(); } };
    }

    function drawChip(scene, x, y, amount) {
        const color = CHIP_COLOR_MAP[amount] ?? 0xFFD700; // fallback: or
        const border = 0xffffff;
        const radius = 22;

        const g = scene.add.graphics().setDepth(900);
        g.fillStyle(color, 1).lineStyle(4, border, 1)
            .fillCircle(x, y, radius).strokeCircle(x, y, radius);

        const isGold = (color === 0xFFD700);
        const fontSize = amount >= 100 ? 16 : 18;
        const txt = scene.add.text(
            x, y, String(amount),
            { font: 'bold 18px Arial', fill: isGold ? '#222' : '#fff' }
        ).setOrigin(0.5).setDepth(901);

        return { destroy() { g.destroy(); txt.destroy(); } }
    }

    function drawWheel(scene, cx, cy, rOuter = 240, rInner = 135) {
        const cont = scene.add.container(cx, cy);
        const g = scene.add.graphics();
        cont.add(g);

        // anneau externe or
        g.lineStyle(7, 0xFFD700, 1).beginPath().arc(0, 0, rOuter + 2, 0, TAU).closePath().strokePath();

        for (let i = 0; i < 37; i++) {
            // trait doré
            let angle = (i / 37) * TAU - Math.PI / 2;
            let x1 = Math.cos(angle) * (rOuter + 2), y1 = Math.sin(angle) * (rOuter + 2);
            let x2 = Math.cos(angle) * 78, y2 = Math.sin(angle) * 78;
            g.lineStyle(4, 0xFFD700, 1).beginPath().moveTo(x1, y1).lineTo(x2, y2).closePath().strokePath();
        }

        for (let i = 0; i < 37; i++) {
            let a0 = (i / 37) * TAU - Math.PI / 2;
            let a1 = ((i + 1) / 37) * TAU - Math.PI / 2;
            let num = NUMBERS_ORDER[i];
            // espace or
            let aGold0 = a0, aGold1 = a0 + (a1 - a0) * 0.08;
            g.beginPath().arc(0, 0, rOuter, aGold0, aGold1, false).arc(0, 0, rInner, aGold1, aGold0, true).closePath()
                .fillStyle(0xFFD700, 1).fillPath();
            // case principale
            let aMain0 = aGold1, aMain1 = a1;
            let color = (num === 0 ? 0x2ecc40 : (REDS.includes(num) ? 0xC0392B : 0x222222));
            g.beginPath().arc(0, 0, rOuter, aMain0, aMain1, false).arc(0, 0, rInner, aMain1, aMain0, true).closePath()
                .fillStyle(color, 1).fillPath();

            // numéro
            let angleText = (a0 + a1) / 2, rText = rOuter - 40;
            let xT = Math.cos(angleText) * rText, yT = Math.sin(angleText) * rText;
            const t = scene.add.text(xT, yT, String(num), { font: 'bold 24px Arial', color: '#fff' }).setOrigin(0.5);
            cont.add(t);
        }

        // centre
        g.lineStyle(16, 0xFFD700, 1).beginPath().arc(0, 0, 78, 0, TAU).closePath().strokePath();
        g.fillStyle(0xA0522D, 1).fillCircle(0, 0, 70);
        for (let i = 0; i < 6; i++) {
            let ang = (i / 6) * TAU, x1 = Math.cos(ang) * 24, y1 = Math.sin(ang) * 24, x2 = Math.cos(ang) * 62, y2 = Math.sin(ang) * 62;
            g.lineStyle(4, 0xFFD700, 1).beginPath().moveTo(x1, y1).lineTo(x2, y2).closePath().strokePath();
        }
        g.fillStyle(0xFFD700, 1).fillCircle(0, 0, 24);
        g.fillStyle(0x222222, 1).fillCircle(0, 0, 14);

        // flèche fixe
        const px = cx, py = cy - rOuter - 6;
        const ptr = scene.add.graphics();
        ptr.fillStyle(0xFFD700, 1).lineStyle(4, 0x000000, 0.7);
        const W = 64, H = 120;
        ptr.fillTriangle(px, py, px - W / 2, py - H, px + W / 2, py - H);
        ptr.strokeTriangle(px, py, px - W / 2, py - H, px + W / 2, py - H);
        ptr.fillStyle(0xA67C00, 1).fillRect(px - 20, py - H - 10, 40, 16);

        return cont;
    }

    function buildTableContainer(scene, cellW = 56, cellH = 44, gap = 6) {
        const c = scene.add.container(0, 0);
        const labels = [];
        const reds = new Set(REDS);

        tableCells = [];

        const addCell = (x, y, w, h, fill, text, meta) => {
            const rect = scene.add
                .rectangle(x + w / 2, y + h / 2, w, h, fill, 1)
                .setStrokeStyle(3, 0xFFD700)
                .setInteractive({ useHandCursor: true });

            const label = scene.add
                .text(rect.x, rect.y, text, {
                    font: meta.type === 'number' ? 'bold 22px Arial' : 'bold 18px Arial',
                    color: fill === 0xffffff ? '#222' : '#fff',
                })
                .setOrigin(0.5);

            rect.on('pointerdown', () => {
                const b = rect.getBounds();
                const center = { x: b.centerX, y: b.centerY };
                addBetToAgg(scene, meta.type, meta.value, selectedChip, center);
                updateTopTexts();
            });

            c.add(rect);
            c.add(label);
            labels.push(label);
            tableCells.push({ key: aggKey(meta.type, meta.value), type: meta.type, value: meta.value, rect });
        };

        const leftX = 0, topY = 0;

        // "0" à gauche
        addCell(leftX, topY, cellW, cellH * 3 + gap * 2, 0x2ecc40, '0', { type: 'number', value: 0 });

        // Grille 1..36 (3 lignes x 12 colonnes)
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 12; col++) {
                const n = col + 1 + row * 12;
                const x = leftX + cellW + gap + col * (cellW + gap);
                const y = topY + row * (cellH + gap);
                const fill = reds.has(n) ? 0xC0392B : 0x222222;
                addCell(x, y, cellW, cellH, fill, String(n), { type: 'number', value: n });
            }
        }

        // "2 to 1" à droite de chaque ligne
        for (let i = 0; i < 3; i++) {
            const x = leftX + cellW + gap + 12 * (cellW + gap);
            const y = topY + i * (cellH + gap);
            addCell(x, y, cellW, cellH, 0xFFD700, '2 to 1', { type: 'column', value: i + 1 });
        }

        // Douzaines
        const dozenY = topY + 3 * (cellH + gap) + 8;
        const dozenW = 4 * cellW + 3 * gap;
        const dozenStartX = leftX + cellW + gap;
        addCell(dozenStartX, dozenY, dozenW, cellH, 0xFFD700, '1st 12', { type: 'dozen', value: 1 });
        addCell(dozenStartX + dozenW + gap, dozenY, dozenW, cellH, 0xFFD700, '2nd 12', { type: 'dozen', value: 2 });
        addCell(dozenStartX + 2 * (dozenW + gap), dozenY, dozenW, cellH, 0xFFD700, '3rd 12', { type: 'dozen', value: 3 });

        // Mises extérieures
        const outY = dozenY + cellH + 10;
        const lowW = 2 * cellW + gap;
        const midW = 1.5 * cellW;
        const seq = [
            { w: lowW, txt: '1 to 18', type: 'low' },
            { w: midW, txt: 'EVEN', type: 'even' },
            { w: midW, txt: '◆', type: 'red' },
            { w: midW, txt: '◆', type: 'black' },
            { w: midW, txt: 'ODD', type: 'odd' },
            { w: lowW, txt: '19 to 36', type: 'high' },
        ];
        let curX = dozenStartX;
        seq.forEach((s) => {
            const fill = s.type === 'red' ? 0xC0392B : s.type === 'black' ? 0x222222 : 0xffffff;
            addCell(curX, outY, s.w, cellH, fill, s.txt, { type: s.type });
            curX += s.w + gap;
        });

        return { container: c, labels };
    }

    function placeTableRight(scene, tableContainer, labels, rightCenterX, maxRightWidth, topMargin = 16, bottomMargin = 16, yOffset = 0) {
        // pivote la table
        tableContainer.rotation = -Math.PI / 2;

        // bounds avant scale
        const b = tableContainer.getBounds();
        const availH = scene.scale.height - Math.max(topMargin, 40) - Math.max(bottomMargin, 40);
        const availW = Math.max(0, maxRightWidth - 8);

        const scale = Math.min(availW / b.width, availH / b.height);
        tableContainer.setScale(scale);

        tableContainer.x = rightCenterX;
        tableContainer.y = scene.scale.height / 2 + yOffset;

        // remet les labels à l'endroit
        labels.forEach(lbl => lbl.setRotation(Math.PI / 2));
    }

    function buildChipsColumn(scene, x, anchorY, spacing = 76, align = 'center', dx = 4) {
        chipsBar.forEach(o => o.destroy && o.destroy());
        chipsBar = [];

        const values = [...CHIP_VALUES];
        const startY = (align === 'center')
            ? anchorY - ((values.length - 1) * spacing) / 2
            : anchorY;

        values.forEach((v, i) => {
            const y = (align === 'center') ? (startY + i * spacing) : (anchorY - i * spacing);
            const node = drawChip(scene, x + dx, y, v);
            const zone = scene.add
                .zone(x + dx, y, 58, 58)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    selectedChip = v;
                    const halo = scene.add.graphics().lineStyle(4, 0xffffff, 1).strokeCircle(x + dx, y, 30).setDepth(902);
                    scene.time.delayedCall(180, () => halo.destroy());
                });
            chipsBar.push({ ...node, destroy() { node.destroy(); zone.destroy(); } });
        });
    }

    function buildButtonsColumn(scene, x, bottomY, spacing = 90) {
        if (btnSpin) btnSpin.destroy();
        if (btnClear) btnClear.destroy();
        if (btnRepeat) btnRepeat.destroy();

        // ordre (bas → haut) : Spin, Clear, Répéter
        btnSpin = drawButton(scene, x, bottomY, 160, 64, 'Spin', 0xFFD700, '#222', () => onSpin(scene));
        btnClear = drawButton(scene, x, bottomY - spacing, 160, 64, 'Clear', 0xEEEEEE, '#222', () => {
            clearBets();
            updateTopTexts();
        });
        btnRepeat = drawButton(scene, x, bottomY - spacing * 2, 160, 64, 'Répéter', 0xEEEEEE, '#222', () => {
            repeatBets(scene);
            updateTopTexts();
        });
    }

    function updateTopTexts() {
        if (tokenText) tokenText.setText('Jetons : ' + tokens);
        if (miseText) miseText.setText('Mise : ' + mise);
    }

    function resultOverlay(scene, winningNumber, gain, onClose) {
        const W = scene.scale.width, H = scene.scale.height;
        const baseDepth = 5000;

        // Fond assombri
        const shade = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setDepth(baseDepth)
            .setInteractive();

        const boxW = Math.min(520, W - 60), boxH = 360;
        const box = scene.add.rectangle(W / 2, H / 2, boxW, boxH, 0xffffff, 1)
            .setStrokeStyle(6, 0x000000, 0.2)
            .setDepth(baseDepth + 1);

        const title = scene.add.text(W / 2, H / 2 - boxH / 2 + 60, 'Résultat',
            { font: 'bold 42px Arial', color: '#333' })
            .setOrigin(0.5).setDepth(baseDepth + 2);

        // Badge + numéro
        const badgeR = 42, badgeX = W / 2, badgeY = H / 2 - 20;
        const badge = scene.add.circle(
            badgeX, badgeY, badgeR,
            (winningNumber === 0 ? 0x00a000 : (REDS.includes(winningNumber) ? 0xC02C29 : 0x222222))
        ).setDepth(baseDepth + 2);
        const numberText = scene.add.text(badgeX, badgeY, String(winningNumber),
            { font: 'bold 30px Arial', color: '#fff' })
            .setOrigin(0.5).setDepth(baseDepth + 3);

        // Texte de gain
        const gainText = scene.add.text(W / 2, H / 2 + 40, 'Gain : ' + gain,
            { font: 'bold 36px Arial', color: (gain > 0 ? '#008000' : '#C02C29') })
            .setOrigin(0.5).setDepth(baseDepth + 2);

        // Bouton Fermer
        const close = drawButton(
            scene, W / 2, H / 2 + boxH / 2 - 48, 200, 64,
            'Fermer', 0x1E88E5, '#fff',
            () => {
                [shade, box, title, badge, numberText, gainText].forEach(o => o.destroy());
                close.destroy();
                onClose && onClose();
            },
            baseDepth + 3
        );

        return {
            destroy() {
                [shade, box, title, badge, numberText, gainText].forEach(o => o.destroy());
                close.destroy();
            }
        };
    }

    // --- Phaser game ---
    const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: 'game',
        backgroundColor: 'transparent',
        transparent: true,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 720, height: 1280 },
        scene: { create, update }
    });

    let sceneRef = null;

    function create() {
        const scene = this; sceneRef = scene;
        const W = scene.scale.width, H = scene.scale.height;

        // TOP UI
        tokenText = scene.add.text(W - 24, 24, 'Jetons : ' + tokens, { font: 'bold 34px Arial', fill: '#FFD700' }).setOrigin(1, 0).setDepth(1000);
        miseText = scene.add.text(W - 24, 64, 'Mise : ' + mise, { font: 'bold 26px Arial', fill: '#FFD700' }).setOrigin(1, 0).setDepth(1000);

        // Back
        btnBack = drawButton(scene, 70, 52, 96, 56, '←', 0xFFD700, '#222', () => {
            if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'goBack' }));
            else history.back();
        });

        // ROUE
        wheelContainer = drawWheel(scene, W / 2, 360);

        // TABLE (verticale, à droite)
        const rightCenterX = W - 350;
        const maxRightWidth = 350;
        const { container: tCont, labels } = buildTableContainer(scene, 60, 100, 6);
        const TABLE_Y_OFFSET = 600;
        placeTableRight(scene, tCont, labels, rightCenterX, maxRightWidth, 16, 16, TABLE_Y_OFFSET);

        // CHIPS (colonne centrée), à gauche de la table
        const chipsX = rightCenterX - maxRightWidth / 2 - LEFT_PANEL_GAP + 100;
        const CHIPS_Y_OFFSET = 420;
        buildChipsColumn(scene, chipsX, H / 2 + CHIPS_Y_OFFSET, 78, 'center', 4);

        // BOUTONS (colonne verticale)
        const btnsX = chipsX - LEFT_PANEL_GAP - 150;
        const bottomY = H - SAFE_BOTTOM - 80;
        buildButtonsColumn(scene, btnsX, bottomY);
    }

    function onSpin(scene) {
        if (isSpinning) return;
        if (mise < 10) { showToast(scene, 'Mise minimale : 10'); return; }
        if (tokens < mise) { showToast(scene, 'Solde insuffisant'); return; }

        setButtonEnabled(btnBack, false);

        // Déduire la mise dès le clic (affichage immédiat)
        tokens -= mise; updateTopTexts();

        // Snapshot pour l'envoi RN + calcul
        const betsArray = Object.values(agg).map(b => ({ type: b.type, value: b.value, amount: b.amount }));
        const winningNumber = Math.floor(Math.random() * 37);
        const gain = calcGain(winningNumber);

        // Sauvegarder pour "Répéter" puis nettoyer
        lastAgg = cloneAgg(agg);

        // Préparer anim roue
        isSpinning = true;
        wheelDirection = 1;
        wheelSpeed = 0.16;

        // Cible
        const winIndex = NUMBERS_ORDER.indexOf(winningNumber);
        const MIN_TURNS = 3;
        if (winIndex !== -1) {
            const centerRel = sectorCenterRelAngle(winIndex);
            const baseTarget = POINTER_WORLD_ANGLE - centerRel;
            const deltaCW0 = baseTarget - wheelRotation;
            const deltaCW = ((deltaCW0 % TAU) + TAU) % TAU;
            const delta = deltaCW + MIN_TURNS * TAU;
            targetWheelRotation = wheelRotation + delta;
        } else {
            targetWheelRotation = wheelRotation + MIN_TURNS * TAU;
        }

        pendingResult = { winningNumber, gain, betsArray, wager: mise };
        clearBets(); updateTopTexts();
    }

    function update() {
        const scene = this;
        if (!isSpinning) return;

        // Avancer la roue
        wheelRotation += wheelSpeed * wheelDirection;
        if (wheelContainer) wheelContainer.rotation = wheelRotation;

        let remaining = targetWheelRotation - wheelRotation;
        const remainingTurns = Math.max(remaining / TAU, 0);

        if (remainingTurns > 3) wheelSpeed = Math.max(wheelSpeed * 0.999, 0.08);
        else if (remainingTurns > 2) wheelSpeed = Math.max(wheelSpeed * 0.997, 0.06);
        else if (remainingTurns > 1) wheelSpeed = Math.max(wheelSpeed * 0.994, 0.045);
        else if (remainingTurns > 0.5) wheelSpeed = Math.max(wheelSpeed * 0.988, 0.03);
        else if (remainingTurns > 0.2) wheelSpeed = Math.max(wheelSpeed * 0.96, 0.02);
        else if (remainingTurns > 0.05) wheelSpeed = Math.max(wheelSpeed * 0.90, 0.012);
        else {
            wheelRotation = targetWheelRotation;
            if (wheelContainer) wheelContainer.rotation = wheelRotation;
            isSpinning = false;
            setButtonEnabled(btnBack, true);
            if (pendingResult) {
                const { winningNumber, gain, betsArray, wager } = pendingResult;
                pendingResult = null;

                // Overlay résultat, crédite les gains, puis envoie à RN
                resultOverlay(scene, winningNumber, gain, () => {
                    tokens += gain; updateTopTexts();
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            result: {
                                game: 'roulette',
                                wager,
                                payout: gain,
                                winningNumber,
                                bets: betsArray
                            }
                        }));
                    }
                });
            }
            return;
        }

        if (wheelRotation >= targetWheelRotation) {
            wheelRotation = targetWheelRotation;
            if (wheelContainer) wheelContainer.rotation = wheelRotation;
            isSpinning = false;
            setButtonEnabled(btnBack, true);
            if (pendingResult) {
                const { winningNumber, gain, betsArray, wager } = pendingResult;
                pendingResult = null;
                resultOverlay(scene, winningNumber, gain, () => {
                    tokens += gain; updateTopTexts();
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            result: { game: 'roulette', wager, payout: gain, winningNumber, bets: betsArray }
                        }));
                    }
                });
            }
        }
    }
})();
`
