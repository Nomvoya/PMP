(() => {
'use strict';
const $ = id => document.getElementById(id);
const canvas = $('gameCanvas');
if (!canvas) return; // Keluar jika game canvas tidak ada di halaman ini
const gameVisible = () => {
    const sg = $('scene-game');
    return sg ? sg.classList.contains('active') : false;
};
const ctx = canvas.getContext('2d');

/* ============================ KONSTANTA DUNIA ============================ */
const WORLD = { width: 1200, depthY: 360, floorY: 380 };
const GATE_X = 400;                                            // gerbang Zona Bahaya
const FORKLIFT_Y = 195, FORKLIFT_L = 55;                       // lorong forklift (sumbu Y)
const SAFE_ZONE = { x: 410, y: 256, w: 720, l: 104 };         // jalur pejalan kaki (zona aman)
const EXIT_X = 1130;
const PHOTO_RANGE = 380, PHOTO_CONE = 0.38;
const APD_TOTAL = 5, HAZARD_IDS = ['forklift', 'pallet', 'oil', 'manual', 'pinch'];

/* ============================ DATA KONTEN K3 ============================ */
const APD_DEFS = [
    { id: 'helm',   icon: '⛑️', name: 'Helm Safety + Tali Dagu', color: '#f1c40f', tip: 'Helm melindungi kepala dari benda jatuh; tali dagu menjaga helm tetap terpasang saat membungkuk.' },
    { id: 'sepatu', icon: '🥾', name: 'Sepatu Safety (Steel Toe)', color: '#95a5a6', tip: 'Ujung baja menahan beban tindih; sol anti-slip mengurangi risiko terpeleset.' },
    { id: 'rompi',  icon: '🦺', name: 'Rompi High-Vis', color: '#c6f135', tip: 'Warna terang & reflektif membuat Anda terlihat jelas oleh operator forklift.' },
    { id: 'sarung', icon: '🧤', name: 'Sarung Tangan Kerja', color: '#e67e22', tip: 'Melindungi tangan dari gesekan, luka, dan titik terjepit saat menangani muatan.' },
    { id: 'masker', icon: '🥽', name: 'Masker / Kacamata', color: '#5dade2', tip: 'Melindungi mata dan saluran napas dari debu muatan dan percikan.' }
];

const HAZ = {
    forklift: {
        short: 'FORKLIFT', label: 'FORKLIFT BERJALAN', icon: '🚜', title: 'Lalu Lintas Forklift',
        why: 'Forklift berbobot beberapa ton, jarak berhentinya panjang, dan muatan sering menghalangi pandangan operator (blind spot). Tabrakan dengan pejalan kaki adalah salah satu penyebab kecelakaan fatal di area bongkar muat.',
        fix: 'Pisahkan jalur pejalan kaki dan forklift, gunakan rompi high-vis, jangan melintas di depan/belakang forklift yang bergerak, batasi kecepatan, pasang klakson & lampu strobo, dan WAJIB lakukan kontak mata/sinyal ke operator sebelum menyeberang (STOP-THINK-ACT).',
        ref: 'Modul 2 (Pengendalian Bahaya) & Modul 4 (Prosedur Kerja Aman). Dasar: UU No. 1/1970 (pencegahan kecelakaan), PP No. 50/2012 (identifikasi bahaya & pengendalian operasi).'
    },
    pallet: {
        short: 'PALET MIRING', label: 'PALET / KARDUS MIRING', icon: '📦', title: 'Palet & Kardus Miring di Rak',
        why: 'Muatan yang miring menggeser pusat gravitasi tumpukan sehingga mudah jatuh atau merobohkan rak. Beban yang jatuh dari ketinggian membawa energi besar dan dapat menyebabkan cedera kepala berat.',
        fix: 'Susun muatan rata dan rapat, patuhi batas beban rak, ikat dengan strapping/stretch wrap, ganti palet rusak, jangan menumpuk melebihi tinggi aman, jangan berdiri di bawah muatan tinggi, dan selalu pakai helm safety.',
        ref: 'Modul 2 (Tumpukan/Rak Miring) & Modul 3 (Helm Safety). Dasar: PP No. 50/2012 – pengendalian risiko pada sumbernya.'
    },
    oil: {
        short: 'TUMPAHAN OLI', label: 'TUMPAHAN OLI', icon: '🛢️', title: 'Tumpahan Oli (Lantai Licin)',
        why: 'Oli menurunkan koefisien gesek lantai sehingga langkah kaki tidak mencengkeram. Terpeleset, tersandung, dan jatuh (slip, trip, fall) termasuk penyebab cedera kerja yang paling sering terjadi.',
        fix: 'Beri rambu "Lantai Licin", serap dengan absorbent lalu bersihkan, laporkan dan perbaiki sumber kebocoran, terapkan housekeeping (5R), serta gunakan sepatu safety dengan sol anti-slip.',
        ref: 'Modul 2 (Tumpahan Oli) & Modul 3 (Sepatu Safety). Dasar: UU No. 1/1970 – syarat keselamatan kerja untuk mencegah kecelakaan.'
    },
    manual: {
        short: 'MANUAL HANDLING', label: 'MANUAL HANDLING SALAH', icon: '🏋️', title: 'Manual Handling Tidak Aman',
        why: 'Mengangkat beban berat dengan punggung membungkuk membebani ruas tulang belakang bagian bawah (L5-S1) dan memicu cedera otot-rangka (MSDs) serta nyeri punggung bawah, bahkan cedera permanen.',
        fix: 'Gunakan alat bantu (trolley/hand pallet), tekuk lutut dan jaga punggung tetap lurus, dekatkan beban ke tubuh, hindari memutar badan saat mengangkat, bagi beban atau angkat berdua, dan pakai sarung tangan kerja.',
        ref: 'Modul 2 (Manual Handling) & Modul 3 (Sarung Tangan). Dasar: UU No. 1/1970 & PP No. 50/2012 – pencegahan penyakit akibat kerja.'
    },
    pinch: {
        short: 'TITIK TERJEPIT', label: 'TITIK TERJEPIT', icon: '✋', title: 'Titik Terjepit (Pinch Point)',
        why: 'Celah sempit antara tumpukan muatan, rak, atau dinding dapat menjepit tangan/kaki saat muatan bergeser atau dipindahkan. Cedera jepit sering menyebabkan patah tulang dan amputasi.',
        fix: 'Jaga jarak aman (clearance) antar tumpukan, beri marka kuning-hitam pada pinch point, jangan menaruh tangan di celah saat muatan bergerak, berkomunikasi dengan operator, dan pakai sarung tangan serta sepatu safety.',
        ref: 'Modul 2 (Titik Terjepit). Dasar: PP No. 50/2012 – identifikasi bahaya & penilaian risiko.'
    }
};

const EDU_STA = {
    icon: '✋', title: 'STOP – THINK – ACT',
    why: 'Operator forklift sering tidak melihat pejalan kaki karena blind spot dan muatan. Melintas tanpa memastikan operator melihat Anda adalah kesalahan prosedur yang berujung tabrakan.',
    fix: 'STOP: berhenti di zona aman, jangan melintas dulu. THINK: nilai posisi, kecepatan, dan jarak forklift. ACT: lakukan kontak mata dan beri sinyal, tunggu forklift berhenti total, baru melintas dengan cepat dan tetap waspada.',
    ref: 'Modul 4 (Prosedur Kerja Aman). Dasar: PP No. 50/2012 – prosedur kerja aman & pengendalian operasi.'
};

/* ============================ ENTITAS STATIS ============================ */
// Semua objek dunia memakai kotak 3D: x,y (lantai), w,l (lebar/panjang), h (tinggi), elev (ketinggian dasar).
const shelf    = { x: 520,  y: 110, w: 140, l: 70, h: 90 };
const palletBox = { x: 575, y: 118, w: 62,  l: 54, h: 30, elev: 90 };
const oilBox   = { x: 740,  y: 268, w: 100, l: 56, h: 4,  elev: 0 };
const manualBox = { x: 840, y: 70,  w: 76,  l: 50, h: 50, elev: 0 };
const pinchA   = { x: 1000, y: 60,  w: 50,  l: 60, h: 60 };
const pinchB   = { x: 1072, y: 60,  w: 50,  l: 60, h: 60 };
const pinchBox = { x: 1031, y: 60,  w: 60,  l: 60, h: 60, elev: 0 };
const solids = [shelf, pinchA, pinchB];

/* ============================ STATE ============================ */
const game = { phase: 'START', paused: false, anim: 0, modalAt: 0 };
const viewState = { mode: 'side' };
const camera = { x: 0, y: 0 };
const keys = { left: false, right: false, up: false, down: false, jump: false };
let player, forklift, apdItems, state;

function resetGame() {
    player = {
        x: 60, y: 290, z: 0, width: 32, length: 32, height: 42,
        vx: 0, vy: 0, vz: 0, speed: 260, jumpPower: -420, gravity: 1300, grounded: true,
        hp: 100, maxHp: 100, invulnerableTimer: 0, slipTimer: 0, slipDir: 1
    };
    forklift = { x: 560, y: FORKLIFT_Y, w: 85, l: FORKLIFT_L, h: 50, dirX: 1, speed: 110, minX: 430, maxX: 1035, stopTimer: 0, hornTimer: 0 };
    apdItems = APD_DEFS.map((d, i) => ({ ...d, x: 70 + i * 62, y: 285, w: 28, l: 28, got: false }));
    state = {
        activeItem: 'hand', pointerX: 500, pointerY: 300, score: 0,
        photographed: { forklift: false, pallet: false, oil: false, manual: false, pinch: false },
        signalCount: 0, signalCooldown: 0, flash: 0, messageTimer: 0, gateMsgCd: 0, exitMsgCd: 0, staShown: false
    };
    viewState.mode = 'side';
    camera.x = 0; camera.y = 0;
    Object.keys(keys).forEach(k => keys[k] = false);
    setEquip('hand');
    $('btnView').textContent = '👁 Samping';
    $('btnJump').style.opacity = '1';
    $('staBanner').classList.add('hidden');
    $('statusMessage').textContent = '';
    buildApdRow();
    updateHUD();
}

/* ============================ UTIL ============================ */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const overlapXY = (x, y, w, l, b) => x + w > b.x && x < b.x + b.w && y + l > b.y && y < b.y + b.l;
const apdCount = () => apdItems.filter(a => a.got).length;
const allAPD = () => apdCount() === APD_TOTAL;
const hazardCount = () => HAZARD_IDS.filter(id => state.photographed[id]).length;
const damageMul = () => 1 - 0.12 * apdCount();   // tiap APD mengurangi cedera 12% (lengkap = 60% proteksi)

function showMessage(msg, ms = 2600) {
    const el = $('statusMessage');
    el.textContent = msg;
    clearTimeout(state.messageTimer);
    state.messageTimer = setTimeout(() => { el.textContent = ''; }, ms);
}
function triggerDamageFlash() {
    const f = $('damageFlash'); f.style.opacity = '1';
    setTimeout(() => { f.style.opacity = '0'; }, 180);
}
let audioCtx = null;
function beep(freq = 440, dur = 0.15, type = 'sine', vol = 0.05) {
    try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = type; o.frequency.value = freq; g.gain.value = vol;
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
        o.stop(audioCtx.currentTime + dur);
    } catch (e) { /* audio opsional */ }
}
const horn = () => { beep(320, 0.35, 'square', 0.07); setTimeout(() => beep(400, 0.4, 'square', 0.07), 380); };

function buildApdRow() {
    $('apdRow').innerHTML = apdItems.map(a => `<span id="apd_${a.id}" title="${a.name}">${a.icon}</span>`).join('');
}
function updateHUD() {
    $('hpBar').style.width = `${(player.hp / player.maxHp) * 100}%`;
    $('scoreDisplay').textContent = `Skor ${state.score}`;
    apdItems.forEach(a => $('apd_' + a.id).classList.toggle('on', a.got));
    $('apdCount').textContent = `${apdCount()}/${APD_TOTAL}`;
    $('apdChip').classList.toggle('done', allAPD());
    $('hazChip').textContent = `🔍 Bahaya ${hazardCount()}/5`;
    $('hazChip').classList.toggle('done', hazardCount() === 5);
    $('sigChip').textContent = `✋ Sinyal ${Math.min(state.signalCount, 1)}/1`;
    $('sigChip').classList.toggle('done', state.signalCount >= 1);
}
function setEquip(item) {
    state.activeItem = item;
    $('slotHand').classList.toggle('active', item === 'hand');
    $('slotCamera').classList.toggle('active', item === 'camera');
}
function switchViewMode() {
    viewState.mode = viewState.mode === 'side' ? 'top' : 'side';
    $('btnView').textContent = viewState.mode === 'side' ? '👁 Samping' : '👁 Atas';
    $('btnJump').style.opacity = viewState.mode === 'top' ? '0.4' : '1';
}

/* ============================ ZONA & POSISI ============================ */
function inSafeZone() {
    const cx = player.x + player.width / 2, cy = player.y + player.length / 2;
    return cx >= SAFE_ZONE.x && cx <= SAFE_ZONE.x + SAFE_ZONE.w && cy >= SAFE_ZONE.y && cy <= SAFE_ZONE.y + SAFE_ZONE.l;
}
function inForkliftLane() {
    return player.y + player.length > FORKLIFT_Y && player.y < FORKLIFT_Y + FORKLIFT_L;
}
let lastZone = '';
function updateZoneChip() {
    const cx = player.x + player.width / 2;
    let txt, cls = '';
    if (cx < GATE_X) txt = '📍 Area Pre-Check';
    else if (inForkliftLane()) { txt = '⚠️ Jalur Forklift'; cls = 'danger'; }
    else if (inSafeZone()) { txt = '✅ Zona Aman Pejalan'; cls = 'safe'; }
    else txt = '📍 Area Rak / Gudang';
    if (txt === lastZone) return;
    lastZone = txt;
    const chip = $('zoneChip'); chip.textContent = txt; chip.className = 'chip ' + cls;
}
function targetBox(id) {
    switch (id) {
        case 'forklift': return { x: forklift.x, y: forklift.y, w: forklift.w, l: forklift.l, h: forklift.h, elev: 0 };
        case 'pallet': return palletBox;
        case 'oil': return oilBox;
        case 'manual': return manualBox;
        default: return pinchBox;
    }
}
function boxCenterWorld(b) {
    if (viewState.mode === 'side') return { x: b.x + b.w / 2, y: WORLD.floorY - (b.elev || 0) - b.h / 2 };
    return { x: b.x + b.w / 2, y: b.y + b.l / 2 };
}
function playerCenterWorld() {
    if (viewState.mode === 'side') return { x: player.x + player.width / 2, y: WORLD.floorY - player.height / 2 + player.z };
    return { x: player.x + player.width / 2, y: player.y + player.length / 2 };
}

/* ============================ AKSI PEMAIN ============================ */
function nearestApd() {
    let best = null, bd = 48;
    for (const a of apdItems) {
        if (a.got) continue;
        const d = Math.hypot((player.x + 16) - (a.x + 14), (player.y + 16) - (a.y + 14));
        if (d <= bd) { bd = d; best = a; }
    }
    return best;
}
function wearAPD() {
    if (game.phase !== 'PLAY' || game.paused) return;
    const a = nearestApd();
    if (!a) { showMessage('Dekati item APD di Area Pre-Check, lalu tekan [F].'); return; }
    a.got = true; state.score += 20; beep(660, 0.12, 'triangle');
    if (allAPD()) {
        state.score += 50; beep(880, 0.25, 'triangle');
        showMessage('🛡️ APD LENGKAP (5/5)! Gerbang Zona Bahaya terbuka (+50 Bonus). Proteksi cedera aktif.', 3600);
    } else {
        showMessage(`${a.icon} ${a.name} dipakai (+20). ${a.tip}`, 3600);
    }
    updateHUD();
}
function takePhoto() {
    if (game.phase !== 'PLAY' || game.paused) return;
    if (state.activeItem !== 'camera') { showMessage('Pilih mode kamera (📷 atau tombol [2]) untuk memotret!'); return; }
    const pc = playerCenterWorld();
    const ps = { x: pc.x - camera.x, y: pc.y - camera.y };
    const aim = Math.atan2(state.pointerY - ps.y, state.pointerX - ps.x);
    state.flash = 0.25; beep(1200, 0.06, 'square', 0.03);

    const target = HAZARD_IDS
        .filter(id => !state.photographed[id])
        .map(id => {
            const c = boxCenterWorld(targetBox(id));
            const dx = c.x - pc.x, dy = c.y - pc.y;
            const ang = Math.atan2(dy, dx);
            const diff = Math.abs(Math.atan2(Math.sin(ang - aim), Math.cos(ang - aim)));
            return { id, dist: Math.hypot(dx, dy), diff };
        })
        .filter(t => t.dist <= PHOTO_RANGE && t.diff <= PHOTO_CONE)
        .sort((a, b) => a.dist - b.dist)[0];

    if (target) {
        state.photographed[target.id] = true;
        state.score += 100; updateHUD();
        openModal(HAZ[target.id], `Bahaya Teridentifikasi (${hazardCount()}/5) • +100 Poin`);
    } else {
        state.score = Math.max(0, state.score - 10); updateHUD();
        showMessage('⚠️ Foto meleset / sudah terdokumentasi. Arahkan bidikan tepat ke objek bahaya (-10 Poin).');
    }
}
function giveSignal() {
    if (game.phase !== 'PLAY' || game.paused) return;
    if (!inSafeZone()) { showMessage('Berdiri di Zona Aman (area hijau dekat jalur forklift) untuk memberi sinyal.'); return; }
    if (forklift.stopTimer > 0 || state.signalCooldown > 0) { showMessage('Forklift sedang berhenti / sinyal baru saja diberikan. Tunggu sebentar.'); return; }
    forklift.stopTimer = 4; forklift.hornTimer = 1.2; state.signalCooldown = 9; horn();
    state.signalCount++;
    if (state.signalCount <= 3) {
        state.score += 50;
        showMessage('✋ Kontak mata OK! Forklift klakson & berhenti 4 detik. Silakan melintas (+50 Poin K3).', 3600);
    } else {
        showMessage('✋ Sinyal berhasil. Forklift berhenti 4 detik (poin sinyal maksimal sudah didapat).', 3000);
    }
    updateHUD();
    if (!state.staShown) { state.staShown = true; openModal(EDU_STA, 'Prosedur Kerja Aman • +50 Poin K3'); }
}

/* ============================ MODAL ============================ */
function openModal(d, sub) {
    $('mIcon').textContent = d.icon; $('mTitle').textContent = d.title; $('mSub').textContent = sub;
    $('mWhy').textContent = d.why; $('mFix').textContent = d.fix; $('mRef').textContent = d.ref;
    $('eduModal').classList.remove('hidden');
    game.paused = true; game.modalAt = performance.now();
    Object.keys(keys).forEach(k => keys[k] = false);
}
function closeModal() {
    if (performance.now() - game.modalAt < 350) return;
    $('eduModal').classList.add('hidden');
    game.paused = false;
}

/* ============================ ALUR GAME ============================ */
function startGame() {
    resetGame();
    game.phase = 'PLAY'; game.paused = false;
    $('startScreen').classList.add('hidden'); $('resultScreen').classList.add('hidden'); $('eduModal').classList.add('hidden');
    beep(660, 0.1, 'triangle');
    showMessage('Pre-Check: dekati tiap APD lalu tekan [F]. Pakai 5 APD agar gerbang terbuka.', 4200);
}
function tryExit() {
    if (state.exitMsgCd > 0) return;
    const missing = [];
    if (hazardCount() < 5) missing.push(`foto bahaya (${hazardCount()}/5)`);
    if (state.signalCount < 1) missing.push('sinyal kontak mata ke forklift');
    if (!missing.length) { endGame(true); return; }
    state.exitMsgCd = 2.5;
    showMessage('🚪 Inspeksi belum lengkap: ' + missing.join(' & ') + '.', 3000);
}
function endGame(success) {
    game.phase = 'RESULT'; game.paused = false;
    Object.keys(keys).forEach(k => keys[k] = false);
    $('staBanner').classList.add('hidden');
    const found = hazardCount(), apd = apdCount();
    const hpBonus = success ? player.hp * 2 : 0;
    const total = state.score + hpBonus;
    const pct = Math.min(1, total / 1000);
    const grade = pct >= 0.8 ? 'A – Sangat Baik' : pct >= 0.6 ? 'B – Baik' : pct >= 0.4 ? 'C – Cukup' : 'D – Perlu Latihan';
    const badge = success && found === 5 && apd === APD_TOTAL && state.signalCount >= 1 && player.hp > 0;
    const hzList = HAZARD_IDS.map(id => {
        const ok = state.photographed[id];
        return `<li><span class="${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'}</span> ${HAZ[id].icon} <b>${HAZ[id].label}</b>${ok ? '' : ' – belum teridentifikasi'}</li>`;
    }).join('');
    $('resultBody').innerHTML = `
        <div class="kicker">RESULT SCREEN • RINGKASAN INSPEKSI K3</div>
        <div class="badge-big ${badge ? '' : 'fail'}">
            <div class="medal">${badge ? '🏅' : (player.hp <= 0 ? '🚑' : '📋')}</div>
            <div class="name">${badge ? 'Pekerja Siaga K3' : (player.hp <= 0 ? 'Cedera Kerja – Inspeksi Dihentikan' : 'Belum Lulus Lencana')}</div>
        </div>
        <p style="text-align:center">${badge
            ? 'Selamat! Anda lengkap ber-APD, mengidentifikasi seluruh bahaya, dan menerapkan STOP-THINK-ACT.'
            : (player.hp <= 0 ? 'Kondisi fisik Anda habis akibat kecelakaan. Di dunia nyata, setiap kecelakaan harus dicegah lewat identifikasi bahaya, APD, dan prosedur aman.' : 'Ulangi inspeksi dan penuhi semua syarat untuk meraih lencana.')}</p>
        <div class="stats">
            <div class="stat">Skor Inspeksi<b>${state.score}</b></div>
            <div class="stat">Bonus Sisa HP<b>+${hpBonus}</b></div>
            <div class="stat">Sisa HP<b>${player.hp}/${player.maxHp}</b></div>
            <div class="stat">Skor Akhir • Nilai<b>${total} • ${grade.split(' ')[0]}</b></div>
            <div class="stat">Hazard Teridentifikasi<b>${found}/5</b></div>
            <div class="stat">APD Lengkap • Sinyal<b>${apd}/5 • ${state.signalCount}x</b></div>
        </div>
        <ul class="hz-list">${hzList}</ul>
        <div class="reg">Peringkat: <b>${grade}</b><br>Ingat: UU No. 1/1970 &amp; PP No. 50/2012 – K3 bertujuan mencegah kecelakaan dan penyakit akibat kerja melalui identifikasi bahaya, pengendalian risiko, APD, dan prosedur kerja aman (STOP-THINK-ACT).</div>
        <button class="primary" id="btnRestart" type="button">↺ Main Lagi</button>`;
    $('resultScreen').classList.remove('hidden');
    $('btnRestart').addEventListener('click', startGame);
    beep(badge ? 880 : 220, 0.4, 'triangle');
}
function hurt(raw, penalty) {
    const dmg = Math.max(1, Math.round(raw * damageMul()));
    player.hp = Math.max(0, player.hp - dmg);
    state.score = Math.max(0, state.score - penalty);
    triggerDamageFlash(); beep(150, 0.25, 'sawtooth', 0.06);
    updateHUD();
    return dmg;
}

/* ============================ UPDATE ============================ */
function collides(px, py) {
    for (const s of solids) {
        if (overlapXY(px, py, player.width, player.length, s) && player.z > -s.h + 5) return true;
    }
    return false;
}
function update(dt) {
    if (game.phase !== 'PLAY' || game.paused) return;

    if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;
    if (state.signalCooldown > 0) state.signalCooldown -= dt;
    if (state.gateMsgCd > 0) state.gateMsgCd -= dt;
    if (state.exitMsgCd > 0) state.exitMsgCd -= dt;
    if (state.flash > 0) state.flash -= dt;
    if (forklift.hornTimer > 0) forklift.hornTimer -= dt;

    // Forklift: berhenti total saat disinyal, selain itu patroli
    if (forklift.stopTimer > 0) {
        forklift.stopTimer = Math.max(0, forklift.stopTimer - dt);
    } else {
        forklift.x += forklift.dirX * forklift.speed * dt;
        if (forklift.x >= forklift.maxX) { forklift.x = forklift.maxX; forklift.dirX = -1; }
        if (forklift.x <= forklift.minX) { forklift.x = forklift.minX; forklift.dirX = 1; }
    }

    // Input gerak
    let ax = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    let ay = viewState.mode === 'top' ? (keys.down ? 1 : 0) - (keys.up ? 1 : 0) : 0;
    let spd = player.speed;
    if (player.slipTimer > 0) { player.slipTimer -= dt; ax = player.slipDir; ay = 0; spd = player.speed * 1.25; }
    if (ax && ay) { ax *= 0.7071; ay *= 0.7071; }
    if (ax) player.slipDir = ax > 0 ? 1 : -1;

    if (viewState.mode === 'side' && keys.jump && player.grounded) {
        player.vz = player.jumpPower; player.grounded = false;
    }

    // Gerak per sumbu + tabrakan AABB 3D
    let nx = clamp(player.x + ax * spd * dt, 0, WORLD.width - player.width);
    let ny = clamp(player.y + ay * spd * dt, 40, WORLD.depthY - player.length);
    if (!allAPD() && nx + player.width > GATE_X) {
        nx = GATE_X - player.width;
        if (ax > 0 && state.gateMsgCd <= 0) { state.gateMsgCd = 2.5; showMessage('⛔ Gerbang Zona Bahaya terkunci! Lengkapi 5 APD dulu di Area Pre-Check.', 3000); }
    }
    if (!collides(nx, player.y)) player.x = nx;
    if (!collides(player.x, ny)) player.y = ny;

    // Sumbu Z (lompat)
    player.vz += player.gravity * dt;
    player.z += player.vz * dt;
    if (player.z >= 0) { player.z = 0; player.vz = 0; player.grounded = true; }

    // Kamera smooth (X mengikuti pemain, Y menyesuaikan sudut pandang)
    const targetCamX = clamp(player.x - canvas.width / 2 + 100, 0, WORLD.width - canvas.width);
    const targetCamY = viewState.mode === 'top' ? -30 : 0;
    const k = 1 - Math.exp(-8 * dt);
    camera.x += (targetCamX - camera.x) * k;
    camera.y += (targetCamY - camera.y) * k;

    // UI kontekstual
    $('btnEquipAPD').style.display = nearestApd() ? 'inline-flex' : 'none';
    $('btnSignal').style.opacity = inSafeZone() ? '1' : '0.55';
    updateZoneChip();
    updateStaBanner();

    // Tabrakan forklift (hanya bila bergerak)
    if (player.invulnerableTimer <= 0 && forklift.stopTimer <= 0 &&
        overlapXY(player.x, player.y, player.width, player.length, forklift) && player.z > -forklift.h) {
        player.invulnerableTimer = 1.6;
        const dmg = hurt(40, 50);
        player.y = Math.min(WORLD.depthY - player.length, forklift.y + forklift.l + 3);   // terlempar ke zona aman
        showMessage(allAPD() ? `⚠️ Tertabrak Forklift! APD mengurangi cedera (-${dmg} HP, -50 Skor). Gunakan sinyal [G]!`
                             : `💥 Tertabrak Forklift! (-${dmg} HP, -50 Skor). Gunakan sinyal [G] di Zona Aman!`, 3200);
    }
    // Tumpahan oli (hindari dengan melompat)
    if (player.invulnerableTimer <= 0 && player.z > -6 &&
        overlapXY(player.x, player.y, player.width, player.length, oilBox)) {
        player.invulnerableTimer = 1.2; player.slipTimer = 0.7;
        const dmg = hurt(12, 20);
        showMessage(`🛢️ Terpeleset oli! Kehilangan kendali (-${dmg} HP, -20 Skor). Lompati atau hindari tumpahan.`, 3000);
    }
    if (game.phase === 'PLAY' && player.hp <= 0) { endGame(false); return; }

    // Pintu keluar
    if (player.x + player.width >= EXIT_X + 8) tryExit();
}
function updateStaBanner() {
    const b = $('staBanner');
    if (forklift.stopTimer > 0) {
        b.classList.remove('hidden');
        const el = 4 - forklift.stopTimer;
        $('staStop').classList.toggle('on', el < 1.33);
        $('staThink').classList.toggle('on', el >= 1.33 && el < 2.66);
        $('staAct').classList.toggle('on', el >= 2.66);
    } else b.classList.add('hidden');
}

/* ============================ RENDER: UTIL ============================ */
function drawTag(text, cx, y, color = '#f39c12') {
    ctx.save();
    ctx.font = 'bold 11px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
    const w = ctx.measureText(text).width + 10;
    ctx.fillStyle = 'rgba(10,18,20,0.78)'; ctx.fillRect(cx - w / 2, y - 12, w, 16);
    ctx.fillStyle = color; ctx.fillText(text, cx, y);
    ctx.restore();
}
const hazTag = id => state.photographed[id] ? `✓ ${HAZ[id].short}` : `⚠️ ${HAZ[id].short}`;
const hazColor = id => state.photographed[id] ? '#2ecc71' : '#f39c12';
const depthAlpha = o => clamp(1 - Math.abs(player.y - o.y) / 240, 0.4, 1);
const hasApd = id => apdItems.some(a => a.id === id && a.got);
function drawStripes(x, y, w, h, c1, c2, step = 12) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = c1; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = c2;
    for (let i = -h; i < w + h; i += step * 2) {
        ctx.beginPath();
        ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + step, y + h);
        ctx.lineTo(x + i + step + h, y); ctx.lineTo(x + i + h, y);
        ctx.closePath(); ctx.fill();
    }
    ctx.restore();
}
function circle(x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }

/* ============================ RENDER: SIDE VIEW (X–Z) ============================ */
function drawSideBackdrop() {
    const fy = WORLD.floorY;
    const g = ctx.createLinearGradient(0, -60, 0, fy);
    g.addColorStop(0, '#16242a'); g.addColorStop(1, '#2a3d44');
    ctx.fillStyle = g; ctx.fillRect(0, -60, WORLD.width, fy + 60);
    ctx.fillStyle = '#22343a';
    for (let x = 0; x < WORLD.width; x += 150) ctx.fillRect(x, -60, 8, fy + 60);

    // Papan Area Pre-Check
    ctx.fillStyle = 'rgba(46,204,113,0.12)'; ctx.fillRect(20, 60, GATE_X - 40, 120);
    ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2; ctx.strokeRect(20, 60, GATE_X - 40, 120);
    ctx.textAlign = 'left'; ctx.fillStyle = '#2ecc71'; ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
    ctx.fillText('AREA PRE-CHECK APD', 36, 88);
    ctx.font = '12px "Trebuchet MS", sans-serif'; ctx.fillStyle = '#cfe9d8';
    ctx.fillText('Kumpulkan 5 APD wajib sebelum masuk:', 36, 110);
    ctx.fillText('⛑️ Helm  🥾 Sepatu  🦺 Rompi', 36, 132);
    ctx.fillText('🧤 Sarung Tangan  🥽 Masker/Kacamata', 36, 152);
    // Papan Zona Bahaya
    ctx.fillStyle = '#1b1b1b'; ctx.fillRect(GATE_X + 40, 60, 270, 34);
    ctx.strokeStyle = '#f1c40f'; ctx.strokeRect(GATE_X + 40, 60, 270, 34);
    ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
    ctx.fillText('⚠️ ZONA BAHAYA – APD WAJIB', GATE_X + 54, 83);

    // Lantai
    ctx.fillStyle = '#4a5b5c'; ctx.fillRect(0, fy, WORLD.width, 70);
    ctx.fillStyle = 'rgba(46,204,113,0.18)'; ctx.fillRect(0, fy + 3, GATE_X, 67);
    ctx.fillStyle = '#f1c40f'; ctx.fillRect(0, fy, WORLD.width, 3);
    ctx.font = 'bold 10px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffdf77'; ctx.fillText('JALUR FORKLIFT (Y)', SAFE_ZONE.x + 10, fy + 25);
    drawStripes(SAFE_ZONE.x, fy + 29, SAFE_ZONE.w, 7, '#f1c40f', '#222', 12);
    ctx.fillStyle = '#7ee2a8'; ctx.fillText('ZONA AMAN PEJALAN – berdiri di sini lalu tekan [G] untuk memberi sinyal', SAFE_ZONE.x + 10, fy + 54);
    drawStripes(SAFE_ZONE.x, fy + 58, SAFE_ZONE.w, 7, '#27ae60', '#1b6b3b', 12);
}
function drawGateSide() {
    const b = WORLD.floorY, open = allAPD();
    ctx.fillStyle = '#34495e'; ctx.fillRect(GATE_X - 8, b - 95, 10, 95); ctx.fillRect(GATE_X + 16, b - 95, 10, 95);
    if (open) {
        circle(GATE_X + 9, b - 98, 5, '#2ecc71');
    } else {
        drawStripes(GATE_X - 4, b - 78, 24, 26, '#e74c3c', '#fff', 8);
        circle(GATE_X + 9, b - 98, 5, Math.floor(game.anim * 3) % 2 ? '#e74c3c' : '#7b241c');
    }
    drawTag(open ? '✅ GERBANG TERBUKA' : '🔒 GERBANG: LENGKAPI APD', GATE_X + 9, b - 108, open ? '#2ecc71' : '#ff8d7a');
}
function drawExitSide() {
    const b = WORLD.floorY;
    ctx.fillStyle = '#1b2a2e'; ctx.fillRect(EXIT_X, b - 110, 70, 110);
    ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 3; ctx.strokeRect(EXIT_X, b - 110, 70, 110);
    ctx.fillStyle = '#2ecc71'; ctx.fillRect(EXIT_X + 8, b - 100, 54, 8);
    ctx.font = '30px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🚪', EXIT_X + 35, b - 50);
    drawTag('PINTU KELUAR', EXIT_X + 35, b - 118, '#2ecc71');
}
function drawOilSide() {
    const o = oilBox, fy = WORLD.floorY, cx = o.x + o.w / 2;
    ctx.save(); ctx.globalAlpha = depthAlpha(o);
    ctx.fillStyle = 'rgba(8,8,10,0.92)'; ctx.beginPath(); ctx.ellipse(cx, fy + 3, o.w / 2, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(130,120,190,0.55)'; ctx.beginPath(); ctx.ellipse(cx - 16, fy + 2, 20, 3, 0, 0, Math.PI * 2); ctx.fill();
    drawTag(hazTag('oil'), cx, fy - 14, hazColor('oil'));
    ctx.restore();
}
function drawShelfSide() {
    const s = shelf, b = WORLD.floorY;
    ctx.save(); ctx.globalAlpha = depthAlpha(s);
    ctx.fillStyle = '#5e6f71'; ctx.fillRect(s.x, b - s.h, 10, s.h); ctx.fillRect(s.x + s.w - 10, b - s.h, 10, s.h);
    ctx.fillStyle = '#839597'; ctx.fillRect(s.x, b - s.h, s.w, 6);
    const cols = ['#c8964f', '#b9853f', '#d4a45f'];
    for (let k = 0; k < 3; k++) {
        const by = b - 62 + k * 30;
        ctx.fillStyle = '#839597'; ctx.fillRect(s.x, by, s.w, 5);
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = cols[(i + k) % 3]; ctx.fillRect(s.x + 14 + i * 40, by - 22, 34, 22);
            ctx.strokeStyle = '#7a5726'; ctx.lineWidth = 1; ctx.strokeRect(s.x + 14 + i * 40, by - 22, 34, 22);
        }
    }
    // Palet + kardus miring di atas rak
    const pcx = palletBox.x + palletBox.w / 2;
    ctx.save(); ctx.translate(pcx, b - s.h); ctx.rotate(0.34);
    ctx.fillStyle = '#a9783a'; ctx.fillRect(-32, -9, 64, 9);
    ctx.fillStyle = '#6e4a1f'; for (let i = -28; i < 30; i += 18) ctx.fillRect(i, -9, 6, 9);
    ctx.fillStyle = '#c8964f'; ctx.fillRect(-24, -34, 48, 25);
    ctx.strokeStyle = '#7a5726'; ctx.lineWidth = 2; ctx.strokeRect(-24, -34, 48, 25);
    ctx.fillStyle = '#e74c3c'; ctx.fillRect(-4, -34, 8, 25);
    ctx.restore();
    drawTag(hazTag('pallet'), pcx, b - s.h - 46, hazColor('pallet'));
    ctx.restore();
}
function drawForkliftSide() {
    const f = forklift, b = WORLD.floorY, d = f.dirX;
    ctx.save(); ctx.globalAlpha = depthAlpha(f);
    const frontX = d > 0 ? f.x + f.w : f.x;
    ctx.fillStyle = '#f1c40f'; ctx.fillRect(f.x, b - 34, f.w, 26);
    ctx.fillStyle = '#d4a017'; ctx.fillRect(f.x, b - 12, f.w, 4);
    const rearX = d > 0 ? f.x : f.x + f.w - 26;
    ctx.fillStyle = '#2c3e50'; ctx.fillRect(rearX, b - 34, 26, 26);
    const cabX = f.x + 28;
    ctx.strokeStyle = '#222'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cabX, b - 34); ctx.lineTo(cabX, b - 50); ctx.moveTo(cabX + 28, b - 34); ctx.lineTo(cabX + 28, b - 50); ctx.stroke();
    ctx.fillStyle = '#333'; ctx.fillRect(cabX - 4, b - 52, 36, 4);
    circle(cabX + 14, b - 44, 5, '#f0c9a0');
    ctx.fillStyle = '#333'; ctx.fillRect(d > 0 ? frontX - 8 : frontX, b - 70, 8, 70);
    ctx.fillStyle = '#666'; ctx.fillRect(d > 0 ? frontX : frontX - 22, b - 6, 22, 5);
    circle(f.x + 16, b - 9, 9, '#1a1a1a'); circle(f.x + f.w - 16, b - 9, 9, '#1a1a1a');
    const stopped = f.stopTimer > 0;
    circle(cabX + 14, b - 57, 4, stopped ? '#e74c3c' : (Math.floor(game.anim * 6) % 2 ? '#ff9f1a' : '#7a4a0a'));
    let label = hazTag('forklift'), col = hazColor('forklift');
    if (stopped) { label = `🛑 BERHENTI ${f.stopTimer.toFixed(1)}s`; col = '#ff8d7a'; }
    drawTag(label, f.x + f.w / 2, b - 82, col);
    if (f.hornTimer > 0) {
        ctx.font = 'bold 16px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffdf77';
        ctx.fillText('TIIIIN!', f.x + f.w / 2, b - 104);
    }
    ctx.restore();
}
function drawManualSide() {
    const m = manualBox, b = WORLD.floorY;
    ctx.save(); ctx.globalAlpha = depthAlpha(m); ctx.lineCap = 'round';
    ctx.fillStyle = '#b9853f'; ctx.fillRect(m.x + 42, b - 32, 32, 32);
    ctx.strokeStyle = '#7a5726'; ctx.lineWidth = 2; ctx.strokeRect(m.x + 42, b - 32, 32, 32);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('50 KG', m.x + 58, b - 12);
    const hx = m.x + 20, hy = b - 24;
    ctx.strokeStyle = '#34495e'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(hx - 4, b); ctx.lineTo(hx, hy); ctx.moveTo(hx + 8, b); ctx.lineTo(hx, hy); ctx.stroke();
    const tx = hx + 24, ty = hy - 14;
    ctx.strokeStyle = '#3b7ea1'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
    circle(tx + 7, ty - 3, 6, '#f0c9a0');
    ctx.strokeStyle = '#f0c9a0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tx - 2, ty + 2); ctx.lineTo(m.x + 44, b - 24); ctx.stroke();
    drawTag(hazTag('manual'), m.x + m.w / 2, b - 54, hazColor('manual'));
    ctx.restore();
}
function drawPinchSide() {
    const b = WORLD.floorY;
    ctx.save(); ctx.globalAlpha = depthAlpha(pinchA);
    [pinchA, pinchB].forEach(p => {
        ctx.fillStyle = '#7d8487'; ctx.fillRect(p.x, b - p.h, p.w, p.h);
        for (let r = 0; r < 3; r++) {
            ctx.fillStyle = r % 2 ? '#b9853f' : '#c8964f'; ctx.fillRect(p.x + 3, b - p.h + 3 + r * 19, p.w - 6, 16);
        }
    });
    const gx = pinchA.x + pinchA.w, gw = pinchB.x - gx;
    drawStripes(gx, b - pinchA.h, gw, pinchA.h, '#f1c40f', '#222', 8);
    ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 14px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('!', gx + gw / 2, b - pinchA.h / 2 + 5);
    drawTag(hazTag('pinch'), pinchBox.x + pinchBox.w / 2, b - pinchA.h - 10, hazColor('pinch'));
    ctx.restore();
}
function drawApdSide(a, near) {
    const b = WORLD.floorY, bob = Math.sin(game.anim * 3 + a.x) * 3, y = b - 30 - bob;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(a.x + 14, b, 14, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = a.color; ctx.fillRect(a.x, y, 28, 28);
    ctx.strokeStyle = near ? '#fff' : 'rgba(255,255,255,0.4)'; ctx.lineWidth = near ? 3 : 1; ctx.strokeRect(a.x, y, 28, 28);
    ctx.font = '18px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#000';
    ctx.fillText(a.icon, a.x + 14, y + 21);
    if (near) drawTag(`${a.name} – tekan [F]`, a.x + 14, y - 8, '#ffffff');
}
function drawPlayerSide() {
    const p = player, x = p.x, w = p.width, h = p.height, y = WORLD.floorY - h + p.z;
    ctx.save();
    if (p.invulnerableTimer > 0 && Math.floor(game.anim * 12) % 2 === 0) ctx.globalAlpha = 0.45;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(x + w / 2, WORLD.floorY, w * 0.5 * (1 + p.z / 300), 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#34495e'; ctx.fillRect(x + 5, y + h * 0.6, w - 10, h * 0.4);               // kaki
    if (hasApd('sepatu')) { ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x + 3, y + h - 8, w - 6, 8); ctx.fillStyle = '#bdc3c7'; ctx.fillRect(x + w - 11, y + h - 8, 8, 4); }
    ctx.fillStyle = '#3b7ea1'; ctx.fillRect(x + 3, y + 13, w - 6, h * 0.48);                      // badan
    if (hasApd('rompi')) {
        ctx.fillStyle = '#c6f135'; ctx.fillRect(x + 3, y + 13, w - 6, h * 0.44);
        ctx.fillStyle = '#fff'; ctx.fillRect(x + 3, y + 21, w - 6, 3); ctx.fillRect(x + 3, y + 29, w - 6, 3);
    }
    if (hasApd('sarung')) { circle(x + 2, y + h * 0.5, 4, '#e67e22'); circle(x + w - 2, y + h * 0.5, 4, '#e67e22'); }
    ctx.fillStyle = '#f0c9a0'; ctx.fillRect(x + 8, y, w - 16, 14);                               // kepala
    if (hasApd('masker')) { ctx.fillStyle = '#5dade2'; ctx.fillRect(x + 9, y + 3, w - 18, 4); ctx.fillStyle = '#ecf0f1'; ctx.fillRect(x + 10, y + 8, w - 20, 5); }
    if (hasApd('helm')) { ctx.fillStyle = '#f1c40f'; ctx.fillRect(x + 5, y - 6, w - 10, 9); ctx.fillStyle = '#d4a017'; ctx.fillRect(x + 5, y + 1, w - 10, 2); ctx.fillStyle = '#ddd'; ctx.fillRect(x + 8, y + 3, 2, 10); ctx.fillRect(x + w - 10, y + 3, 2, 10); }
    ctx.restore();
}

/* ============================ RENDER: TOP-DOWN (X–Y) ============================ */
function drawTopBackdrop() {
    const W = WORLD.width, D = WORLD.depthY + 40;
    ctx.fillStyle = '#2a3d44'; ctx.fillRect(0, 0, W, D);
    ctx.fillStyle = '#16242a'; ctx.fillRect(0, 0, W, 38);
    ctx.strokeStyle = '#25373d'; ctx.lineWidth = 1;
    for (let y = 40; y < D; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 38); ctx.lineTo(x, D); ctx.stroke(); }
    ctx.fillStyle = 'rgba(46,204,113,0.12)'; ctx.fillRect(0, 38, GATE_X, D - 38);
    ctx.textAlign = 'left'; ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#2ecc71'; ctx.fillText('AREA PRE-CHECK APD', 16, 62);
    ctx.fillStyle = '#f1c40f'; ctx.fillText('⚠️ ZONA BAHAYA – APD WAJIB', GATE_X + 30, 26);
    // Jalur forklift
    ctx.fillStyle = 'rgba(241,196,15,0.10)'; ctx.fillRect(GATE_X + 14, FORKLIFT_Y - 4, WORLD.width - GATE_X - 14, FORKLIFT_L + 8);
    ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 2; ctx.setLineDash([16, 12]);
    ctx.beginPath(); ctx.moveTo(GATE_X + 14, FORKLIFT_Y + FORKLIFT_L / 2); ctx.lineTo(WORLD.width, FORKLIFT_Y + FORKLIFT_L / 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = 'bold 11px "Trebuchet MS", sans-serif'; ctx.fillStyle = '#ffdf77';
    ctx.fillText('JALUR FORKLIFT ⇄', GATE_X + 24, FORKLIFT_Y - 8);
    // Zona aman
    ctx.fillStyle = 'rgba(46,204,113,0.13)'; ctx.fillRect(SAFE_ZONE.x, SAFE_ZONE.y, SAFE_ZONE.w, SAFE_ZONE.l);
    drawStripes(SAFE_ZONE.x, SAFE_ZONE.y, SAFE_ZONE.w, 6, '#27ae60', '#1b6b3b', 12);
    ctx.fillStyle = '#7ee2a8'; ctx.fillText('ZONA AMAN PEJALAN – tekan [G] untuk memberi sinyal ke operator', SAFE_ZONE.x + 10, SAFE_ZONE.y + 22);
}
function drawGateTop() {
    const open = allAPD();
    if (open) {
        ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
        ctx.beginPath(); ctx.moveTo(GATE_X + 6, 38); ctx.lineTo(GATE_X + 6, WORLD.depthY + 40); ctx.stroke(); ctx.setLineDash([]);
    } else {
        drawStripes(GATE_X, 38, 12, WORLD.depthY + 2, '#e74c3c', '#fff', 10);
    }
    drawTag(open ? '✅ GERBANG TERBUKA' : '🔒 GERBANG: LENGKAPI APD', GATE_X + 6, 52, open ? '#2ecc71' : '#ff8d7a');
}
function drawExitTop() {
    ctx.fillStyle = 'rgba(46,204,113,0.18)'; ctx.fillRect(EXIT_X, 38, 70, WORLD.depthY + 2);
    ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2; ctx.strokeRect(EXIT_X, 38, 70, WORLD.depthY + 2);
    drawTag('🚪 PINTU KELUAR', EXIT_X + 35, 62, '#2ecc71');
}
function drawOilTop() {
    const o = oilBox, cx = o.x + o.w / 2, cy = o.y + o.l / 2;
    ctx.fillStyle = 'rgba(8,8,10,0.92)'; ctx.beginPath(); ctx.ellipse(cx, cy, o.w / 2, o.l / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(130,120,190,0.5)'; ctx.beginPath(); ctx.ellipse(cx - 14, cy - 8, 22, 7, 0.3, 0, Math.PI * 2); ctx.fill();
    drawTag(hazTag('oil'), cx, o.y - 6, hazColor('oil'));
}
function drawApdTop(a, near) {
    ctx.fillStyle = a.color; ctx.fillRect(a.x, a.y, a.w, a.l);
    ctx.strokeStyle = near ? '#fff' : 'rgba(255,255,255,0.4)'; ctx.lineWidth = near ? 3 : 1; ctx.strokeRect(a.x, a.y, a.w, a.l);
    ctx.font = '17px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#000';
    ctx.fillText(a.icon, a.x + 14, a.y + 21);
    if (near) drawTag(`${a.name} – [F]`, a.x + 14, a.y - 8, '#ffffff');
}
function drawManualTop() {
    const m = manualBox;
    ctx.fillStyle = '#b9853f'; ctx.fillRect(m.x + 42, m.y + 10, 32, 32);
    ctx.strokeStyle = '#7a5726'; ctx.lineWidth = 2; ctx.strokeRect(m.x + 42, m.y + 10, 32, 32);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('50 KG', m.x + 58, m.y + 30);
    circle(m.x + 20, m.y + 26, 12, '#3b7ea1'); circle(m.x + 28, m.y + 26, 6, '#f0c9a0');
    drawTag(hazTag('manual'), m.x + m.w / 2, m.y - 6, hazColor('manual'));
}
function drawPinchTop() {
    [pinchA, pinchB].forEach(p => {
        ctx.fillStyle = '#7d8487'; ctx.fillRect(p.x, p.y, p.w, p.l);
        ctx.fillStyle = '#c8964f'; ctx.fillRect(p.x + 4, p.y + 4, p.w - 8, p.l - 8);
        ctx.strokeStyle = '#7a5726'; ctx.lineWidth = 1; ctx.strokeRect(p.x + 4, p.y + 4, p.w - 8, p.l - 8);
    });
    const gx = pinchA.x + pinchA.w;
    drawStripes(gx, pinchA.y, pinchB.x - gx, pinchA.l, '#f1c40f', '#222', 8);
    drawTag(hazTag('pinch'), pinchBox.x + pinchBox.w / 2, pinchA.y - 6, hazColor('pinch'));
}
function drawForkliftTop() {
    const f = forklift;
    ctx.save(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#f1c40f'; ctx.fillRect(f.x, f.y, f.w, f.l);
    ctx.fillStyle = '#2c3e50'; ctx.fillRect(f.dirX > 0 ? f.x : f.x + f.w - 24, f.y, 24, f.l);
    ctx.fillStyle = '#333'; ctx.fillRect(f.x + 30, f.y + 12, 28, f.l - 24);
    const fx = f.dirX > 0 ? f.x + f.w : f.x - 24;
    ctx.fillStyle = '#666'; ctx.fillRect(fx, f.y + 8, 24, 6); ctx.fillRect(fx, f.y + f.l - 14, 24, 6);
    const stopped = f.stopTimer > 0;
    circle(f.x + f.w / 2, f.y + f.l / 2, 4, stopped ? '#e74c3c' : (Math.floor(game.anim * 6) % 2 ? '#ff9f1a' : '#7a4a0a'));
    let label = hazTag('forklift'), col = hazColor('forklift');
    if (stopped) { label = `🛑 BERHENTI ${f.stopTimer.toFixed(1)}s`; col = '#ff8d7a'; }
    drawTag(label, f.x + f.w / 2, f.y - 8, col);
    if (f.hornTimer > 0) {
        ctx.font = 'bold 16px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffdf77';
        ctx.fillText('TIIIIN!', f.x + f.w / 2, f.y - 26);
    }
    ctx.restore();
}
function drawShelfTop() {
    const s = shelf;
    const under = overlapXY(player.x, player.y, player.width, player.length, s);
    ctx.save(); ctx.globalAlpha = under ? 0.3 : 0.92;
    ctx.fillStyle = '#7f8c8d'; ctx.fillRect(s.x, s.y, s.w, s.l);
    ctx.strokeStyle = '#5e6f71'; ctx.lineWidth = 2; ctx.strokeRect(s.x, s.y, s.w, s.l);
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(s.x + i * s.w / 4, s.y); ctx.lineTo(s.x + i * s.w / 4, s.y + s.l); ctx.stroke(); }
    // palet miring (tampak atas)
    ctx.save(); ctx.translate(palletBox.x + palletBox.w / 2, palletBox.y + palletBox.l / 2); ctx.rotate(0.34);
    ctx.fillStyle = '#c8964f'; ctx.fillRect(-26, -22, 52, 44); ctx.strokeStyle = '#7a5726'; ctx.strokeRect(-26, -22, 52, 44);
    ctx.fillStyle = '#e74c3c'; ctx.fillRect(-4, -22, 8, 44);
    ctx.restore();
    ctx.restore();
    drawTag(under ? 'Rak (transparan)' : hazTag('pallet'), s.x + s.w / 2, s.y - 6, under ? '#bbb' : hazColor('pallet'));
}
function drawPlayerTop() {
    const p = player, x = p.x, y = p.y + p.z;
    ctx.save();
    if (p.invulnerableTimer > 0 && Math.floor(game.anim * 12) % 2 === 0) ctx.globalAlpha = 0.45;
    if (p.z < 0) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 2, p.y + 2, p.width, p.length); }
    ctx.fillStyle = hasApd('rompi') ? '#c6f135' : '#3b7ea1'; ctx.fillRect(x, y, p.width, p.length);
    if (hasApd('rompi')) { ctx.fillStyle = '#fff'; ctx.fillRect(x + 6, y, 3, p.length); ctx.fillRect(x + p.width - 9, y, 3, p.length); }
    if (hasApd('sarung')) { circle(x + 1, y + 16, 4, '#e67e22'); circle(x + p.width - 1, y + 16, 4, '#e67e22'); }
    if (hasApd('sepatu')) { ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x + 4, y + p.length - 4, 9, 4); ctx.fillRect(x + 19, y + p.length - 4, 9, 4); }
    circle(x + 16, y + 16, hasApd('helm') ? 10 : 8, hasApd('helm') ? '#f1c40f' : '#f0c9a0');
    if (hasApd('masker')) { ctx.fillStyle = '#5dade2'; ctx.fillRect(x + 10, y + 5, 12, 4); }
    ctx.restore();
}

/* ============================ RENDER UTAMA ============================ */
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0d181c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    ctx.textAlign = 'left';
    const near = game.phase === 'PLAY' ? nearestApd() : null;

    if (viewState.mode === 'side') {
        drawSideBackdrop(); drawGateSide(); drawExitSide(); drawOilSide();
        // Z-Sorting: objek diurutkan menurut kedalaman (Y terjauh digambar lebih dulu)
        const items = [
            { d: shelf.y + shelf.l, f: drawShelfSide },
            { d: forklift.y + forklift.l, f: drawForkliftSide },
            { d: manualBox.y + manualBox.l, f: drawManualSide },
            { d: pinchA.y + pinchA.l, f: drawPinchSide },
            { d: player.y + player.length, f: drawPlayerSide },
            ...apdItems.filter(a => !a.got).map(a => ({ d: a.y + a.l, f: () => drawApdSide(a, near === a) }))
        ].sort((a, b) => a.d - b.d);
        items.forEach(i => i.f());
    } else {
        drawTopBackdrop(); drawGateTop(); drawExitTop(); drawOilTop();
        apdItems.filter(a => !a.got).forEach(a => drawApdTop(a, near === a));
        drawManualTop(); drawPinchTop(); drawForkliftTop(); drawShelfTop(); drawPlayerTop();
    }

    // Kamera: kerucut bidik + crosshair
    if (state.activeItem === 'camera' && game.phase === 'PLAY') {
        const pc = playerCenterWorld();
        const ps = { x: pc.x - camera.x, y: pc.y - camera.y };
        const aim = Math.atan2(state.pointerY - ps.y, state.pointerX - ps.x);
        ctx.save();
        ctx.beginPath(); ctx.moveTo(pc.x, pc.y); ctx.arc(pc.x, pc.y, PHOTO_RANGE, aim - PHOTO_CONE, aim + PHOTO_CONE); ctx.closePath();
        ctx.fillStyle = 'rgba(241,196,15,0.14)'; ctx.fill();
        ctx.strokeStyle = 'rgba(241,196,15,0.85)'; ctx.lineWidth = 1.5; ctx.stroke();
        const tx = state.pointerX + camera.x, ty = state.pointerY + camera.y;
        ctx.strokeStyle = '#ffdf77'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(tx, ty, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx - 16, ty); ctx.lineTo(tx + 16, ty); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx, ty - 16); ctx.lineTo(tx, ty + 16); ctx.stroke();
        ctx.restore();
    }
    ctx.restore();

    if (state.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${Math.min(0.8, state.flash * 3)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

/* ============================ INPUT ============================ */
function updatePointer(e) {
    const rect = canvas.getBoundingClientRect();
    state.pointerX = clamp((e.clientX - rect.left) * (canvas.width / rect.width), 0, canvas.width);
    state.pointerY = clamp((e.clientY - rect.top) * (canvas.height / rect.height), 0, canvas.height);
}
canvas.addEventListener('pointermove', updatePointer);
canvas.addEventListener('pointerdown', updatePointer);

const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' };
window.addEventListener('keydown', e => {
    if (!gameVisible()) return; // [GABUNG] jangan tangkap tombol di halaman lain
    if (e.target.closest && e.target.closest('button') && !e.target.closest('#gameContainer')) return; // [GABUNG] biarkan tombol header bekerja
    if (!$('eduModal').classList.contains('hidden')) {
        if (['Enter', 'Space', 'KeyE', 'Escape'].includes(e.code)) { e.preventDefault(); closeModal(); }
        return;
    }
    if (game.phase !== 'PLAY') {
        if (e.code === 'Enter') { e.preventDefault(); startGame(); }
        return;
    }
    if (e.code === 'Space') { e.preventDefault(); keys.jump = true; return; }   // Space MURNI untuk lompat
    if (KEYMAP[e.code]) { e.preventDefault(); keys[KEYMAP[e.code]] = true; return; }
    if (e.repeat) return;
    if (e.code === 'KeyE') takePhoto();
    else if (e.code === 'KeyF') wearAPD();
    else if (e.code === 'KeyG') giveSignal();
    else if (e.code === 'Digit1') setEquip('hand');
    else if (e.code === 'Digit2') setEquip('camera');
    else if (e.code === 'KeyV') switchViewMode();
});
window.addEventListener('keyup', e => {
    if (e.code === 'Space') keys.jump = false;
    if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false;
});
window.addEventListener('blur', () => Object.keys(keys).forEach(k => keys[k] = false));

document.querySelectorAll('#scene-game button') /* [GABUNG] */.forEach(btn => btn.addEventListener('click', function () { this.blur(); }));
const bindBtn = (id, key) => {
    const btn = $(id);
    btn.addEventListener('pointerdown', e => { e.preventDefault(); keys[key] = true; });
    const release = e => { e.preventDefault(); keys[key] = false; };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
};
bindBtn('btnLeft', 'left'); bindBtn('btnRight', 'right'); bindBtn('btnUp', 'up'); bindBtn('btnDown', 'down'); bindBtn('btnJump', 'jump');

$('slotHand').addEventListener('click', () => setEquip('hand'));
$('slotCamera').addEventListener('click', () => setEquip('camera'));
$('btnView').addEventListener('click', () => { if (game.phase === 'PLAY') switchViewMode(); });
$('btnCapture').addEventListener('click', takePhoto);
$('btnEquipAPD').addEventListener('click', wearAPD);
$('btnSignal').addEventListener('click', giveSignal);
$('btnStart').addEventListener('click', startGame);
$('btnModalClose').addEventListener('click', closeModal);

/* ============================ GAME LOOP ============================ */
let lastTime = 0;
function gameLoop(ts) {
    let dt = (ts - lastTime) / 1000;
    if (!lastTime) dt = 0;
    dt = Math.min(dt, 0.05);
    lastTime = ts;
    game.anim += dt;
    if (gameVisible()) { update(dt); draw(); } // [GABUNG] hemat CPU saat di luar scene game
    requestAnimationFrame(gameLoop);
}
resetGame();
requestAnimationFrame(gameLoop);
})();
