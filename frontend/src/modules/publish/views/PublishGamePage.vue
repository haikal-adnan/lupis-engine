<script setup>
import { usePublishLogic } from '@modules/publish/composables/usePublishLogic.js';

// Import Quill Editor
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

// Import Icons
import { UploadCloud, FileType2, MonitorPlay, Check, X, Search, Loader2 } from 'lucide-vue-next';

// Import Base Components
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import ThumbnailCropperModal from '@modules/publish/components/ThumbnailCropperModal.vue'; 

// Ekstrak state dan method dari composable
const {
  isLoading,
  isUpdating,
  publishData,
  thumbnailPreview,
  triggerUpload,
  handleSave,
  router,
  slugStatus,
  checkSlug,
  isCropperOpen, 
  selectedImageFile, 
  isUploadingThumbnail, 
  handleCropAndUploadThumbnail
} = usePublishLogic();
</script>

<template>
  <div class="max-w-4xl w-full mx-auto p-6 md:p-10 pb-24">
    
    <ThumbnailCropperModal 
      :is-open="isCropperOpen" 
      :image-file="selectedImageFile"
      :is-uploading="isUploadingThumbnail"
      @close="isCropperOpen = false"
      @crop="handleCropAndUploadThumbnail"
    />

    <div class="mb-8 flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight text-foreground">
          {{ isUpdating ? 'Edit Published Game' : 'Publish New Game' }}
        </h2>
        <p class="text-muted-foreground text-sm mt-1">
          Lengkapi detail dan rancang halaman game Anda.
        </p>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center p-10">
      <div class="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>

    <form v-else @submit.prevent="handleSave" class="space-y-6">
      
      <div class="bg-card p-6 rounded-2xl border border-border">
        <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
          <FileType2 class="w-5 h-5 text-cyan-500" /> Informasi Utama
        </h3>
        
        <div class="space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Judul Game</label>
              <BaseInput v-model="publishData.title" placeholder="Nama game Anda..." />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">Slug (URL)</label>
              <div class="flex gap-2 items-center">
                <BaseInput 
                  v-model="publishData.slug" 
                  placeholder="my-awesome-game" 
                  @input="slugStatus = 'idle'"
                  :class="{
                    '!border-cyan-500 focus:!ring-cyan-500 bg-cyan-500/5': slugStatus === 'available',
                    '!border-destructive focus:!ring-destructive bg-destructive/5': slugStatus === 'taken'
                  }"
                  class="flex-1 transition-colors"
                />
                
                <button 
                  type="button" 
                  @click="checkSlug"
                  :disabled="slugStatus === 'checking' || !publishData.slug"
                  class="flex items-center justify-center w-10 h-10 shrink-0 bg-secondary hover:bg-secondary/80 border border-border rounded-lg transition-colors disabled:opacity-50"
                  title="Cek ketersediaan Slug"
                >
                  <Loader2 v-if="slugStatus === 'checking'" class="w-4 h-4 animate-spin text-muted-foreground" />
                  <Search v-else-if="slugStatus === 'idle'" class="w-4 h-4 text-muted-foreground" />
                  <Check v-else-if="slugStatus === 'available'" class="w-4 h-4 text-cyan-500" />
                  <X v-else-if="slugStatus === 'taken'" class="w-4 h-4 text-destructive" />
                </button>
              </div>
              
              <p v-if="slugStatus === 'available'" class="text-[11px] text-cyan-500 mt-1.5 font-medium flex items-center gap-1">
                <Check class="w-3 h-3"/> Slug tersedia.
              </p>
              <p v-if="slugStatus === 'taken'" class="text-[11px] text-destructive mt-1.5 font-medium flex items-center gap-1">
                <X class="w-3 h-3"/> Slug sudah dipakai. Silakan cari yang lain.
              </p>
            </div>
          </div>

          <div class="pt-2 border-t border-border mt-4">
            <label class="block text-sm font-medium mb-3">Thumbnail Game</label>
            <div class="flex flex-col sm:flex-row gap-6 items-start">
              
              <div 
                class="w-full sm:w-64 aspect-video rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0 group relative bg-muted/30 transition-colors"
                :class="thumbnailPreview ? 'border-cyan-500/50' : 'border-border hover:border-cyan-500/30'"
              >
                <img 
                  v-if="thumbnailPreview" 
                  :src="thumbnailPreview" 
                  class="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  alt="Thumbnail Preview"
                />
                <div v-else class="text-center text-muted-foreground/60 flex flex-col items-center">
                  <UploadCloud class="w-8 h-8 mb-2 opacity-50" />
                  <span class="text-xs font-semibold uppercase tracking-wider">16:9 Ratio</span>
                </div>
              </div>

              <div class="flex-1 w-full space-y-3">
                <p class="text-sm text-muted-foreground leading-relaxed">
                  Unggah gambar yang merepresentasikan game Anda dengan baik. Gambar akan otomatis di-crop menjadi rasio <strong class="text-foreground">16:9</strong>. (Rekomendasi output: 1280x720px, max 5MB).
                </p>
                <button 
                  type="button" 
                  @click="triggerUpload('thumbnail')"
                  class="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded-lg text-sm font-bold transition-all flex items-center justify-center sm:justify-start gap-2 shadow-sm active:scale-95 w-full sm:w-auto"
                >
                  <UploadCloud class="w-4 h-4" /> Pilih & Potong Gambar
                </button>
              </div>

            </div>
          </div>

          <div class="pt-4">
            <label class="block text-sm font-medium mb-1">Deskripsi Game</label>
            <p class="text-xs text-muted-foreground mb-3">Gunakan format di bawah untuk membuat halaman deskripsi Anda menarik layaknya itch.io.</p>
            <div class="border border-border rounded-lg bg-background overflow-hidden">
              <QuillEditor 
                v-model:content="publishData.description" 
                contentType="html" 
                toolbar="full" 
                theme="snow"
                class="min-h-[250px]"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="bg-card p-6 rounded-2xl border border-border">
        <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
          <MonitorPlay class="w-5 h-5 text-cyan-500" /> Akses & Unduhan
        </h3>
        
        <div class="space-y-6">
          <div class="p-4 border border-cyan-500/20 bg-cyan-500/5 rounded-xl transition-colors hover:border-cyan-500/40">
            <label class="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                v-model="publishData.playOnBrowser" 
                class="mt-1 w-5 h-5 text-cyan-500 rounded border-border focus:ring-cyan-500 cursor-pointer" 
              />
              <div>
                <span class="block text-sm font-bold text-foreground">Play on Browser (HTML5)</span>
                <span class="block text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Centang opsi ini jika game Anda berbasis WebGL/HTML5 dan bisa langsung dimainkan di browser pengguna tanpa perlu mengunduh.
                </span>
              </div>
            </label>
          </div>

          <div class="space-y-4 pt-2">
            <div class="flex items-center justify-between border-b border-border pb-2">
              <p class="text-sm font-medium">File Unduhan Eksklusif</p>
              <span class="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-medium">Opsional</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
              <div class="sm:col-span-3">
                <label class="block text-xs font-medium mb-1">Windows (.exe / .zip)</label>
                <BaseInput v-model="publishData.downloads.exe" placeholder="URL otomatis terisi..." readonly class="bg-muted/30 opacity-70 cursor-not-allowed" />
              </div>
              <button type="button" @click="triggerUpload('exe')" class="h-9 w-full bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                <UploadCloud class="w-3.5 h-3.5" /> Upload
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
              <div class="sm:col-span-3">
                <label class="block text-xs font-medium mb-1">Android (.apk)</label>
                <BaseInput v-model="publishData.downloads.apk" placeholder="URL otomatis terisi..." readonly class="bg-muted/30 opacity-70 cursor-not-allowed" />
              </div>
              <button type="button" @click="triggerUpload('apk')" class="h-9 w-full bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                <UploadCloud class="w-3.5 h-3.5" /> Upload
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
              <div class="sm:col-span-3">
                <label class="block text-xs font-medium mb-1">Linux/Mac (.bin / .zip)</label>
                <BaseInput v-model="publishData.downloads.bin" placeholder="URL otomatis terisi..." readonly class="bg-muted/30 opacity-70 cursor-not-allowed" />
              </div>
              <button type="button" @click="triggerUpload('bin')" class="h-9 w-full bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                <UploadCloud class="w-3.5 h-3.5" /> Upload
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end items-center gap-3 pt-6 mt-6 border-t border-border">
        <button 
          type="button" 
          @click="router.back()" 
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-transparent hover:border-destructive/20 transition-all"
        >
          <X class="w-4 h-4" /> Batal
        </button>
        
        <button 
          type="submit" 
          class="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-95"
        >
          <Check class="w-4 h-4" :stroke-width="3" /> 
          {{ isUpdating ? 'Simpan Perubahan' : 'Publish Game Sekarang' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style>
.ql-toolbar.ql-snow {
  border: none !important;
  border-bottom: 1px solid var(--border) !important;
  background-color: var(--muted);
  font-family: inherit;
  border-radius: 0.5rem 0.5rem 0 0;
}
.ql-container.ql-snow {
  border: none !important;
  font-family: inherit;
  font-size: 0.875rem; /* text-sm */
  border-radius: 0 0 0.5rem 0.5rem;
}
.ql-editor {
  min-height: 250px;
}
</style>