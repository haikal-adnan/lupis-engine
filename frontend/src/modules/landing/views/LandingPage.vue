<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from "@commons/composables/useTheme.js";
import { useAuthStore } from '@/stores/useAuthStore.js'; 

import { 
  ArrowRight, Sparkles, LayoutGrid, Paintbrush, Layers, Globe, Grid3X3, Zap,
  FolderPlus, Puzzle, GitBranch, Mic, Share2
} from 'lucide-vue-next';

const router = useRouter();
const { initTheme } = useTheme();
const authStore = useAuthStore();

onMounted(() => {
  initTheme();
});

const handleTryInBrowser = () => {
  if (authStore.isLoggedIn) {
    router.push('/dashboard');
  } else {
    authStore.openAuthModal('login');
  }
};

const handleExploreGames = () => {
  router.push('/explore');
};
</script>

<template>
  <section class="relative w-full min-h-[100dvh] overflow-hidden flex flex-col text-center px-6 py-16">
    <video autoplay loop muted playsinline class="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none">
      <source src="/lupis_engine_showcase.mp4" type="video/mp4">
    </video>
    <div class="absolute inset-0 bg-black/60 z-0"></div>
    <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent z-0"></div>
    
    <div class="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center drop-shadow-lg my-auto">
      
      <div class="flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md rounded-full px-3 py-1 mb-6">
        <Sparkles class="w-3.5 h-3.5 text-cyan-400" />
        <span class="text-xs font-medium text-white/90">Lupis Engine<span class="bg-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded ml-1">v1.0</span></span>
      </div>
      
      <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight mb-5 leading-tight text-white">
        Kreasikan Game<br />
        <span class="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Tanpa Batas
        </span>
      </h1>
      
      <p class="text-base md:text-lg text-white/80 max-w-2xl mb-8 leading-relaxed">
        Engine Game 2D Gratis & Open-Source dengan Editor Visual, Logika Berbasis Node dan Publikasi Instan ke Web.
      </p>
      
      <div class="flex flex-col sm:flex-row items-center gap-4">
        <button @click="handleTryInBrowser" class="w-full sm:w-auto flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-7 py-3 rounded-xl text-base font-bold transition-all shadow-lg shadow-cyan-500/20 backdrop-blur-sm">
          Coba di Browser <ArrowRight class="w-4 h-4" />
        </button>
        <button @click="handleExploreGames" class="w-full sm:w-auto flex items-center justify-center gap-2 bg-black/40 hover:bg-black/60 border border-white/20 text-white px-7 py-3 rounded-xl text-base font-semibold transition-all backdrop-blur-md">
          Jelajahi Game
        </button>
      </div>
      
    </div>
  </section>
  <section class="w-full max-w-6xl mx-auto px-6 py-24 border-t border-border">
    <div class="text-center mb-12">
      <p class="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">Fitur Utama</p>
      <h2 class="text-3xl md:text-4xl font-bold mb-4">Solusi Lengkap Pengembangan Game</h2>
      <p class="text-muted-foreground">Alur kerja terintegrasi dari tahap desain hingga publikasi dalam satu ekosistem.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-card border border-border rounded-xl p-6 hover:border-cyan-500/30 transition-colors group">
        <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-5 group-hover:bg-cyan-500/20 transition-colors"><Layers class="w-5 h-5 text-cyan-400" /></div>
        <h3 class="text-xl font-bold mb-3 mt-4">Komponen Modular</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Sistem modular yang mendukung komponen utama seperti Tilemap dan Physics, serta berbagai modul pendukung lainnya.</p>
      </div>
      <div class="bg-card border border-border rounded-xl p-6 hover:border-cyan-500/30 transition-colors group">
        <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-5 group-hover:bg-cyan-500/20 transition-colors"><LayoutGrid class="w-5 h-5 text-cyan-400" /></div>
        <h3 class="text-xl font-bold mb-3 mt-4">Visual Event System</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Sistem logika node drag-and-drop tanpa coding. Pengaturan movement, collision, dan AI secara visual.</p>
      </div>
      <div class="bg-card border border-border rounded-xl p-6 hover:border-cyan-500/30 transition-colors group">
        <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-5 group-hover:bg-cyan-500/20 transition-colors"><Zap class="w-5 h-5 text-cyan-400" /></div>
        <h3 class="text-xl font-bold mb-3 mt-4">Sistem Variabel</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Manajemen variabel Global dan Lokal dengan dukungan tipe data kompleks seperti List dan Map.</p>
      </div>
      <div class="bg-card border border-border rounded-xl p-6 hover:border-cyan-500/30 transition-colors group">
        <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-5 group-hover:bg-cyan-500/20 transition-colors"><Grid3X3 class="w-5 h-5 text-cyan-400" /></div>
        <h3 class="text-xl font-bold mb-3 mt-4">Tilemap Editor</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Editor desain level berbasis grid dengan Tile Palette yang intuitif. Kustomisasi ukuran tile dan map secara presisi.</p>
      </div>
      <div class="bg-card border border-border rounded-xl p-6 hover:border-cyan-500/30 transition-colors group">
        <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-5 group-hover:bg-cyan-500/20 transition-colors"><Paintbrush class="w-5 h-5 text-cyan-400" /></div>
        <h3 class="text-xl font-bold mb-3 mt-4">Animasi Fleksibel</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Timeline editor dengan dukungan keyframe dan clip untuk pergerakan karakter yang dinamis.</p>
      </div>
      <div class="bg-card border border-border rounded-xl p-6 hover:border-cyan-500/30 transition-colors group">
        <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-5 group-hover:bg-cyan-500/20 transition-colors"><Globe class="w-5 h-5 text-cyan-400" /></div>
        <h3 class="text-xl font-bold mb-3 mt-4">Easy Export</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Publikasi instan ke platform web. Proyek dapat diakses langsung melalui browser tanpa konfigurasi tambahan.</p>
      </div>
    </div>
  </section>
  <section class="w-full bg-secondary/10 px-6 py-24 border-t border-border overflow-hidden">
    <div class="max-w-5xl mx-auto relative">
      <div class="text-center mb-16">
        <p class="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">Workflow</p>
        <h2 class="text-3xl md:text-4xl font-bold mb-4">Cara Kerja Lupis Engine</h2>
        <p class="text-muted-foreground max-w-2xl mx-auto">Alur kerja sistematis untuk mewujudkan ide game dari konsep hingga rilis.</p>
      </div>

      <div class="relative grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-x-12 z-10 pb-12 md:pb-16">
        
        <div class="hidden md:block absolute left-1/2 top-4 bottom-4 w-px border-l-2 border-dashed border-cyan-500/20 -translate-x-1/2 z-0"></div>

        <div class="flex flex-col gap-8 md:gap-10 relative z-10">
          
          <div class="w-full bg-card border border-border rounded-2xl p-7 hover:border-cyan-500/50 transition-all shadow-sm flex flex-col group">
            <div class="flex items-center gap-4 mb-4 pb-4 border-b border-border">
              <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl font-black text-cyan-400 shadow-inner shrink-0">1</div>
              <FolderPlus class="w-6 h-6 text-muted-foreground group-hover:text-cyan-400 transition-colors shrink-0" />
              <h3 class="text-xl font-bold text-foreground transition-colors">Inisialisasi Proyek</h3>
            </div>
            <p class="text-muted-foreground text-sm leading-relaxed">Mulai proyek baru langsung di browser. Tentukan konfigurasi dasar dan siapkan kanvas untuk mulai membangun duniamu.</p>
          </div>

          <div class="w-full bg-card border border-border rounded-2xl p-7 hover:border-cyan-500/50 transition-all shadow-sm flex flex-col group">
            <div class="flex items-center gap-4 mb-4 pb-4 border-b border-border">
              <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl font-black text-cyan-400 shadow-inner shrink-0">2</div>
              <Puzzle class="w-6 h-6 text-muted-foreground group-hover:text-cyan-400 transition-colors shrink-0" />
              <h3 class="text-xl font-bold text-foreground transition-colors">Konstruksi Entity</h3>
            </div>
            <p class="text-muted-foreground text-sm leading-relaxed">Buat entity baru dan pasang komponen modular seperti Physics atau Tilemap sesuai fungsi objek yang diinginkan.</p>
          </div>

          <div class="w-full bg-card border border-border rounded-2xl p-7 hover:border-cyan-500/50 transition-all shadow-sm flex flex-col group">
            <div class="flex items-center gap-4 mb-4 pb-4 border-b border-border">
              <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl font-black text-cyan-400 shadow-inner shrink-0">3</div>
              <GitBranch class="w-6 h-6 text-muted-foreground group-hover:text-cyan-400 transition-colors shrink-0" />
              <h3 class="text-xl font-bold text-foreground transition-colors">Logika Node Scripting</h3>
            </div>
            <p class="text-muted-foreground text-sm leading-relaxed">Modifikasi perilaku menggunakan Visual Event System. Hubungkan node untuk mengatur pergerakan hingga sistem AI.</p>
          </div>

        </div>

        <div class="flex flex-col gap-8 md:gap-10 md:translate-y-12 relative z-10">
          
          <div class="w-full bg-card border border-border rounded-2xl p-7 hover:border-cyan-500/50 transition-all shadow-sm flex flex-col group">
            <div class="flex items-center gap-4 mb-4 pb-4 border-b border-border">
              <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl font-black text-cyan-400 shadow-inner shrink-0">4</div>
              <Grid3X3 class="w-6 h-6 text-muted-foreground group-hover:text-cyan-400 transition-colors shrink-0" />
              <h3 class="text-xl font-bold text-foreground transition-colors">Desain Level Visual</h3>
            </div>
            <p class="text-muted-foreground text-sm leading-relaxed">Susun dunia game menggunakan Tilemap Editor. Gunakan tile palette untuk menggambar lingkungan secara presisi di atas grid.</p>
          </div>

          <div class="w-full bg-card border border-border rounded-2xl p-7 hover:border-cyan-500/50 transition-all shadow-sm flex flex-col group">
            <div class="flex items-center gap-4 mb-4 pb-4 border-b border-border">
              <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl font-black text-cyan-400 shadow-inner shrink-0">5</div>
              <Mic class="w-6 h-6 text-muted-foreground group-hover:text-cyan-400 transition-colors shrink-0" />
              <h3 class="text-xl font-bold text-foreground transition-colors">Eksperimen Estetika</h3>
            </div>
            <p class="text-muted-foreground text-sm leading-relaxed">Hidupkan suasana game dengan menambahkan sistem animasi dan efek suara untuk pengalaman bermain yang imersif.</p>
          </div>

          <div class="w-full bg-card border border-border rounded-2xl p-7 hover:border-cyan-500/50 transition-all shadow-sm flex flex-col group">
            <div class="flex items-center gap-4 mb-4 pb-4 border-b border-border">
              <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl font-black text-cyan-400 shadow-inner shrink-0">6</div>
              <Share2 class="w-6 h-6 text-muted-foreground group-hover:text-cyan-400 transition-colors shrink-0" />
              <h3 class="text-xl font-bold text-foreground transition-colors">Export & Share</h3>
            </div>
            <p class="text-muted-foreground text-sm leading-relaxed">Lakukan Export untuk membagikan proyek. Game siap dimainkan langsung di browser tanpa konfigurasi tambahan.</p>
          </div>

        </div>
      </div>
    </div>
  </section>
  <section class="w-full relative px-6 py-24 md:py-32 overflow-hidden flex flex-col items-center justify-center text-center border-t border-border">
    <div class="absolute inset-0 bg-cyan-500/5 z-0"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-1/2 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none z-0"></div>

    <div class="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
      <div class="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 shadow-inner">
        <Sparkles class="w-8 h-8 text-cyan-400" />
      </div>
      
      <h2 class="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-foreground">
        Siap Membangun Game <br class="md:hidden" />
        <span class="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Pertamamu?</span>
      </h2>
      
      <p class="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl">
        Tidak perlu instalasi, tidak perlu pusing konfigurasi. Mulai wujudkan ide game 2D kamu dengan arsitektur modular langsung dari dalam browser sekarang juga.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button 
          @click="handleTryInBrowser"
          class="w-full sm:w-auto flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-1"
        >
          Coba Lupis Engine <ArrowRight class="w-5 h-5" />
        </button>
      </div>
    </div>
  </section>
</template>