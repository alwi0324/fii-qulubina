// INTEGRASI GAS
// 1. KONFIGURASI API GAS
const GAS_API_URL =
  "https://script.google.com/macros/s/AKfycbziythGmVmxp_pmLR2NiqhVgIYEEFHdNe6abTfH5krqTK7_yilz7036rPEFqXj3zzDA/exec";

let semuaArtikel = [];

// 2. FUNGSI UTAMA LOAD DATA DARI GOOGLE SHEETS
async function muatDataArtikel() {
  try {
    const response = await fetch(GAS_API_URL);
    semuaArtikel = await response.json();

    // Jalankan router setelah data berhasil diamankan di memori browser
    routerArtikel();
  } catch (error) {
    console.error("Gagal memuat data dari Spreadsheet:", error);
    document.getElementById("judul-artikel").innerText = "Gagal Memuat Konten.";
  }
}

// 3. FUNGSI ROUTER (Mendeteksi perubahan URL /#/rangkuman/slug)
function routerArtikel() {
  const hash = window.location.hash; // Mengambil text seperti '#/rangkuman/ini-judul-pertama'

  // Pola regex untuk mendeteksi router /rangkuman/any-slug
  const match = hash.match(/^#\/rangkuman\/([a-zA-Z0-9-]+)$/);

  if (match && semuaArtikel.length > 0) {
    const targetSlug = match[1];
    // Cari artikel di dalam array yang memiliki properti slug yang sama
    const dataArtikel = semuaArtikel.find((item) => item.slug === targetSlug);

    if (dataArtikel) {
      renderArtikel(dataArtikel);
    } else {
      renderHalaman404();
    }
  } else {
    // Jika mengakses root/beranda tanpa hash spesifik, tampilkan baris pertama database sebagai default
    if (semuaArtikel.length > 0) {
      renderArtikel(semuaArtikel[0]);
    }
  }
}

// 4. FUNGSI RENDER DATA KE ELEMEN HTML BODY
function renderArtikel(artikel) {
  // A. Sesuaikan Kategori dan Penulis
  const elemenMeta = document.getElementById("meta-kategori-penulis");
  if (elemenMeta) {
    elemenMeta.innerHTML = `${artikel.kategori} • Oleh ${artikel.penulis}`;
  }

  // B. Sesuaikan Judul
  document.getElementById("judul-artikel").innerText = artikel.judul;

  // C. Sesuaikan Gambar Utama (src)
  const imgElement = document.getElementById("gambar-artikel");
  if (imgElement && artikel.gambar) {
    imgElement.src = artikel.gambar;
    imgElement.alt = `Gambar Ilustrasi ${artikel.judul}`;
  }

  // D. Looping Poin-Poin secara Dinamis dari Spreadsheet
  const containerPoin = document.getElementById("konten-poin");
  if (containerPoin) {
    containerPoin.innerHTML = ""; // Bersihkan contoh statis sebelumnya

    // Mengambil semua properti objek yang diawali dengan kata "poin" dan diikuti angka (poin1, poin2, ... poin99)
    const keysPoinBerisi = Object.keys(artikel)
      .filter(
        (key) =>
          /^poin\d+$/.test(key) &&
          artikel[key] &&
          artikel[key].toString().trim() !== "",
      )
      .sort(
        (a, b) =>
          parseInt(a.replace("poin", "")) - parseInt(b.replace("poin", "")),
      ); // Urutkan berdasarkan angka poin

    keysPoinBerisi.forEach((key) => {
      const li = document.createElement("li");
      // Menambahkan font kustom tulisan tangan (text-xl/2xl disarankan karena font jenis cursive cenderung lebih kecil ukurannya)
      li.className =
        "relative pl-12 font-handwritten text-xl sm:text-2xl tracking-wide before:font-sans before:text-sm before:content-[counter(item)] [counter-increment:item] before:absolute before:left-0 before:top-1 before:flex before:h-8 before:w-8 before:items-center before:justify-center before:rounded-full before:bg-amber-600 before:text-sm before:font-bold before:text-white dark:before:bg-amber-500";

      const innerDiv = document.createElement("div");
      innerDiv.className = "leading-relaxed text-slate-800 dark:text-slate-200";
      innerDiv.innerHTML = artikel[key];

      li.appendChild(innerDiv);
      containerPoin.appendChild(li);
    });
  }

  // E. Sesuaikan Audio Engine & Detail Player Komponen Musik
  const audioEngine = document.getElementById("audio-engine");
  if (audioEngine) {
    audioEngine.pause();
    if (artikel.audio && artikel.audio.trim() !== "") {
      audioEngine.src = artikel.audio;
      audioEngine.load();
      if (musicPlayer) musicPlayer.classList.remove("hidden"); // Tampilkan player jika ada lagu
    } else {
      audioEngine.src = "";
      if (musicPlayer) musicPlayer.classList.add("hidden"); // Sembunyikan player jika kolom audio kosong di DB
    }

    const playIcon = document.getElementById("play-icon");
    if (playIcon) playIcon.className = "fa-solid fa-play text-lg pl-1";
  }

  // Update teks judul lagu pada komponen boks player bawah
  const elemenNamaAudio = document.querySelector(
    "#music-player p.font-semibold",
  );
  const elemenSubAudio = document.querySelector("#music-player p.text-xs");
  if (elemenNamaAudio) elemenNamaAudio.innerText = artikel.judul;
  if (elemenSubAudio) elemenSubAudio.innerText = `${artikel.penulis}`;

  bangunNavigasiKategori(artikel);
}

function bangunNavigasiKategori(artikelAktif) {
  // Filter seluruh artikel dari database yang memiliki kategori yang sama
  const artikelSeketegori = semuaArtikel.filter(
    (item) => item.kategori === artikelAktif.kategori,
  );
  const indeksSekarang = artikelSeketegori.findIndex(
    (item) => item.slug === artikelAktif.slug,
  );

  const totalArtikel = artikelSeketegori.length;
  const nomorUrut = indeksSekarang + 1;

  // Siapkan data artikel sebelum dan sesudahnya
  const artikelSbelumnya = artikelSeketegori[indeksSekarang - 1];
  const artikelBerikutnya = artikelSeketegori[indeksSekarang + 1];

  // Template Struktur HTML Navigasi dengan Font Awesome Ikon
  const buatHtmlNav = (posisi) => {
    return `
      ${
        artikelSbelumnya
          ? `<a href="#/rangkuman/${artikelSbelumnya.slug}" class="flex items-center gap-1.5 hover:text-amber-600 dark:hover:text-amber-400 transition-colors" title="${artikelSbelumnya.judul}">
             <i class="fa-solid fa-chevron-left text-xs"></i>
           </a>`
          : `<span class="text-slate-300 dark:text-slate-700 cursor-not-allowed"><i class="fa-solid fa-chevron-left text-xs"></i></span>`
      }
      <span class="${posisi === "top" ? "text-xs uppercase tracking-wider" : ""}">
        Rangkuman ke <span class="text-amber-600 dark:text-amber-400 font-bold">${nomorUrut}</span> dari ${totalArtikel} di <span class="underline decoration-amber-500/40 decoration-2">${artikelAktif.kategori}</span>
      </span>
      ${
        artikelBerikutnya
          ? `<a href="#/rangkuman/${artikelBerikutnya.slug}" class="flex items-center gap-1.5 hover:text-amber-600 dark:hover:text-amber-400 transition-colors" title="${artikelBerikutnya.judul}">
             <i class="fa-solid fa-chevron-right text-xs"></i>
           </a>`
          : `<span class="text-slate-300 dark:text-slate-700 cursor-not-allowed"><i class="fa-solid fa-chevron-right text-xs"></i></span>`
      }
    `;
  };

  // Injeksikan ke posisi atas dan bawah artikel
  const elTop = document.getElementById("nav-kategori-top");
  const elBottom = document.getElementById("nav-kategori-bottom");

  if (elTop) elTop.innerHTML = buatHtmlNav("top");
  if (elBottom) elBottom.innerHTML = buatHtmlNav("bottom");
}

function renderHalaman404() {
  document.getElementById("meta-kategori-penulis").innerHTML = "KOSONG";
  document.getElementById("judul-artikel").innerText =
    "Rangkuman tidak ditemukan.";

  // Set gambar default jika halaman error agar UI tidak memuat gambar artikel sebelumnya
  const imgElement = document.getElementById("gambar-artikel");
  if (imgElement) {
    imgElement.src =
      "https://herza.id/wp-content/uploads/2023/11/Error-404-Solusi-Mudah-untuk-Mengatasi-Masalah-Halaman-Tidak-Ditemukan.jpg";
    imgElement.alt = "Halaman Tidak Ditemukan";
  }

  const containerPoin = document.getElementById("konten-poin");
  if (containerPoin)
    containerPoin.innerHTML =
      "<li class='text-slate-700 dark:text-white'>Silakan periksa kembali tautan internal Anda atau pilih menu lain di samping.</li>";

  // Bersihkan audio & sembunyikan music player bawaan agar tidak tertinggal
  const audioEngine = document.getElementById("audio-engine");
  if (audioEngine) {
    audioEngine.pause();
    audioEngine.src = "";
  }
  const musicPlayer = document.getElementById("music-player");
  if (musicPlayer) musicPlayer.classList.add("hidden");

  // Kosongkan komponen navigasi internal
  const elTop = document.getElementById("nav-kategori-top");
  const elBottom = document.getElementById("nav-kategori-bottom");
  if (elTop) elTop.innerHTML = "";
  if (elBottom) elBottom.innerHTML = "";
}

// 6. EVENT LISTENERS
window.addEventListener("DOMContentLoaded", muatDataArtikel);

// Pantau jika pengguna menekan link menu navigasi yang mengubah alamat hash URL
window.addEventListener("hashchange", routerArtikel);

// --------------------------------------------------------------------------------------------------------------- //

const htmlElement = document.documentElement;
const darkModeBtn = document.getElementById("dark-mode-toggle");

function sesuaikanIkon() {
  const isDark = htmlElement.classList.contains("dark");
  document.getElementById("dark-icon").style.display = isDark
    ? "block"
    : "none";
  document.getElementById("light-icon").style.display = isDark
    ? "none"
    : "block";
}
sesuaikanIkon();

darkModeBtn.addEventListener("click", () => {
  if (htmlElement.classList.contains("dark")) {
    htmlElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    htmlElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
  sesuaikanIkon();
});

// --- MANIPULASI TOGGLE SIDEBAR MODERN (HP, TABLET, LAPTOP) ---
const sidebar = document.getElementById("sidebar");
const mainWrapper = document.getElementById("main-wrapper");
const toggleBtn = document.getElementById("toggle-sidebar-btn");
const hamburgerIcon = document.getElementById("hamburger-icon");
const overlay = document.getElementById("sidebar-overlay");

function perbaruiIkonDanPerilaku() {
  const isClosed =
    sidebar.classList.contains("w-0") ||
    sidebar.classList.contains("-translate-x-full");

  // Sinkronisasi Ikon Hamburger/Close
  if (!isClosed) {
    hamburgerIcon.classList.remove("fa-bars");
    hamburgerIcon.classList.add("fa-xmark", "rotate-icon");
  } else {
    hamburgerIcon.classList.remove("fa-xmark", "rotate-icon");
    hamburgerIcon.classList.add("fa-bars");
  }

  // Sinkronisasi pergeseran wrapper konten untuk layar besar (Tablet / PC / HP LandscapeWide)
  if (window.innerWidth >= 768) {
    if (isClosed) {
      mainWrapper.style.paddingLeft = "0px";
    } else {
      mainWrapper.style.paddingLeft = "264px"; // 264px sepadan dengan lebar w-64 + border
    }
  } else {
    // Layar HP Portrait: Konten tetap memenuhi layar karena sidebar menjadi overlay di atasnya
    mainWrapper.style.paddingLeft = "0px";
  }
}

function initSidebar() {
  if (window.innerWidth >= 768) {
    // Layar Besar: Default Terbuka
    sidebar.classList.remove("w-0", "-translate-x-full");
    sidebar.classList.add("w-64");
  } else {
    // Layar Kecil: Default Tertutup
    sidebar.classList.add("-translate-x-full", "w-0");
    sidebar.classList.remove("w-64");
  }
  perbaruiIkonDanPerilaku();
}

function toggleSidebar() {
  if (window.innerWidth >= 768) {
    // Aksi Desktop / Tablet
    const isClosed = sidebar.classList.contains("w-0");
    if (isClosed) {
      sidebar.classList.remove("w-0");
      sidebar.classList.add("w-64");
    } else {
      sidebar.classList.remove("w-64");
      sidebar.classList.add("w-0");
    }
  } else {
    // Aksi Mobile HP Portrait
    const isHidden = sidebar.classList.contains("-translate-x-full");
    if (isHidden) {
      sidebar.classList.remove("-translate-x-full");
      sidebar.classList.replace("w-0", "w-64");
      overlay.classList.remove("hidden");
    } else {
      sidebar.classList.add("-translate-x-full");
      sidebar.classList.replace("w-64", "w-0");
      overlay.classList.add("hidden");
    }
  }
  perbaruiIkonDanPerilaku();
}

// Event Listeners
toggleBtn.addEventListener("click", toggleSidebar);
overlay.addEventListener("click", toggleSidebar);
window.addEventListener("DOMContentLoaded", initSidebar);

window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) {
    overlay.classList.add("hidden");
    sidebar.classList.remove("-translate-x-full");
    if (!sidebar.classList.contains("w-0")) {
      sidebar.classList.add("w-64");
    }
  } else {
    if (
      sidebar.classList.contains("w-64") &&
      !sidebar.classList.contains("-translate-x-full")
    ) {
      overlay.classList.remove("hidden");
    }
  }
  perbaruiIkonDanPerilaku();
});

// --- AUDIO INTERAKTIF ENGINE ---
const audio = document.getElementById("audio-engine");
const playIcon = document.getElementById("play-icon");
const audioSlider = document.getElementById("audio-slider");
const musicPlayer = document.getElementById("music-player");

// --- 1. LOGIKA PEWARNAAN TRACK SLIDER ---
function updateSliderColor(persen) {
  const isDark = document.documentElement.classList.contains("dark");

  // Tentukan kode warna berdasarkan status tema aktif
  const warnaIsi = isDark ? "#f59e0b" : "#d97706"; // Indigo-500 vs Indigo-600
  const warnaSisa = isDark ? "#334155" : "#e2e8f0"; // Slate-700 vs Slate-200

  // Tembakkan perubahan style background-image secara real-time
  audioSlider.style.backgroundImage = `linear-gradient(to right, ${warnaIsi} 0%, ${warnaIsi} ${persen}%, ${warnaSisa} ${persen}%, ${warnaSisa} 100%)`;
}

// --- 2. UPDATE PROGRESS & TIMER KETIKA LAGU BERJALAN ---
audio.addEventListener("timeupdate", () => {
  // Format teks menit dan detik untuk Current Time
  const minutes = Math.floor(audio.currentTime / 60);
  const seconds = Math.floor(audio.currentTime % 60);
  document.getElementById("current-time").innerText =
    `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  // Sinkronisasi posisi jempol slider dan pewarnaan jalurnya
  if (audio.duration) {
    const posisiPersen = (audio.currentTime / audio.duration) * 100;
    audioSlider.value = posisiPersen;
    updateSliderColor(posisiPersen);
  }
});

// --- 3. BACA DURASI TOTAL SAAT METADATA AUDIO SELESAI DIMUAT ---
audio.addEventListener("loadedmetadata", () => {
  const totalMinutes = Math.floor(audio.duration / 60);
  const totalSeconds = Math.floor(audio.duration % 60);
  document.getElementById("total-time").innerText =
    `${totalMinutes}:${totalSeconds < 10 ? "0" : ""}${totalSeconds}`;
});

// --- 4. DETEKSI AKSI KLIK, SERET, DAN SENTUH PADA SLIDER ---
audioSlider.addEventListener("input", () => {
  if (audio.duration) {
    // Konversi nilai persen slider kembali menjadi satuan detik audio
    const detikTujuan = (audioSlider.value / 100) * audio.duration;
    audio.currentTime = detikTujuan;

    // Warnai slider secara instan saat digeser manual
    updateSliderColor(audioSlider.value);
  }
});

// Penyelaras warna progress bar jika pengguna menekan tombol toggle tema (Light/Dark)
document.getElementById("dark-mode-toggle").addEventListener("click", () => {
  if (audio.duration) {
    const posisiPersen = (audio.currentTime / audio.duration) * 100;
    // Diberi delay kecil agar transisi class "dark" selesai dieksekusi browser lebih dulu
    setTimeout(() => updateSliderColor(posisiPersen), 50);
  }
});

// --- 5. FUNGSI KONTROL UTAMA TOMBOL AUDIO ---
function togglePlay() {
  if (audio.paused) {
    audio.play();
    playIcon.className = "fa-solid fa-pause text-lg";
  } else {
    audio.pause();
    playIcon.className = "fa-solid fa-play text-lg pl-1";
  }
}

function rewindAudio() {
  audio.currentTime = Math.max(0, audio.currentTime - 10);
}

function fastForwardAudio() {
  audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
}

// --- 6. LOGIKA AUTO-HIDE PLAYER KETIKA HALAMAN DI-SCROLL ---
let posisiScrollTerakhir = 0;

window.addEventListener("scroll", () => {
  const posisiScrollSaatIni =
    window.pageYOffset || document.documentElement.scrollTop;

  // Antisipasi ketidakstabilan efek pantul (bounce) di perangkat iOS
  if (posisiScrollSaatIni < 0) return;

  if (posisiScrollSaatIni > posisiScrollTerakhir) {
    // 1. SCROLL KE BAWAH: Sembunyikan player ke luar batas bawah layar
    // KUNCI: Wajib hapus 'translate-y-0' agar 'translate-y-full' bisa bekerja!
    musicPlayer.classList.remove("translate-y-0");
    musicPlayer.classList.add(
      "translate-y-full",
      "opacity-0",
      "pointer-events-none",
    );
  } else {
    // 2. SCROLL KE ATAS: Tampilkan player kembali ke posisi normal
    // KUNCI: Wajib hapus 'translate-y-full' agar 'translate-y-0' bisa mengembalikan posisi!
    musicPlayer.classList.remove(
      "translate-y-full",
      "opacity-0",
      "pointer-events-none",
    );
    musicPlayer.classList.add("translate-y-0");
  }

  // Rekam posisi terakhir untuk perbandingan di event scroll berikutnya
  posisiScrollTerakhir = posisiScrollSaatIni;
});

// --- 7. RESET PLAYER KETIKA LAGU SUDAH SELESAI (REACHED END) ---
audio.addEventListener("ended", () => {
  // 1. Kembalikan ikon menjadi tombol PLAY
  playIcon.className = "fa-solid fa-play text-lg translate-x-0.5";

  // 2. Reset waktu audio ke titik 0
  audio.currentTime = 0;

  // 3. Reset tampilan text timer ke 0:00
  document.getElementById("current-time").innerText = "0:00";

  // 4. Kembalikan slider ke posisi awal (0) dan reset warnanya
  audioSlider.value = 0;
  updateSliderColor(0);
});
