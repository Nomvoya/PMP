(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Progres ---------- */
const MODULES = {
    1: ['pengertian', 'tujuan', 'landasan', 'kuis'],
    2: ['hvr', 'tahap', 'temukan', 'risiko', 'kendali', 'near'],
    3: ['apd-lihat', 'apd-latihan'],
    4: ['prosedur', 'skenario']
};
const STORE = 'k3-bongkar-muat-progress';
let progress = (() => { try { const p = JSON.parse(localStorage.getItem(STORE)); if (p && typeof p === 'object') return p; } catch (e) {} return {}; })();
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(progress)); } catch (e) {} };
const done = m => (progress[m] || []).filter(k => MODULES[m].includes(k)).length;
const pct = m => Math.round(100 * done(m) / MODULES[m].length);
const isComplete = m => done(m) === MODULES[m].length;
function mark(m, k) {
    const a = progress[m] = progress[m] || [];
    if (!a.includes(k)) { a.push(k); save(); renderMenu(); }
}
function renderMenu() {
    let completed = 0;
    $$('.module-card').forEach(card => {
        const m = card.dataset.module, p = pct(m), full = isComplete(m);
        if (full) completed++;
        $('[data-pct]', card).textContent = p + '%';
        $('[data-fill]', card).style.width = p + '%';
        $('.badge-done', card).hidden = !full;
        $('.btn', card).textContent = full ? 'Ulangi' : (p > 0 ? 'Lanjutkan' : 'Buka');
    });
    const ot = $('#overall-text'); if (ot) ot.textContent = `Progres keseluruhan: ${completed} dari 4 modul`;
    const of = $('#overall-fill'); if (of) of.style.width = (completed * 25) + '%';
    const fin = $('#btn-final');
    if (fin) {
        fin.disabled = completed < 4;
        fin.textContent = completed < 4 ? 'Kuis Akhir (terkunci)' : 'Mulai Kuis Akhir';
    }
}

/* ---------- Navigasi ---------- */
const onEnter = {};
function goTo(id) {
    const target = document.getElementById(id);
    if (target && target.classList.contains('scene')) {
        $$('.scene').forEach(s => s.classList.toggle('active', s.id === id));
        window.scrollTo(0, 0);
        if (onEnter[id]) onEnter[id]();
    } else {
        // Multi-page routing fallback jika scene berada di file HTML terpisah
        if (id === 'scene-01') {
            window.location.href = 'start.html';
        } else if (id === 'scene-02') {
            window.location.href = 'home.html';
        } else if (id === 'scene-game') {
            window.location.href = 'game.html';
        } else {
            window.location.href = 'home.html#' + id;
        }
    }
}
document.addEventListener('click', e => {
    const t = e.target.closest('[data-go]');
    if (!t || t.disabled) return;
    if (t.dataset.mark) { const [m, k] = t.dataset.mark.split(':'); mark(m, k); }
    goTo(t.dataset.go);
});

// Dukungan navigasi langsung ke modul via URL hash (contoh: home.html#scene-03)
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
                if (t.dataset.mark) { const [m, k] = t.dataset.mark.split(':'); mark(m, k); }
            }
        });
        if (list.dataset.complete && seen.size === tabs.length) { const [m, k] = list.dataset.complete.split(':'); mark(m, k); }
    };
    tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.tab)));
    list.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const i = tabs.indexOf(document.activeElement); if (i < 0) return;
        const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        n.focus(); show(n.dataset.tab);
    });
    tabApi.set(list, { show, first: tabs[0].dataset.tab, seen });
});
$$('[data-tab-go]').forEach(b => b.addEventListener('click', () => {
    const list = $$('[role="tablist"]').find(l => $(`[data-tab="${b.dataset.tabGo}"]`, l));
    tabApi.get(list).show(b.dataset.tabGo); window.scrollTo(0, 0);
}));
function resetTabs(sceneId) {
    $$('[role="tablist"]', document.getElementById(sceneId)).forEach(l => { const a = tabApi.get(l); a.seen.clear(); a.show(a.first); });
}
onEnter['scene-03'] = () => resetTabs('scene-03');
onEnter['scene-10'] = () => resetTabs('scene-10');

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

/* ---------- Mesin kuis ---------- */
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
        $$('.quiz-opt', host).forEach((b, n) => { b.disabled = true; if (n === q.a) b.classList.add('is-correct'); else if (n === k) b.classList.add('is-wrong'); });
        const last = i === qs.length - 1;
        $('#q-fb', host).innerHTML = `<div class="quiz-fb"><strong>${ok ? 'Benar.' : 'Kurang tepat.'}</strong> ${q.e}</div>
            <div class="actions"><button class="btn btn-primary" type="button" id="q-next">${last ? 'Lihat Hasil' : 'Lanjut'}</button></div>`;
        $('#q-next', host).addEventListener('click', () => { if (last) result(); else { i++; question(); } });
        $('#q-next', host).focus();
    }
    function result() {
        const pass = score / qs.length >= opt.pass;
        host.innerHTML = `
            <div class="panel" style="text-align:center;padding:32px">
                <div class="eyebrow">${opt.title}</div>
                <div class="score-big">${score}/${qs.length}</div>
                <p>${pass ? 'Bagus, Anda lulus kuis ini.' : `Skor belum cukup. Minimal ${Math.ceil(opt.pass * qs.length)} jawaban benar. Pelajari materi lalu coba lagi.`}</p>
                <div class="actions center">
                    ${pass ? '' : '<button class="btn btn-secondary" type="button" id="q-retry">Coba Lagi</button>'}
                    <button class="btn ${pass ? 'btn-success' : 'btn-ghost'}" style="${pass ? '' : 'color:var(--navy);border-color:var(--line)'}" type="button" id="q-exit">${pass ? opt.passLabel : 'Kembali ke Beranda'}</button>
                </div>
            </div>`;
        if (pass) opt.onPass(score, qs.length);
        const r = $('#q-retry', host); if (r) r.addEventListener('click', () => { i = 0; score = 0; question(); });
        $('#q-exit', host).addEventListener('click', () => goTo(pass ? opt.passTo : 'scene-02'));
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
const QUIZ_FINAL = [
    { q: 'Genangan oli di lantai gudang adalah contoh…', o: ['Hazard (bahaya)', 'Risiko tinggi', 'APD', 'Near-miss'], a: 0, e: 'Genangan oli adalah sumber potensi cedera, yaitu hazard.' },
    { q: 'Besar kecilnya risiko ditentukan oleh…', o: ['Warna area kerja', 'Kemungkinan terjadi dan keparahan dampaknya', 'Jumlah pekerja', 'Jam kerja'], a: 1, e: 'Risiko = kemungkinan × keparahan.' },
    { q: 'Urutan prinsip STOP-THINK-ACT yang benar adalah…', o: ['Henti → nilai bahaya & dampak → lapor/amankan/perbaiki', 'Lapor → henti → nilai bahaya', 'Nilai bahaya → lanjut bekerja → lapor', 'Amankan → lapor → henti'], a: 0, e: 'STOP saat tidak aman, THINK menilai bahaya dan dampak, ACT melapor, mengamankan, dan memperbaiki.' },
    { q: 'Cara mengangkat beban dari lantai yang benar adalah…', o: ['Membungkuk dengan lutut lurus', 'Tekuk lutut, punggung tegak, angkat dengan kaki', 'Memutar badan sambil mengangkat', 'Mengangkat dengan satu tangan'], a: 1, e: 'Punggung tegak dan tenaga dari kaki mengurangi beban pada tulang belakang.' },
    { q: 'Untuk membongkar muatan di area yang dilalui forklift, APD wajib yang tepat adalah…', o: ['Sandal, topi kain, jaket tebal', 'Helm, sepatu safety, rompi high-vis, sarung tangan, masker/kacamata', 'Hanya sarung tangan', 'Hanya rompi'], a: 1, e: 'Kelima APD tersebut melindungi kepala, kaki, visibilitas, tangan, serta mata dan pernapasan.' },
    { q: 'Forklift sedang bermanuver di dekat Anda. Tindakan paling aman adalah…', o: ['Melintas cepat', 'Berhenti di tempat aman, kontak mata dengan operator, tunggu tanda', 'Memanggil rekan agar menahan forklift', 'Melintas di belakang forklift'], a: 1, e: 'Pastikan operator melihat Anda sebelum melintas.' }
];
onEnter['scene-05'] = () => runQuiz($('#quiz-m1'), QUIZ_M1, { title: 'Kuis Formatif Modul 1', pass: 0.6, passLabel: 'Selesai, Kembali ke Beranda', passTo: 'scene-02', onPass: () => mark(1, 'kuis') });
onEnter['scene-18'] = () => runQuiz($('#quiz-final'), QUIZ_FINAL, { title: 'Kuis Akhir', pass: 0.7, passLabel: 'Lihat Hasil & Lencana', passTo: 'scene-17', onPass: (s, n) => { $('#final-score').textContent = `${s}/${n}`; } });

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
        if (found.size === 5) { $('#btn-after-find').hidden = false; mark(2, 'temukan'); }
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
            if (placed === 3) { msg.textContent = 'Semua kartu tepat. Terapkan STOP-THINK-ACT di bawah ini.'; $('#btn-after-risk').hidden = false; mark(2, 'risiko'); }
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
const bFinM2 = $('#btn-finish-m2'); if (bFinM2) bFinM2.addEventListener('click', () => { mark(2, 'near'); goTo('scene-02'); });

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
    onEnter['scene-12'] = () => { seen.clear(); $$('#scene-12 [data-apd]').forEach(el => el.classList.remove('found', 'seen', 'active')); $('#apd-detail').innerHTML = '<p class="fine" style="margin:0">Pilih salah satu APD untuk melihat detailnya.</p>'; };
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
        if (!wrong && !missing) { fb.textContent = 'Benar. Kelima APD wajib sudah dipilih.'; fb.className = 'msg ok'; $('#btn-finish-m3').hidden = false; mark(3, 'apd-latihan'); }
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
        if (seen.size === PROC.length) { mark(4, 'prosedur'); $('#btn-to-scenario').disabled = false; }
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
        ? '<button class="btn btn-success" type="button" id="sc-finish">Selesai Modul 4</button>'
        : '<button class="btn btn-primary" type="button" id="sc-retry">Coba Lagi</button>';
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

const vM2 = document.getElementById('video-m2');
const vPhM2 = document.getElementById('video-placeholder-m2');
if (vM2 && vPhM2) {
    vM2.addEventListener('play', () => { vPhM2.style.display = 'none'; });
    vPhM2.addEventListener('click', () => {
        if (vM2.currentSrc || vM2.querySelector('source[src]')) {
            vM2.play().catch(() => {});
            vPhM2.style.display = 'none';
        }
    });
}

renderMenu();
})();
