<script setup>
import { User, Globe, Github, Twitter, UploadCloud, Check, Settings as SettingsIcon, Camera } from 'lucide-vue-next';
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import { CDN_URL } from '@/services/api/useFetchProjectById.js';

// Import logic dan modal dari folder profile yang sama
import ProfileCropperModal from '@modules/profile/components/ProfileCropperModal.vue'; 
import { useUpdateProfileLogic } from '@modules/profile/composables/useUpdateProfileLogic.js'; 
import { useAvatarUrl } from '@/composables/useAvatarUrl.js';

const {
  isLoading, isSaving, profileData, 
  isCropperOpen, selectedImageFile, isUploadingAvatar,
  handleFileSelect, handleCropAndUpload, handleSaveProfile
} = useUpdateProfileLogic();

const { getAvatarUrl } = useAvatarUrl();

</script>

<template>
  <div class="animate-in fade-in slide-in-from-bottom-2 duration-300">
    <ProfileCropperModal 
      :is-open="isCropperOpen" 
      :image-file="selectedImageFile"
      :is-uploading="isUploadingAvatar"
      @close="isCropperOpen = false"
      @crop="handleCropAndUpload"
    />

    <div v-if="isLoading" class="flex justify-center p-20">
      <div class="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>

    <form v-else @submit.prevent="handleSaveProfile" class="space-y-6">
      <div class="bg-card p-6 rounded-2xl border border-border flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div class="relative group shrink-0">
          <img 
            v-if="profileData.avatar_url" 
            :src="getAvatarUrl(profileData.avatar_url)"  class="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-background shadow-md bg-muted"
            />
          <div v-else class="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background shadow-md bg-muted flex items-center justify-center">
             <User class="w-10 h-10 text-muted-foreground" />
          </div>
          
          <label class="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
            <Camera class="w-8 h-8 text-foreground" />
            <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" class="hidden" @change="handleFileSelect" />
          </label>
        </div>
        
        <div class="text-center sm:text-left flex-1 mt-2 sm:mt-0">
          <h3 class="font-bold text-lg mb-1">Foto Profil</h3>
          <p class="text-sm text-muted-foreground mb-4">Rekomendasi rasio 1:1, maksimal 5MB. Format JPG, PNG, WEBP.</p>
          <label class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-sm font-medium transition-colors cursor-pointer w-full sm:w-auto">
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

      <div class="flex justify-end pt-2">
        <button 
          type="submit" 
          :disabled="isSaving"
          class="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 w-full sm:w-auto justify-center"
        >
          <SettingsIcon v-if="isSaving" class="w-4 h-4 animate-spin" /> 
          <Check v-else class="w-4 h-4" stroke-width="3" /> 
          {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
        </button>
      </div>
    </form>
  </div>
</template>