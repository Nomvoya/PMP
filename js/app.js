(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Progres ---------- */
const MODULES = {
    1: ['pengertian', 'tujuan', 'landasan', 'kuis'],
    2: ['hvr', 'tahap', 'temukan', 'risiko', 'kendali', 'near', 'kuis'],
    3: ['apd-lihat', 'apd-latihan'],
    4: ['prosedur', 'skenario']
};
const STORE = 'k3-bongkar-muat-progress';
let progress = (() => { try { const p = JSON.parse(localStorage.getItem(STORE)); if (p && typeof p === 'object') return p; } catch (e) {} return {}; })();
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(progress)); } catch (e) {} };
const done = m => (progress[m] || []).filter(k => MODULES[m].includes(k)).length;
const pct = m => Math.round(100 * done(m) / MODULES[m].length);
const isComplete = m => done(m) === MODULES[m].length;

/* ---------- Update Progres Header Modul Real-Time ---------- */
function updateModuleProgressUI() {
    [1, 2, 3, 4].forEach(m => {
        const p = pct(m);
        $$(`[data-mod-pct="${m}"]`).forEach(el => el.textContent = p + '%');
        $$(`[data-mod-fill="${m}"]`).forEach(el => el.style.width = p + '%');
    });
}

function mark(m, k) {
    const a = progress[m] = progress[m] || [];
    if (!a.includes(k)) { 
        a.push(k); 
        save(); 
        renderMenu(); 
    }
    updateModuleProgressUI();
}

/* ---------- Logika Penguncian Modul Linear ---------- */
function renderMenu() {
    let completed = 0;
    let prevComplete = true; // Modul 1 selalu terbuka pertama kali

    $$('.module-card').forEach(card => {
        const m = parseInt(card.dataset.module, 10);
        const p = pct(m);
        const full = isComplete(m);
        if (full) completed++;

        const pctEl = $('[data-pct]', card); if (pctEl) pctEl.textContent = p + '%';
        const fillEl = $('[data-fill]', card); if (fillEl) fillEl.style.width = p + '%';
        const badgeEl = $('.badge-done', card); if (badgeEl) badgeEl.hidden = !full;
        
        const btnEl = $('.btn', card);
        if (btnEl) {
            if (m === 1 || prevComplete) {
                btnEl.disabled = false;
                btnEl.textContent = full ? 'Ulangi' : (p > 0 ? 'Lanjutkan' : 'Buka');
            } else {
                btnEl.disabled = true;
                btnEl.textContent = 'Terkunci 🔒';
            }
        }
        prevComplete = full;
    });

    const ot = $('#overall-text'); if (ot) ot.textContent = `Progres keseluruhan: ${completed} dari 4 modul`;
    const of = $('#overall-fill'); if (of) of.style.width = (completed * 25) + '%';
    
    // Kuis Akhir tetap mensyaratkan semua modul selesai.
    const fin = $('#btn-final');
    if (fin) {
        fin.disabled = completed < 4;
        fin.textContent = completed < 4 ? 'Kuis Akhir (terkunci 🔒)' : 'Mulai Kuis Akhir';
        if (completed === 4) fin.classList.add('hint-pulse');
        else fin.classList.remove('hint-pulse');
    }

    const simBtn = $('.sim-card .btn');
    if (simBtn) {
        simBtn.disabled = false;
        simBtn.textContent = 'Main K3 Walk';
    }
}

/* ---------- Navigasi File ---------- */
const SCENE_FILE_MAP = {
    'scene-01': 'start.html',
    'scene-02': 'beranda.html',
    'scene-17': 'beranda.html#scene-17',
    'scene-17b': 'beranda.html#scene-17b',
    'scene-18': 'beranda.html#scene-18',
    'scene-03': 'modul1.html',
    'scene-03b': 'modul1.html#scene-03b',
    'scene-04': 'modul1.html#scene-04',
    'scene-05': 'modul1.html#scene-05',
    'scene-06': 'modul2.html',
    'scene-07': 'modul2.html#scene-07',
    'scene-08': 'modul2.html#scene-08',
    'scene-09': 'modul2.html#scene-09',
    'scene-10': 'modul2.html#scene-10',
    'scene-11': 'modul2.html#scene-11',
    'scene-11b': 'modul2.html#scene-11b',
    'scene-12': 'modul3.html',
    'scene-13': 'modul3.html#scene-13',
    'scene-14': 'modul4.html',
    'scene-15': 'modul4.html#scene-15',
    'scene-16': 'modul4.html#scene-16',
    'scene-game': 'game.html'
};

const onEnter = {};
const sceneHistory = [];
let isNavigatingBack = false;

function goTo(id) {
    const target = document.getElementById(id);
    if (target && target.classList.contains('scene')) {
        const cur = document.querySelector('.scene.active');
        if (!isNavigatingBack && cur && cur.id !== id) {
            sceneHistory.push(cur.id);
        }
        $$('.scene').forEach(s => s.classList.toggle('active', s.id === id));
        window.scrollTo(0, 0);
        if (onEnter[id]) onEnter[id]();
        updateModuleProgressUI();
    } else {
        const dest = SCENE_FILE_MAP[id] || 'beranda.html';
        window.location.href = dest;
    }
}

function goBack() {
    if (sceneHistory.length > 0) {
        const prev = sceneHistory.pop();
        isNavigatingBack = true;
        goTo(prev);
        isNavigatingBack = false;
    } else {
        goTo('scene-02');
    }
}

$$('.app-bar .brand').forEach(brand => {
    brand.setAttribute('role', 'link');
    brand.setAttribute('tabindex', '0');
    brand.setAttribute('aria-label', 'Kembali ke Pilih Modul');
});

document.addEventListener('click', e => {
    const brand = e.target.closest('.app-bar .brand');
    if (brand) {
        goTo('scene-02');
        return;
    }

    const b = e.target.closest('[data-back]');
    if (b) {
        goBack();
        return;
    }
    const t = e.target.closest('[data-go]');
    if (!t || t.disabled) return;
    if (t.dataset.mark) { const [m, k] = t.dataset.mark.split(':'); mark(m, k); }
    goTo(t.dataset.go);
});

document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const brand = e.target.closest('.app-bar .brand');
    if (brand) {
        e.preventDefault();
        goTo('scene-02');
    }
});

if (window.location.hash) {
    const targetId = window.location.hash.substring(1);
    if (document.getElementById(targetId)) {
        setTimeout(() => goTo(targetId), 0);
    }
}

/* ---------- Tab ---------- */
const tabApi = new Map();
$$('[role="tablist"]').forEach(list => {
    const tabs = $$('[role="tab"]', list), seen = new Set();
    const show = id => {
        tabs.forEach(t => {
            const on = t.dataset.tab === id;
            t.setAttribute('aria-selected', on);
            t.tabIndex = on ? 0 : -1;
            document.getElementById(t.dataset.tab).hidden = !on;
            if (on) {
                seen.add(id);
                t.classList.add('seen');
                if (t.dataset.mark) { const [m, k] = t.dataset.mark.split(':'); mark(m, k); }
            }
        });
        if (list.dataset.complete && seen.size === tabs.length) { const [m, k] = list.dataset.complete.split(':'); mark(m, k); }
    };
    tabs.forEach((t, i) => {
        t.addEventListener('click', () => show(t.dataset.tab));
        t.addEventListener('keydown', e => {
            let next = i;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
            else if (e.key === 'Home') next = 0;
            else if (e.key === 'End') next = tabs.length - 1;
            else return;
            e.preventDefault();
            show(tabs[next].dataset.tab);
            tabs[next].focus();
        });
    });
});

const controlGuideQuery = window.matchMedia('(max-width: 700px)');
const controlGuides = $$('#scene-10 .control-guide');
const guideDialog = $('#control-guide-dialog');
const guideDialogTitle = $('#control-guide-title');
const guideDialogBody = $('#control-guide-dialog-body');
const guideDialogTabs = $$('.control-guide-dialog-tab', guideDialog || document);
let activeGuidePanel = null;
const showGuideDialogContent = kind => {
    if (!activeGuidePanel || !guideDialogTitle || !guideDialogBody) return;
    const guide = activeGuidePanel.querySelector(kind === 'prevention' ? '.control-guide.prevention' : '.control-guide:not(.prevention)');
    if (!guide) return;
    guideDialogTitle.textContent = guide.querySelector('summary').textContent;
    guideDialogBody.replaceChildren(guide.querySelector('ul').cloneNode(true));
    guideDialogTabs.forEach(tab => tab.setAttribute('aria-pressed', tab.dataset.guideKind === kind));
};
const syncControlGuides = () => controlGuides.forEach(guide => { guide.open = !controlGuideQuery.matches; });
syncControlGuides();
controlGuideQuery.addEventListener('change', syncControlGuides);
controlGuides.forEach(guide => {
    guide.addEventListener('click', event => {
        if (!controlGuideQuery.matches || !event.target.closest('summary')) return;
        event.preventDefault();
        activeGuidePanel = guide.closest('.control-panel');
        showGuideDialogContent(guide.classList.contains('prevention') ? 'prevention' : 'control');
        if (guideDialog && !guideDialog.open) guideDialog.showModal();
    });
    guide.addEventListener('toggle', () => {
        if (!controlGuideQuery.matches && !guide.open) guide.open = true;
    });
});
guideDialogTabs.forEach(tab => tab.addEventListener('click', () => showGuideDialogContent(tab.dataset.guideKind)));
const closeGuideDialog = $('.dlg-close', guideDialog || document);
if (closeGuideDialog && guideDialog) closeGuideDialog.addEventListener('click', () => guideDialog.close());
if (guideDialog) guideDialog.addEventListener('click', event => {
    if (event.target === guideDialog) guideDialog.close();
});

/* ---------- Peta belajar ---------- */
const dlg = $('#map-dialog');
const bMap = $('#btn-map');
const mClose = $('#map-close');
if (bMap && dlg) bMap.addEventListener('click', () => dlg.showModal());
if (mClose && dlg) mClose.addEventListener('click', () => dlg.close());
if (dlg) dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

/* ---------- Kartu balik ---------- */
$$('.flip').forEach(b => b.addEventListener('click', () => {
    b.classList.toggle('is-flipped'); b.setAttribute('aria-pressed', b.classList.contains('is-flipped'));
}));

/* ---------- Mesin Kuis Dengan Penguatan Jawaban Salah ---------- */
function runQuiz(host, qs, opt) {
    let i = 0, score = 0;
    const L = ['A', 'B', 'C', 'D'];

    function question() {
        const q = qs[i];
        host.innerHTML = `
            <div class="panel">
                <div class="quiz-meta"><span>${opt.title}</span><span>Pertanyaan ${i + 1} dari ${qs.length}</span></div>
                <div class="bar"><span style="width:${(i / qs.length) * 100}%"></span></div>
                <div class="quiz-q">${q.q}</div>
                <div id="q-opts">${q.o.map((t, k) => `<button class="quiz-opt" type="button" data-k="${k}"><b>${L[k]}.</b><span>${t}</span></button>`).join('')}</div>
                <div id="q-fb" aria-live="polite"></div>
            </div>`;
        $$('.quiz-opt', host).forEach(btn => btn.addEventListener('click', () => answer(+btn.dataset.k)));
    }

    function answer(k) {
        const q = qs[i], ok = k === q.a;
        if (ok) score++;
        
        $$('.quiz-opt', host).forEach((b, n) => { 
            b.disabled = true; 
            if (n === q.a) b.classList.add('is-correct'); 
            else if (n === k) b.classList.add('is-wrong'); 
        });

        const last = i === qs.length - 1;

        const fbText = ok 
            ? `<div class="panel accent-green" style="margin-top:12px; padding:12px 16px;">
                 <strong style="color:var(--green)">✓ Jawaban Tepat!</strong><br>
                 <span>${q.e}</span>
               </div>`
            : `<div class="panel accent-red" style="margin-top:12px; padding:12px 16px;">
                 <strong style="color:var(--red)">✕ Jawaban Kurang Tepat</strong><br>
                 <div style="margin-top:4px;"><strong>Penguatan Konsep:</strong> ${q.e}</div>
                 <small style="color:var(--muted); display:block; margin-top:6px;">Pahami penjelasan di atas sebelum mengulang kuis ini.</small>
               </div>`;

        $('#q-fb', host).innerHTML = `${fbText}
            <div class="actions" style="margin-top:16px;">
                <button class="btn btn-primary hint-pulse" type="button" id="q-next">${last ? 'Lihat Hasil Kuis' : 'Pertanyaan Berikutnya &rarr;'}</button>
            </div>`;

        $('#q-next', host).addEventListener('click', () => { if (last) result(); else { i++; question(); } });
        $('#q-next', host).focus();
    }

    function result() {
        const pass = score / qs.length >= opt.pass;
        
        host.innerHTML = `
            <div class="panel" style="text-align:center; padding:32px;">
                <div class="eyebrow">${opt.title}</div>
                <div class="score-big" style="margin:12px 0;">${score}/${qs.length}</div>
                
                ${pass 
                    ? `<div class="panel accent-green" style="margin-bottom:20px;">
                         <strong style="color:var(--green)">Selamat! Kamu Lulus Kuis Ini.</strong><br>
                         <span>Pemahaman materi kamu sudah sangat baik.</span>
                       </div>`
                    : `<div class="panel accent-red" style="margin-bottom:20px;">
                         <strong style="color:var(--red)">Skor Belum Mencukupi</strong><br>
                         <span>Kamu harus menjawab minimal <strong>${Math.ceil(opt.pass * qs.length)} dari ${qs.length} soal</strong> dengan benar untuk menyelesaikan modul ini. Silakan coba lagi.</span>
                       </div>`
                }

                <div class="actions center">
                    ${pass 
                        ? `<button class="btn btn-success hint-pulse" type="button" id="q-exit">${opt.passLabel}</button>`
                        : `<button class="btn btn-primary hint-pulse" type="button" id="q-retry">🔄 Coba Lagi Kuis</button>`
                    }
                </div>
            </div>`;

        if (pass) {
            opt.onPass(score, qs.length);
            $('#q-exit', host).addEventListener('click', () => goTo(opt.passTo));
        } else {
            $('#q-retry', host).addEventListener('click', () => { i = 0; score = 0; question(); });
        }
    }

    question();
}

const QUIZ_M1 = [
    { q: 'PP No. 50 Tahun 2012 mengatur tentang…', o: ['Sistem Manajemen K3 (SMK3)', 'Pesawat angkat dan angkut', 'Keselamatan kerja di ketinggian', 'Persyaratan lingkungan kerja'], a: 0, e: 'PP 50/2012 mengatur penerapan Sistem Manajemen K3 (SMK3).' },
    { q: 'Manakah yang termasuk tujuan K3 menurut UU No. 1 Tahun 1970?', o: ['Menambah jam lembur pekerja', 'Melindungi keselamatan setiap tenaga kerja dan orang lain di tempat kerja', 'Mengurangi jumlah pekerja', 'Menghindari pelaporan kecelakaan'], a: 1, e: 'UU 1/1970 bertujuan melindungi keselamatan tenaga kerja dan orang lain di tempat kerja, serta menjamin sumber produksi digunakan secara aman dan efisien.' },
    { q: 'Permenaker No. 8 Tahun 2020 mengatur persyaratan untuk…', o: ['Lingkungan kerja', 'Pekerjaan di ketinggian', 'Pesawat angkat dan pesawat angkut (crane, forklift)', 'Sistem manajemen K3'], a: 2, e: 'Permenaker 8/2020 menyangkut alat angkat dan angkut seperti crane dan forklift.' },
    { q: 'Hak atas pekerjaan dan penghidupan yang layak bagi kemanusiaan tercantum dalam…', o: ['UUD 1945 Pasal 27 ayat (2)', 'UU No. 6 Tahun 2023 Pasal 1', 'Permenaker 5/2018', 'PP 50/2012 Pasal 3'], a: 0, e: 'Hak tersebut dijamin oleh UUD 1945 Pasal 27 ayat (2).' },
    { q: 'Secara umum, upaya K3 bertujuan mencegah…', o: ['Kenaikan harga barang', 'Kecelakaan kerja dan penyakit akibat kerja', 'Pergantian pekerja', 'Keterlambatan pengiriman'], a: 1, e: 'Menurut PP 50/2012, K3 adalah upaya pencegahan kecelakaan kerja dan penyakit akibat kerja.' }
];

const QUIZ_M2 = [
    { q: 'Apa yang dimaksud dengan hazard (bahaya)?', o: ['Kecelakaan yang sudah terjadi', 'Sumber, situasi, atau aktivitas yang berpotensi menimbulkan cedera atau kerusakan', 'Alat pelindung diri yang digunakan pekerja', 'Tindakan pertolongan pertama'], a: 1, e: 'Hazard adalah sumber, situasi, atau aktivitas yang berpotensi menimbulkan dampak merugikan.' },
    { q: 'Apa perbedaan utama antara hazard dan risk (risiko)?', o: ['Hazard adalah APD, sedangkan risiko adalah prosedur kerja', 'Hazard hanya ada di gudang, sedangkan risiko hanya di jalan', 'Hazard adalah potensi sumber bahaya, sedangkan risiko mempertimbangkan kemungkinan dan dampaknya', 'Keduanya selalu berarti kecelakaan yang telah terjadi'], a: 2, e: 'Hazard merupakan sumber potensi bahaya; risiko menilai kemungkinan kejadian dan tingkat keparahan dampaknya.' },
    { q: 'Manakah contoh metode untuk mengidentifikasi bahaya di tempat kerja?', o: ['Menunggu sampai terjadi kecelakaan', 'Mengabaikan laporan near-miss', 'Observasi pekerjaan dan inspeksi fasilitas', 'Mengurangi jumlah rambu keselamatan'], a: 2, e: 'Observasi dan inspeksi merupakan metode untuk mengenali kondisi dan aktivitas berbahaya.' },
    { q: 'Apa yang perlu dipertimbangkan saat menilai tingkat risiko?', o: ['Warna seragam pekerja', 'Lama perusahaan beroperasi', 'Jumlah kendaraan di luar area kerja', 'Kemungkinan kejadian dan keparahan dampaknya'], a: 3, e: 'Penilaian risiko mempertimbangkan kemungkinan bahaya terjadi serta keparahan dampaknya.' },
    { q: 'Apa tindakan yang tepat ketika menemukan kondisi tidak aman?', o: ['Tetap bekerja agar target selesai', 'Pindahkan rambu tanpa memberi tahu siapa pun', 'Amankan area, laporkan, dan lakukan pengendalian yang sesuai', 'Tunggu sampai ada pekerja yang terluka'], a: 2, e: 'Kondisi tidak aman perlu diamankan dan dilaporkan agar dapat ditindaklanjuti dengan pengendalian.' }
];

const QUIZ_FINAL = [
    { q: 'Genangan oli di lantai gudang adalah contoh…', o: ['Hazard (bahaya)', 'Risiko tinggi', 'APD', 'Near-miss'], a: 0, e: 'Genangan oli adalah sumber potensi cedera, yaitu hazard.' },
    { q: 'Besar kecilnya risiko ditentukan oleh…', o: ['Warna area kerja', 'Kemungkinan terjadi dan keparahan dampaknya', 'Jumlah pekerja', 'Jam kerja'], a: 1, e: 'Risiko = kemungkinan × keparahan.' },
    { q: 'Urutan prinsip STOP-THINK-ACT yang benar adalah…', o: ['Henti → nilai bahaya & dampak → lapor/amankan/perbaiki', 'Lapor → henti → nilai bahaya', 'Nilai bahaya → lanjut bekerja → lapor', 'Amankan → lapor → henti'], a: 0, e: 'STOP saat tidak aman, THINK menilai bahaya dan dampak, ACT melapor, mengamankan, dan memperbaiki.' },
    { q: 'Cara mengangkat beban dari lantai yang benar adalah…', o: ['Membungkuk dengan lutut lurus', 'Tekuk lutut, punggung tegak, angkat dengan kaki', 'Memutar badan sambil mengangkat', 'Mengangkat dengan satu tangan'], a: 1, e: 'Punggung tegak dan tenaga dari kaki mengurangi beban pada tulang belakang.' },
    { q: 'Untuk membongkar muatan di area yang dilalui forklift, APD wajib yang tepat adalah…', o: ['Sandal, topi kain, jaket tebal', 'Helm, sepatu safety, rompi high-vis, sarung tangan, masker/kacamata', 'Hanya sarung tangan', 'Hanya rompi'], a: 1, e: 'Kelima APD tersebut melindungi kepala, kaki, visibilitas, tangan, serta mata dan pernapasan.' },
    { q: 'Forklift sedang bermanuver di dekat Anda. Tindakan paling aman adalah…', o: ['Melintas cepat', 'Berhenti di tempat aman, kontak mata dengan operator, tunggu tanda', 'Memanggil rekan agar menahan forklift', 'Melintas di belakang forklift'], a: 1, e: 'Pastikan operator melihat Anda sebelum melintas.' }
];

/* ---------- Pemicu Progres Otomatis ---------- */
// Modul 1
onEnter['scene-03'] = () => mark(1, 'pengertian');
onEnter['scene-03b'] = () => mark(1, 'tujuan');
onEnter['scene-04'] = () => mark(1, 'landasan');
onEnter['scene-05'] = () => {
    const qHost = $('#quiz-m1');
    if (qHost) runQuiz(qHost, QUIZ_M1, { title: 'Kuis Formatif Modul 1', pass: 0.6, passLabel: 'Selesai, Kembali ke Menu', passTo: 'scene-02', onPass: () => mark(1, 'kuis') });
};

// Modul 2
onEnter['scene-06'] = () => mark(2, 'hvr');
onEnter['scene-07'] = () => mark(2, 'tahap');
onEnter['scene-08'] = () => mark(2, 'temukan');
onEnter['scene-09'] = () => mark(2, 'risiko');
onEnter['scene-10'] = () => mark(2, 'kendali');
onEnter['scene-11'] = () => mark(2, 'near');
onEnter['scene-11b'] = () => {
    const qHost = $('#quiz-m2');
    if (qHost) runQuiz(qHost, QUIZ_M2, { title: 'Kuis Pilihan Ganda Modul 2', pass: 0.6, passLabel: 'Selesai, Kembali ke Menu', passTo: 'scene-02', onPass: () => mark(2, 'kuis') });
};

// Modul 3 & 4
onEnter['scene-18'] = () => {
    const qHost = $('#quiz-final');
    if (qHost) runQuiz(qHost, QUIZ_FINAL, { title: 'Kuis Akhir', pass: 0.7, passLabel: 'Lihat Hasil & Lencana', passTo: 'scene-17', onPass: (s, n) => { const fs = $('#final-score'); if (fs) fs.textContent = `${s}/${n}`; } });
};

/* ---------- Modul 2: tahapan ---------- */
const STEPS = [
    ['Daftar aktivitas kerja', 'Petakan seluruh aktivitas di area bongkar muat: menurunkan muatan, menumpuk, mengangkut dengan forklift, hingga membersihkan area.'],
    ['Kenali sumber bahaya', 'Untuk tiap aktivitas, cari sumber bahaya: alat berat, material, lantai, kabel, posisi kerja, dan kondisi lingkungan.'],
    ['Kumpulkan informasi lapangan', 'Gunakan observasi, wawancara, inspeksi, riwayat kecelakaan, dan JSA untuk mendapatkan gambaran yang utuh.'],
    ['Catat dan dokumentasikan', 'Tulis bahaya yang ditemukan beserta lokasi dan foto agar dapat ditindaklanjuti dan dipantau.'],
    ['Nilai risiko', 'Tentukan tingkat risiko dari kemungkinan terjadi dan keparahan dampaknya (rendah, sedang, tinggi).'],
    ['Tetapkan pengendalian dan pantau', 'Pilih pengendalian yang paling efektif, laksanakan, lalu tinjau ulang secara berkala.']
];
(() => {
    const wrap = $('#steps');
    if (wrap) {
        const seen = new Set();
        STEPS.forEach((s, i) => {
            if (i) wrap.insertAdjacentHTML('beforeend', '<span class="step-line"></span>');
            wrap.insertAdjacentHTML('beforeend', `<button class="step" type="button" data-i="${i}" aria-label="Tahap ${i + 1}">${i + 1}</button>`);
        });
        $$('.step', wrap).forEach(b => b.addEventListener('click', () => {
            const i = +b.dataset.i; seen.add(i);
            $$('.step', wrap).forEach(x => { x.classList.toggle('active', x === b); x.classList.toggle('seen', seen.has(+x.dataset.i)); });
            const st = $('#step-title'); if (st) st.textContent = `Tahap ${i + 1}: ${STEPS[i][0]}`;
            const sd = $('#step-desc'); if (sd) sd.textContent = STEPS[i][1];
            if (seen.size === STEPS.length) mark(2, 'tahap');
        }));
    }
})();

/* ---------- Modul 2: temukan bahaya ---------- */
const HAZ_TEXT = [
    'Tumpukan miring di rak: berpotensi roboh dan menimpa pekerja.',
    'Tumpahan oli di lantai: risiko terpeleset.',
    'Pekerja di jalur forklift: risiko tertabrak.',
    'Kabel melintang di lantai: risiko tersandung.',
    'Jalur evakuasi terhalang barang: menghambat penyelamatan saat darurat.'
];
(() => {
    const hazList = $('#hazard-found');
    if (!hazList) return;
    const found = new Set(), list = hazList;
    const render = () => { const hc = $('#hazard-count'); if (hc) hc.textContent = found.size; };
    $$('[data-h]').forEach(b => b.addEventListener('click', () => {
        const i = +b.dataset.h; if (found.has(i)) return;
        found.add(i); b.classList.add('found');
        list.insertAdjacentHTML('beforeend', `<li>${HAZ_TEXT[i]}</li>`); render();
        if (found.size === 5) { 
            const btnAfter = $('#btn-after-find');
            if (btnAfter) {
                btnAfter.hidden = false; 
                btnAfter.classList.add('hint-pulse');
            }
            mark(2, 'temukan'); 
        }
    }));
    onEnter['scene-08'] = () => { found.clear(); list.innerHTML = ''; $$('[data-h]').forEach(b => b.classList.remove('found')); $('#btn-after-find').hidden = !(progress[2] || []).includes('temukan'); render(); };
})();

/* ---------- Modul 2: matriks risiko ---------- */
(() => {
    const msg = $('#risk-msg');
    if (!msg) return;
    let sel = null, placed = 0;
    $$('.pick').forEach(p => p.addEventListener('click', () => {
        if (p.disabled) return;
        sel = p; $$('.pick').forEach(x => x.classList.toggle('selected', x === p));
        msg.textContent = ''; msg.className = 'msg';
    }));
    $$('.risk-col').forEach(c => c.addEventListener('click', () => {
        if (!sel) { msg.textContent = 'Pilih kartu dulu.'; msg.className = 'msg bad'; return; }
        if (sel.dataset.risk === c.dataset.level) {
            c.insertAdjacentHTML('beforeend', `<span>${sel.textContent}</span>`);
            sel.disabled = true; sel.classList.remove('selected'); sel = null; placed++;
            msg.textContent = 'Tepat.'; msg.className = 'msg ok';
            if (placed === 3) { 
                msg.textContent = 'Semua kartu tepat. Terapkan STOP-THINK-ACT di bawah ini.'; 
                const btnAfter = $('#btn-after-risk');
                if (btnAfter) {
                    btnAfter.hidden = false;
                    btnAfter.classList.add('hint-pulse');
                }
                mark(2, 'risiko'); 
            }
        } else {
            msg.textContent = 'Belum tepat. Pikirkan kemungkinan terjadinya dan keparahan dampaknya.'; msg.className = 'msg bad';
        }
    }));
    onEnter['scene-09'] = () => {
        placed = 0; sel = null; msg.textContent = '';
        $$('.pick').forEach(p => { p.disabled = false; p.classList.remove('selected'); });
        $$('.risk-col span').forEach(s => s.remove());
        $('#btn-after-risk').hidden = !(progress[2] || []).includes('risiko');
    };
})();
/* ---------- Modul 3: APD ---------- */
const APD_INFO = {
    helm: ['Helm Safety (dengan tali dagu)', 'Melindungi kepala dari benda jatuh dan benturan. Tali dagu menjaga helm tetap terpasang saat menunduk atau bergerak. Ganti helm yang retak atau pernah terbentur keras.'],
    kacamata: ['Masker & Kacamata', 'Kacamata melindungi mata dari debu dan percikan; masker melindungi saluran napas dari debu muatan. Pakai saat membuka atau memindahkan muatan berdebu.'],
    rompi: ['Rompi High-Vis', 'Warna terang dan strip reflektif membuat pekerja mudah terlihat oleh operator forklift dan pengemudi truk, terutama di area ramai atau minim cahaya.'],
    sarung: ['Sarung Tangan Kerja', 'Melindungi tangan dari gesekan, goresan, dan titik jepit saat memegang atau menggeser muatan. Pilih yang pas dan tidak licin.'],
    sepatu: ['Sepatu Safety (steel toe)', 'Ujung baja melindungi jari dari beban tindih, sedangkan sol anti-slip mengurangi risiko terpeleset di lantai licin.']
};
(() => {
    const apdDetailEl = $('#apd-detail');
    if (!apdDetailEl) return;
    const seen = new Set();
    const show = id => {
        seen.add(id);
        apdDetailEl.innerHTML = `<h3>${APD_INFO[id][0]}</h3><p style="margin:0">${APD_INFO[id][1]}</p>`;
        $$('#scene-12 [data-apd]').forEach(el => {
            if (el.dataset.apd === id) el.classList.add('active'); else el.classList.remove('active');
            if (seen.has(el.dataset.apd)) el.classList.add(el.classList.contains('hs') ? 'found' : 'seen');
        });
        if (seen.size === 5) mark(3, 'apd-lihat');
    };
    $$('#scene-12 [data-apd]').forEach(el => el.addEventListener('click', () => show(el.dataset.apd)));
    onEnter['scene-12'] = () => {
        seen.clear();
        $$('#scene-12 [data-apd]').forEach(el => el.classList.remove('found', 'seen', 'active'));
        const ad = $('#apd-detail');
        if (ad) ad.innerHTML = '<p class="fine" style="margin:0">Pilih salah satu APD untuk melihat detailnya.</p>';
    };
})();
(() => {
    const fb = $('#apd-feedback');
    if (!fb) return;
    const cards = $$('.apd-card');
    const count = () => { $('#apd-selected-count').textContent = cards.filter(c => c.getAttribute('aria-pressed') === 'true').length; };
    cards.forEach(c => c.addEventListener('click', () => {
        c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true');
        c.classList.remove('correct', 'incorrect'); count();
    }));
    $('#btn-check-apd').addEventListener('click', () => {
        let wrong = 0, missing = 0;
        cards.forEach(c => {
            const on = c.getAttribute('aria-pressed') === 'true', ok = c.dataset.correct === '1';
            c.classList.remove('correct', 'incorrect');
            if (on && ok) c.classList.add('correct');
            if (on && !ok) { c.classList.add('incorrect'); wrong++; }
            if (!on && ok) missing++;
        });
        if (!wrong && !missing) { 
            fb.textContent = 'Benar. Kelima APD wajib sudah dipilih.'; 
            fb.className = 'msg ok'; 
            const btnFin = $('#btn-finish-m3');
            if (btnFin) {
                btnFin.hidden = false; 
                btnFin.classList.add('hint-pulse');
            }
            mark(3, 'apd-latihan'); 
        }
        else { fb.textContent = `${wrong ? wrong + ' pilihan bukan APD wajib. ' : ''}${missing ? missing + ' APD wajib belum dipilih.' : ''}`; fb.className = 'msg bad'; }
    });
    const bFinM3 = $('#btn-finish-m3'); if (bFinM3) bFinM3.addEventListener('click', () => goTo('scene-02'));
    onEnter['scene-13'] = () => { cards.forEach(c => { c.setAttribute('aria-pressed', 'false'); c.classList.remove('correct', 'incorrect'); }); count(); fb.textContent = ''; $('#btn-finish-m3').hidden = true; };
})();

/* ---------- Modul 4 ---------- */
const PROC = [
    ['Inspeksi APD Mandiri', 'Periksa APD (helm, sepatu, rompi, sarung tangan) sebelum masuk area operasional.', ['Helm tidak retak, tali dagu berfungsi', 'Sepatu tidak sobek, sol tidak aus', 'Rompi bersih dan reflektif terlihat']],
    ['Cek Area Kerja', 'Pastikan area aman sebelum mulai bekerja.', ['Lantai bebas oli dan genangan', 'Jalur bebas hambatan dan kabel', 'Tumpukan stabil, jalur forklift terpisah']],
    ['Komunikasi & Koordinasi', 'Pastikan operator dan rekan kerja tahu posisi Anda sebelum melintas atau mengangkat.', ['Kontak mata dengan operator forklift', 'Gunakan isyarat tangan yang disepakati', 'Terapkan STOP-THINK-ACT']],
    ['Operasional & Postur Aman', 'Bekerja dengan teknik yang tidak membebani tubuh.', ['Tekuk lutut, punggung tegak', 'Gunakan alat bantu untuk beban berat', 'Jangan melompat dari bak truk']],
    ['Penutupan & Lapor', 'Akhiri pekerjaan dengan merapikan area dan melaporkan kondisi.', ['Rapikan muatan dan alat', 'Laporkan kondisi tidak aman atau near-miss', 'Periksa kondisi diri, laporkan bila ada keluhan']]
];
(() => {
    const wrap = $('#proc-steps');
    if (!wrap) return;
    const seen = new Set();
    PROC.forEach((p, i) => wrap.insertAdjacentHTML('beforeend', `<button type="button" data-i="${i}">${i + 1}. ${p[0]}</button>`));
    const show = i => {
        seen.add(i);
        $('#proc-num').textContent = i + 1; $('#proc-title').textContent = PROC[i][0]; $('#proc-desc').textContent = PROC[i][1];
        $('#proc-list').innerHTML = PROC[i][2].map(t => `<li>${t}</li>`).join('');
        $$('button', wrap).forEach((b, n) => { b.classList.toggle('active', n === i); b.classList.toggle('seen', seen.has(n)); });
        if (seen.size === PROC.length) { 
            mark(4, 'prosedur'); 
            const btnScen = $('#btn-to-scenario');
            if (btnScen) {
                btnScen.disabled = false; 
                btnScen.classList.add('hint-pulse');
            }
        }
    };
    $$('button', wrap).forEach(b => b.addEventListener('click', () => show(+b.dataset.i)));
    onEnter['scene-14'] = () => { seen.clear(); $('#btn-to-scenario').disabled = !(progress[4] || []).includes('prosedur'); show(0); seen.clear(); seen.add(0); };
})();

const SCEN = {
    A: { cls: 'bad', t: 'Berbahaya', d: 'Melintas tiba-tiba membuat operator tidak sempat melihat atau berhenti. Forklift punya blind spot dan jarak henti yang panjang, sehingga risiko tertabrak sangat tinggi.', s: 0 },
    B: { cls: 'good', t: 'Tepat', d: 'Kontak mata memastikan operator melihat Anda. Menunggu tanda aman sebelum melintas adalah penerapan STOP-THINK-ACT.', s: 100 },
    C: { cls: 'mid', t: 'Kurang tepat', d: 'Memanggil rekan tidak menjamin forklift berhenti, dan rekan Anda ikut terpapar bahaya. Komunikasi harus langsung dengan operator.', s: 40 }
};

$$('[data-scenario]').forEach(b => b.addEventListener('click', () => {
    const r = SCEN[b.dataset.scenario];
    $('#scenario-card').className = 'result-card ' + r.cls;
    $('#scenario-title').textContent = r.t; $('#scenario-desc').textContent = r.d; $('#scenario-score').textContent = `Skor: ${r.s}`;
    $('#scenario-actions').innerHTML = r.cls === 'good'
        ? '<button class="btn btn-success hint-pulse" type="button" id="sc-finish">Selesai Modul 4</button>'
        : '<button class="btn btn-primary hint-pulse" type="button" id="sc-retry">Coba Lagi</button>';
    const f = $('#sc-finish'), t = $('#sc-retry');
    if (f) f.addEventListener('click', () => { mark(4, 'skenario'); goTo('scene-02'); });
    if (t) t.addEventListener('click', () => goTo('scene-15'));
    goTo('scene-16');
}));

/* ---------- Reset ---------- */
const bReset = $('#btn-reset'); if (bReset) bReset.addEventListener('click', () => { progress = {}; save(); renderMenu(); goTo('scene-01'); });

/* ---------- Modul 2: Interaksi Pill Hazard vs Risk ---------- */
const HVR_DATA = {
    hazard: {
        title: '⚠️ HAZARD (Bahaya)',
        desc: 'Segala sumber, situasi, atau aktivitas yang berpotensi menimbulkan cedera, penyakit akibat kerja, kerusakan peralatan, atau gangguan lingkungan.',
        example: '<strong>Contoh di Gudang:</strong> Genangan oli di lantai, tumpukan palet miring, atau forklift melintas tanpa klakson.'
    },
    risk: {
        title: '⚡ RISK (Risiko)',
        desc: 'Peluang atau kemungkinan terjadinya dampak buruk dari suatu bahaya, diukur bersama dengan tingkat keparahan (konsekuensi) yang ditimbulkannya.',
        example: '<strong>Contoh di Gudang:</strong> Peluang pekerja terpeleset genangan oli dengan keparahan cedera punggung atau kepala.'
    },
    formula: {
        title: '📐 RUMUS RISIKO',
        desc: 'Tingkat Risiko = Kemungkinan (Likelihood) × Keparahan (Severity). Mengukur seberapa sering potensi bahaya ditemui dan seberapa fatal akibatnya.',
        example: '<strong>Contoh:</strong> Tumpahan oli di area lalu lintas padat = Kemungkinan Tinggi × Dampak Sedang → Risiko Tinggi (wajib segera dibersihkan).'
    }
};

const hvrTitle = document.getElementById('hvr-callout-title');
const hvrDesc = document.getElementById('hvr-callout-desc');
const hvrExample = document.getElementById('hvr-callout-example');
const hvrPills = document.querySelectorAll('.hvr-pill');

if (hvrTitle && hvrPills.length) {
    hvrPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const key = pill.dataset.hvr;
            const data = HVR_DATA[key];
            if (!data) return;
            hvrPills.forEach(p => p.classList.toggle('active', p === pill));
            hvrTitle.innerHTML = data.title;
            hvrDesc.innerHTML = data.desc;
            hvrExample.innerHTML = data.example;
        });
    });
}

renderMenu();
updateModuleProgressUI();

// Hash check saat halaman dimuat
const initialHash = window.location.hash.replace('#', '');
if (initialHash && document.getElementById(initialHash) && document.getElementById(initialHash).classList.contains('scene')) {
    goTo(initialHash);
} else {
    const curActive = document.querySelector('.scene.active');
    if (curActive && onEnter[curActive.id]) {
        onEnter[curActive.id]();
    }
}
})();

/* ---------- Logika Audio Global & Tombol Suara ---------- */
(() => {
    const bgm = document.getElementById('bgm-player');
    if (!bgm) return;

    bgm.volume = 0.25;

    let soundOn = localStorage.getItem('k3_sound_on') !== 'false';

    function updateSoundUI() {
        document.querySelectorAll('[id="btn-sound"]').forEach(btnSound => {
            btnSound.textContent = soundOn ? '🔊 Sound' : '🔇 Mute';
            btnSound.setAttribute('aria-pressed', String(!soundOn));
        });
    }

    function playBGM() {
        if (soundOn) {
            const savedTime = parseFloat(localStorage.getItem('k3_bgm_time') || '0');
            if (!isNaN(savedTime) && Math.abs(bgm.currentTime - savedTime) > 2) {
                bgm.currentTime = savedTime;
            }
            bgm.play().catch(() => {});
        } else {
            bgm.pause();
        }
        updateSoundUI();
    }

    function setSoundEnabled(enabled) {
        soundOn = enabled;
        localStorage.setItem('k3_sound_on', String(soundOn));
        const video = document.getElementById('video-m2');
        if (video) video.muted = !soundOn;
        playBGM();
    }

    setInterval(() => {
        if (bgm && !bgm.paused) {
            localStorage.setItem('k3_bgm_time', bgm.currentTime.toString());
        }
    }, 1000);

    document.addEventListener('click', e => {
        const btnSound = e.target.closest('#btn-sound');
        if (btnSound) {
            setSoundEnabled(!soundOn);
            return;
        }

        if (soundOn && bgm.paused) {
            playBGM();
        }
    });

    updateSoundUI();
    playBGM();
})();