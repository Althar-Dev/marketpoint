export interface DetailedModule {
  slug: string;
  level: "Pemula" | "Menengah" | "Mahir";
  levelBadgeColor: string;
  title: string;
  readTime: string;
  summary: string;
  updatedAt: string;
  author: string;
  chapters: {
    title: string;
    description: string;
    tips?: string;
  }[];
  keyTakeaways: string[];
  faqs: {
    q: string;
    a: string;
  }[];
  ctaText: string;
  ctaLink: string;
}

export const SELLER_MODULES: DetailedModule[] = [
  {
    slug: "langkah-memulai-toko",
    level: "Pemula",
    levelBadgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200",
    title: "Panduan Lengkap Memulai & Mengaktifkan Toko Digital",
    readTime: "5 min baca",
    summary: "Langkah-langkah strategis mengaktifkan toko gratis, memilih nama brand yang menjual, dan melengkapi profil etalase agar langsung dipercaya calon pembeli.",
    updatedAt: "10 Oktober 2026",
    author: "StarVale Technology Solution / MarketPoint Seller Academy",
    chapters: [
      {
        title: "1. Mengakses Pendaftaran Toko Mandiri",
        description: "Buka menu akun Anda di pojok kanan atas, lalu pilih opsi 'Toko Saya' atau kunjungi langsung halaman pendaftaran toko. Di MarketPoint, aktivasi toko 100% gratis tanpa biaya pendaftaran awal, tanpa iuran langganan bulanan, dan langsung aktif seketika.",
        tips: "Gunakan email dan nomor WhatsApp yang aktif karena notifikasi pesanan masuk dan verifikasi pencairan saldo akan dikirimkan ke kontak tersebut."
      },
      {
        title: "2. Menentukan Nama Toko yang Menjual & Relevan",
        description: "Nama toko adalah aset merek pertama Anda. Pilihlah nama yang singkat, mudah diucapkan, dan mencerminkan kategori produk utama Anda. Hindari nama yang terlalu umum atau mengandung karakter acak. Contoh yang baik: 'DevCraft Studio', 'IndoLicense Pro', atau 'DigitalAsset Indonesia'.",
        tips: "Hindari menggunakan nama merek dagang resmi pihak ketiga (seperti 'Microsoft Official Store' atau 'Adobe ID') untuk mencegah pelanggaran hak cipta."
      },
      {
        title: "3. Melengkapi Logo, Banner, dan Deskripsi Toko",
        description: "Visual toko yang rapi meningkatkan konversi penjualan hingga 40%. Unggah logo toko beresolusi persegi minimal 300x300 piksel dan banner header yang menarik. Pada kolom deskripsi, tuliskan secara ringkas spesialisasi produk Anda, jam operasional respon chat, dan jaminan kualitas yang Anda berikan.",
        tips: "Gunakan palet warna yang konsisten antara logo dan banner agar toko Anda terlihat seperti brand software profesional."
      },
      {
        title: "4. Menyetujui Ketentuan & Integritas Penjual",
        description: "Setiap penjual di MarketPoint wajib menyetujui Pakta Integritas: hanya menjual produk yang memiliki hak lisensi sah, tidak menjual file berbahaya (malware/trojan), dan berkomitmen merespons kendala pembeli dalam waktu 1x24 jam.",
        tips: "Toko yang menjaga reputasi baik akan mendapatkan badge 'Verified Seller' yang meningkatkan kepercayaan pembeli berkali-kali lipat."
      }
    ],
    keyTakeaways: [
      "Buka toko di MarketPoint gratis tanpa biaya pendaftaran.",
      "Identitas visual (logo & banner) yang rapi meningkatkan kepercayaan pembeli.",
      "Deskripsi toko yang jelas mengurangi pertanyaan berulang di chat.",
      "Kepatuhan integritas adalah syarat mutlak menjaga toko tetap aktif."
    ],
    faqs: [
      {
        q: "Berapa lama proses persetujuan buka toko?",
        a: "Aktivasi toko di MarketPoint bersifat instan. Segera setelah formulir identitas toko Anda kirimkan, dashboard Toko Saya langsung siap digunakan."
      },
      {
        q: "Apakah satu akun pembeli bisa memiliki toko?",
        a: "Ya! Akun MarketPoint Anda berfungsi ganda: Anda bisa membeli produk digital sekaligus membuka toko untuk menjual karya Anda."
      }
    ],
    ctaText: "Buka Toko Sekarang",
    ctaLink: "/register"
  },
  {
    slug: "upload-produk-auto-delivery",
    level: "Pemula",
    levelBadgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200",
    title: "Upload Produk & Konfigurasi Pengiriman Otomatis (Auto-Delivery)",
    readTime: "6 min baca",
    summary: "Cara mengunggah produk digital, membedakan tipe file vs serial key lisensi, dan mengaktifkan bot pengiriman otomatis 24 jam nonstop.",
    updatedAt: "10 Oktober 2026",
    author: "StarVale Technology Solution / MarketPoint Seller Academy",
    chapters: [
      {
        title: "1. Memilih Jenis Produk: Lisensi Kode vs File Unduhan",
        description: "MarketPoint mendukung dua jenis produk non-fisik utama: 1) Lisensi Kode Serial (seperti key aktivasi Windows, Office, antivirus, token voucher), dan 2) File Master Digital (source code ZIP, template Figma, preset, e-book). Pilihlah tipe produk yang sesuai agar sistem memproses pengiriman dengan tepat.",
        tips: "Untuk produk source code, pastikan file ZIP telah dibersihkan dari folder 'node_modules', '.git', atau file credential rahasia (.env)."
      },
      {
        title: "2. Menulis Judul dan Deskripsi Spesifikasi Teknis",
        description: "Judul produk harus jelas dan memuat kata kunci pencarian (contoh: 'Source Code E-Commerce Next.js 15 & Tailwind - Siap Produksi'). Pada kolom deskripsi, sertakan: fitur utama, tech stack yang digunakan, versi minimum PHP/Node/Flutter, panduan persyaratan server, dan apa saja yang didapatkan pembeli.",
        tips: "Gunakan format bullet points agar spesifikasi mudah dipindai oleh pembeli dalam hitungan detik."
      },
      {
        title: "3. Mengisi Stok Lisensi Otomatis (Instant Auto-Delivery)",
        description: "Fitur Auto-Delivery adalah keunggulan utama MarketPoint. Anda cukup memasukkan daftar serial key lisensi satu per satu ke kolom inventaris stok. Setiap kali ada pembeli yang transfernya terverifikasi, sistem bot akan mengambil satu serial key secara otomatis dan menampilkannya di layar pesanan pembeli tanpa campur tangan manual Anda.",
        tips: "Stok akan berkurang otomatis seiring transaksi sukses. Pasang pengingat jika stok lisensi Anda tersisa kurang dari 5 buah."
      },
      {
        title: "4. Melampirkan File README & Panduan Setup",
        description: "Sertakan file teks atau tautan dokumentasi online yang memandu pembeli cara mengaktivasi lisensi atau cara menjalankan source code di server lokal. Hal ini akan memangkas tiket komplain hingga 80%.",
        tips: "Sediakan tautan video demo atau dokumentasi online interaktif untuk menambah nilai profesional produk Anda."
      }
    ],
    keyTakeaways: [
      "Fitur Auto-Delivery memungkinkan toko Anda menghasilkan penjualan bahkan saat Anda sedang offline.",
      "Spesifikasi teknis yang lengkap mencegah salah paham ekspektasi pembeli.",
      "Pembersihan file ZIP sebelum upload melindungi keamanan data pribadi Anda.",
      "Dokumentasi README yang jelas menghasilkan ulasan bintang 5."
    ],
    faqs: [
      {
        q: "Apakah file source code aman dari unduhan tidak sah?",
        a: "Sangat aman. Link unduhan di MarketPoint dienkripsi dan hanya dapat diakses oleh akun pembeli yang transaksi pembayarannya telah terverifikasi lunas."
      },
      {
        q: "Bagaimana jika stok kode lisensi saya habis?",
        a: "Sistem otomatis akan menandai produk sebagai 'Stok Habis' sehingga tidak ada pembeli yang membayar tanpa menerima kode."
      }
    ],
    ctaText: "Kelola Produk Toko",
    ctaLink: "/my-shop"
  },
  {
    slug: "kupon-diskon-dan-flash-sale",
    level: "Menengah",
    levelBadgeColor: "bg-blue-50 text-blue-600 border-blue-200",
    title: "Strategi Promosi: Kupon Diskon Toko & Fitur Flash Sale",
    readTime: "5 min baca",
    summary: "Pelajari cara melipatgandakan omset toko dengan kupon diskon mandiri, penawaran bundel hemat, dan mendaftarkan produk ke sesi Flash Sale platform.",
    updatedAt: "08 Oktober 2026",
    author: "StarVale Technology Solution / MarketPoint Seller Academy",
    chapters: [
      {
        title: "1. Membuat Kode Voucher Promo Toko",
        description: "Masuk ke menu 'Kupon & Voucher' di dashboard merchant. Anda dapat membuat kupon dengan tipe potongan persentase (misal: Diskon 20%) atau potongan harga tetap (misal: Potongan Rp 25.000). Anda juga bisa menetapkan batas minimal belanja dan kuota pemakaian maksimal kupon.",
        tips: "Gunakan nama kupon yang menarik dan mudah diingat, misalnya: 'DEVHEMAT', 'LAUNCH50', atau 'PROMOSPESIAL'."
      },
      {
        title: "2. Menentukan Waktu Berlakunya Promo",
        description: "Promo yang memiliki batas waktu menciptakan urgensi psikologis (*FOMO*). Atur tanggal mulai dan tanggal berakhirnya voucher (misal selama 3 hari di akhir pekan atau tanggal gajian). Kampanye berbatas waktu terbukti menaikkan konversi hingga 2.5 kali lipat.",
        tips: "Kombinasikan dengan pengumuman di postingan update toko atau grup WhatsApp komunitas."
      },
      {
        title: "3. Mendaftarkan Produk ke Slot Flash Sale Platform",
        description: "Flash Sale adalah etalase paling ramai di MarketPoint. Masuk ke menu 'Flash Sale' di dashboard toko Anda, pilih produk yang ingin diikutsertakan, tentukan persentase diskon promo, dan ajukan ke slot waktu yang tersedia.",
        tips: "Pastikan stok lisensi atau file produk Anda mencukupi sebelum event Flash Sale dimulai."
      },
      {
        title: "4. Membagikan Link Promosi Toko ke Luar Platform",
        description: "Salin link unik toko atau produk Anda, lalu bagikan ke forum komunitas developer, grup Telegram, LinkedIn, atau media sosial. Pembeli yang datang melalui link Anda dapat langsung memasukkan kupon saat checkout.",
        tips: "Sertakan ulasan atau testimoni pembeli sebelumnya saat membagikan link promo."
      }
    ],
    keyTakeaways: [
      "Voucher diskon mandiri memberikan fleksibilitas penuh bagi penjual mengatur promo.",
      "Batas waktu promo menciptakan dorongan psikologis untuk segera bertransaksi.",
      "Flash Sale adalah magnet traffic terbesar untuk menjaring pembeli baru.",
      "Distribusi link promosi ke media sosial memperluas jangkauan pembeli di luar platform."
    ],
    faqs: [
      {
        q: "Siapa yang menanggung potongan harga dari voucher toko?",
        a: "Voucher yang dibuat di menu toko Anda sepenuhnya merupakan diskon yang Anda berikan kepada pembeli, sehingga potongan tersebut ditanggung oleh margin toko Anda."
      },
      {
        q: "Bisa berapa banyak kupon aktif secara bersamaan?",
        a: "Anda dapat mengaktifkan hingga puluhan kupon diskon berbeda dengan kode dan kriteria pembelanjaan yang berbeda."
      }
    ],
    ctaText: "Buat Kupon Diskon Toko",
    ctaLink: "/my-shop/vouchers"
  },
  {
    slug: "escrow-dan-pencairan-saldo",
    level: "Menengah",
    levelBadgeColor: "bg-blue-50 text-blue-600 border-blue-200",
    title: "Sistem Rekening Bersama (Escrow) & Prosedur Payout Saldo",
    readTime: "5 min baca",
    summary: "Memahami bagaimana dana penjualan diamankan, siklus pelepasan saldo escrow, dan panduan mencairkan uang ke rekening bank atau e-wallet Anda.",
    updatedAt: "08 Oktober 2026",
    author: "StarVale Technology Solution / MarketPoint Seller Academy",
    chapters: [
      {
        title: "1. Mekanisme Rekening Bersama Melindungi Penjual",
        description: "Banyak penjual khawatir bertransaksi online karena maraknya modus 'pembeli pura-pura transfer'. Di MarketPoint, sistem gerbang pembayaran kami memvalidasi transfer pembeli 100% di awal sebelum pesanan dibuat. Dana pembeli terkunci aman di rekening bersama sistem dan pasti cair ke saldo Anda.",
        tips: "Jangan pernah menyetujui transaksi di luar platform untuk menghindari penipuan."
      },
      {
        title: "2. Periode Proteksi & Pelepasan Saldo",
        description: "Setelah produk digital terkirim, pembeli memiliki batas waktu proteksi hingga 48 jam untuk mencoba aktivasi. Begitu pembeli menekan 'Selesaikan Pesanan' atau setelah batas waktu proteksi habis tanpa sanggahan, saldo hasil penjualan langsung masuk secara otomatis ke 'Dompet Toko' Anda.",
        tips: "Jika pembeli mengajukan komplain, sistem mediasi MarketPoint akan memeriksa bukti serial key / file yang dikirimkan."
      },
      {
        title: "3. Mengatur Rekening Bank dan E-Wallet Penarikan",
        description: "Buka menu 'Pengaturan Rekening Penarikan' di dashboard merchant. Anda dapat mendaftarkan rekening bank nasional (BCA, Mandiri, BRI, BNI, BSI, Permata, CIMB, SeaBank) atau nomor e-wallet (GoPay, OVO, Dana). Pastikan nama pemilik rekening sesuai dengan data identitas Anda.",
        tips: "Simpan satu rekening utama sebagai rekening default penarikan agar proses payout lebih cepat."
      },
      {
        title: "4. Mengajukan Penarikan Dana (Payout Request)",
        description: "Pilih menu 'Tarik Saldo', masukkan nominal pencairan (minimal Rp 20.000). Sistem pencairan MarketPoint memproses penarikan saldo dalam hitungan menit hingga maksimal 1x24 jam kerja langsung ke rekening tujuan Anda.",
        tips: "Periksa riwayat mutasi dompet secara berkala untuk memantau rekapitulasi pembukuan toko Anda."
      }
    ],
    keyTakeaways: [
      "Escrow mengunci pembayaran di muka sehingga penjual terbebas dari risiko pembeli curang.",
      "Saldo otomatis berpindah ke dompet toko setelah masa proteksi selesai.",
      "Mendukung pencairan saldo ke semua bank nasional dan dompet digital terkemuka.",
      "Proses payout transparan dengan notifikasi mutasi yang tercatat rapi."
    ],
    faqs: [
      {
        q: "Berapa batas minimal penarikan saldo toko?",
        a: "Batas penarikan saldo minimum adalah Rp 20.000, sehingga sangat ramah untuk penjual pemula."
      },
      {
        q: "Apakah ada potongan biaya saat melakukan pencairan dana?",
        a: "Biaya transfer antarbank mengikuti tarif standar jaringan perbankan (Rp 2.500 - Rp 4.500 per penarikan) tanpa biaya tersembunyi lainnya."
      }
    ],
    ctaText: "Lihat Saldo Toko",
    ctaLink: "/my-shop/wallet"
  },
  {
    slug: "etika-seller-reputasi-bintang-5",
    level: "Mahir",
    levelBadgeColor: "bg-purple-50 text-purple-600 border-purple-200",
    title: "Etika Penjual, Larangan Produk Bajakan & Meraih Bintang 5",
    readTime: "6 min baca",
    summary: "Standar mutu mutlak ekosistem MarketPoint: larangan barang crack/nulled, etika komunikasi chat, dan cara mempertahankan rating ulasan sempurna.",
    updatedAt: "05 Oktober 2026",
    author: "StarVale Technology Solution / MarketPoint Seller Academy",
    chapters: [
      {
        title: "1. Kebijakan Mutlak: Larangan Produk Bajakan & Nulled",
        description: "MarketPoint dibangun atas dasar integritas karya teknologi. Penjualan script hasil decompile ilegal, lisensi hasil carding, file nulled bervirus, atau software bajakan dilarang keras. Akun yang terbukti melanggar akan langsung diblokir permanen dan sisa saldo ditahan untuk ganti rugi pembeli.",
        tips: "Hanya jual produk yang merupakan kreasi mandiri Anda atau produk yang Anda miliki lisensi distribusi resminya."
      },
      {
        title: "2. Menangani Pertanyaan & Komplain Secara Elegan",
        description: "Terkadang pembeli awam mengalami kesulitan saat instalasi software atau setup database. Tanggapi mereka dengan ramah, berikan petunjuk langkah demi langkah, atau kirimkan screenshot panduan. Respon yang solutif sering kali mengubah komplain menjadi ulasan bintang 5 yang sangat puas.",
        tips: "Balas chat dengan kalimat profesional dan hindari perdebatan emosional di forum ulasan."
      },
      {
        title: "3. Membangun Reputasi Toko 'Fast Response'",
        description: "Sistem MarketPoint menghitung rata-rata kecepatan respon chat toko Anda. Toko yang merespons dalam waktu kurang dari 15 menit mendapatkan penanda khusus yang memikat pembeli untuk langsung bertransaksi tanpa ragu.",
        tips: "Aktifkan notifikasi browser atau pantau dashboard pesan secara rutin setiap hari."
      },
      {
        title: "4. Meminta Ulasan Positif Pasca-Transaksi",
        description: "Setelah pesanan diselesaikan dengan sukses, kirimkan pesan penutup yang ramah dan mintalah pembeli meluangkan beberapa detik untuk memberikan rating ulasan bintang 5 dan ulasan ulasan positif.",
        tips: "Kumpulan ulasan positif adalah magnet utama yang mendatangkan pembeli berulang tanpa perlu biaya iklan."
      }
    ],
    keyTakeaways: [
      "Keaslian produk adalah nyawa dari toko digital yang berkelanjutan.",
      "Sikap ramah saat mengatasi kendala instalasi pembeli menciptakan loyalitas.",
      "Kecepatan balas chat berpengaruh langsung terhadap keputusan belanja pelanggan.",
      "Ulasan bintang 5 meningkatkan peringkat produk Anda di hasil pencarian."
    ],
    faqs: [
      {
        q: "Bagaimana jika pembeli memberikan rating buruk tanpa alasan jelas?",
        a: "Anda dapat membalas ulasan tersebut secara publik dengan sopan untuk memberikan klarifikasi, atau mengajukan peninjauan ke tim MarketPoint Care jika terbukti ada pelanggaran etika."
      },
      {
        q: "Apakah penjual wajib memberikan remote support (AnyDesk/TeamViewer)?",
        a: "Tidak wajib, kecuali jika Anda menjanjikannya di deskripsi produk. Bantuan via chat teks dan panduan tertulis adalah standar minimum yang wajib diberikan."
      }
    ],
    ctaText: "Kelola Ulasan Toko",
    ctaLink: "/my-shop/reviews"
  },
  {
    slug: "menentukan-harga-value-pricing",
    level: "Mahir",
    levelBadgeColor: "bg-purple-50 text-purple-600 border-purple-200",
    title: "Strategi Menentukan Harga Produk Digital (Value-Based Pricing)",
    readTime: "5 min baca",
    summary: "Hindari perang harga murah yang merusak reputasi. Pelajari cara menghitung nilai penghematan waktu pelanggan dan monetisasi lisensi berjenjang.",
    updatedAt: "05 Oktober 2026",
    author: "StarVale Technology Solution / MarketPoint Seller Academy",
    chapters: [
      {
        title: "1. Mengapa Perang Harga Murah Merugikan Penjual",
        description: "Menjual script seharga Rp 10.000 hanya untuk mengejar kuantitas sering kali menimbulkan persepsi negatif: calon pembeli menganggap produk tersebut berkualitas buruk, usang, atau hasil curian. Selain itu, Anda akan kewalahan melayani support pembeli dengan margin yang hampir nol.",
        tips: "Produk dengan harga yang wajar dan proporsional menarik pembeli berkualitas yang menghargai karya software Anda."
      },
      {
        title: "2. Menghitung Nilai Berdasarkan Efisiensi Waktu Pembeli",
        description: "Gunakan pendekatan Value-Based Pricing. Tanyakan: 'Berapa hari kerja yang dihemat pembeli jika mereka memakai source code ini dibanding membuat dari nol?' Jika menghemat 2 minggu kerja seorang programmer profesional (setara jutaan rupiah), maka harga Rp 250.000 - Rp 450.000 adalah harga yang sangat murah dan masuk akal bagi mereka.",
        tips: "Jelaskan penghematan waktu ini secara eksplisit pada deskripsi produk Anda."
      },
      {
        title: "3. Menerapkan Skema Lisensi Berjenjang (Tiered Pricing)",
        description: "Sediakan beberapa varian produk: 1) Personal License (untuk 1 domain / proyek pribadi dengan harga standar), 2) Developer License (untuk hingga 5 proyek klien), dan 3) Extended/Commercial License (hak modifikasi dan distribusi komersial tanpa batas dengan harga 3x - 5x lipat).",
        tips: "Varian lisensi berjenjang memungkinkan Anda melayani mahasiswa sekaligus agensi software house."
      },
      {
        title: "4. Meningkatkan Nilai Tambah dengan Pembaruan Berkala",
        description: "Produk yang terus diperbarui (misal pembaruan kompatibilitas framework terbaru atau perbaikan bug) memiliki nilai jual yang terus meningkat. Pembeli bersedia membayar lebih mahal jika mereka tahu script tersebut tidak akan ditinggalkan begitu saja oleh pengembangnya.",
        tips: "Tuliskan riwayat pembaruan (Changelog) pada deskripsi produk agar pembeli melihat komitmen pemeliharaan Anda."
      }
    ],
    keyTakeaways: [
      "Harga murah tidak selalu menjamin penjualan tinggi, bahkan bisa merusak persepsi mutu.",
      "Hitung nilai ekonomi nyata yang didapatkan pembeli dari produk Anda.",
      "Tawarkan tier lisensi berbeda untuk menangkap segmen pasar yang lebih luas.",
      "Pembaruan berkala membenarkan harga jual yang lebih tinggi dan premium."
    ],
    faqs: [
      {
        q: "Bolehkah saya menaikkan harga produk setelah memiliki banyak ulasan?",
        a: "Sangat boleh! Seiring bertambahnya ulasan positif dan pembaruan fitur, Anda berhak menaikkan harga produk untuk mencerminkan nilai dan reputasi yang semakin matang."
      },
      {
        q: "Bagaimana cara menentukan harga awal untuk produk baru?",
        a: "Riset produk sejenis di kategori yang sama, lalu posisikan harga produk Anda sedikit di atas rata-rata dengan menonjolkan fitur unggulan yang tidak dimiliki kompetitor."
      }
    ],
    ctaText: "Atur Harga Produk Toko",
    ctaLink: "/my-shop"
  }
];
