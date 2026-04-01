<script setup>
import { useRouter } from 'vue-router';
import { User, Settings, Globe, Github, Twitter, UploadCloud, Check, X, Camera } from 'lucide-vue-next';
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import ProfileCropperModal from '@modules/profile/components/ProfileCropperModal.vue'; 
import { useUpdateProfileLogic } from '@modules/profile/composables/useUpdateProfileLogic.js'; 

const router = useRouter();
const {
  isLoading, isSaving, profileData, 
  isCropperOpen, selectedImageFile, isUploadingAvatar,
  handleFileSelect, handleCropAndUpload, handleSaveProfile
} = useUpdateProfileLogic();
</script>

<template>
  <div class="max-w-4xl w-full mx-auto p-6 md:p-10 pb-24">
    
    <ProfileCropperModal 
      :is-open="isCropperOpen" 
      :image-file="selectedImageFile"
      :is-uploading="isUploadingAvatar"
      @close="isCropperOpen = false"
      @crop="handleCropAndUpload"
    />

    <div class="mb-8 flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight text-foreground">Pengaturan Profil</h2>
        <p class="text-muted-foreground text-sm mt-1">Kelola informasi publik dan tautan sosial Anda.</p>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center p-10">
      <div class="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>

    <form v-else @submit.prevent="handleSaveProfile" class="space-y-6">
      
      <div class="bg-card p-6 rounded-2xl border border-border flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div class="relative group shrink-0">
          <img 
            v-if="profileData.avatar_url" 
            :src="profileData.avatar_url" 
            class="w-32 h-32 rounded-full object-cover border-4 border-background shadow-md bg-muted"
          />
          <div v-else class="w-32 h-32 rounded-full border-4 border-background shadow-md bg-muted flex items-center justify-center">
             <User class="w-12 h-12 text-muted-foreground" />
          </div>
          
          <label class="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
            <Camera class="w-8 h-8 text-foreground" />
            <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" class="hidden" @change="handleFileSelect" />
          </label>
        </div>
        
        <div class="text-center sm:text-left flex-1">
          <h3 class="font-bold text-lg mb-1">Foto Profil</h3>
          <p class="text-sm text-muted-foreground mb-4">Rekomendasi rasio 1:1, maksimal 5MB. Format JPG, PNG.</p>
          <label class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-sm font-medium transition-colors cursor-pointer">
            <UploadCloud class="w-4 h-4" /> Unggah Foto Baru
            <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" class="hidden" @change="handleFileSelect" />
          </label>
        </div>
      </div>

      <div class="bg-card p-6 rounded-2xl border border-border">
        <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
          <User class="w-5 h-5 text-cyan-500" /> Informasi Dasar
        </h3>
        
        <div class="space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nama Tampilan</label>
              <BaseInput v-model="profileData.display_name" placeholder="Nama Anda..." required />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Username</label>
              <BaseInput v-model="profileData.username" placeholder="username" required />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Bio / Deskripsi Singkat</label>
            <textarea 
              v-model="profileData.bio" 
              rows="3" 
              placeholder="Ceritakan sedikit tentang Anda..."
              class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
            ></textarea>
          </div>
        </div>
      </div>

      <div class="bg-card p-6 rounded-2xl border border-border">
        <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
          <Globe class="w-5 h-5 text-cyan-500" /> Tautan Sosial
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="flex items-center gap-2 text-sm font-medium mb-1"><Globe class="w-4 h-4 text-muted-foreground"/> Website Pribadi</label>
            <BaseInput v-model="profileData.website_url" placeholder="https://..." />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="flex items-center gap-2 text-sm font-medium mb-1"><Github class="w-4 h-4 text-muted-foreground"/> GitHub URL</label>
              <BaseInput v-model="profileData.github_url" placeholder="https://github.com/..." />
            </div>
            <div>
              <label class="flex items-center gap-2 text-sm font-medium mb-1"><Twitter class="w-4 h-4 text-cyan-400"/> Twitter / X URL</label>
              <BaseInput v-model="profileData.twitter_url" placeholder="https://twitter.com/..." />
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end items-center gap-3 pt-6 mt-6 border-t border-border">
        <button 
          type="button" 
          @click="router.back()" 
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
        >
          <X class="w-4 h-4" /> Batal
        </button>
        
        <button 
          type="submit" 
          :disabled="isSaving"
          class="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
        >
          <Settings v-if="isSaving" class="w-4 h-4 animate-spin" /> 
          <Check v-else class="w-4 h-4" stroke-width="3" /> 
          {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
        </button>
      </div>
    </form>
  </div>
</template>