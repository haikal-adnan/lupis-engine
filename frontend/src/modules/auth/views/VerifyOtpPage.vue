<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-8">
      
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-foreground mb-2">Aktivasi Email</h2>
        <p class="text-sm text-muted-foreground">
          Masukkan 6-digit kode OTP yang kami kirimkan ke <br>
          <span class="text-cyan-400 font-medium">{{ userEmail || '...' }}</span>
        </p>
      </div>

      <form @submit.prevent="handleActivation" class="flex flex-col gap-5">
        <div>
          <input 
            v-model="otpCode" 
            type="text" 
            maxlength="6"
            placeholder="123456"
            class="w-full text-center text-2xl tracking-[0.5em] bg-background text-foreground border border-border rounded-lg px-3 py-4 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
          />
          <span v-if="errorMessage" class="text-xs text-destructive mt-2 block text-center">
            {{ errorMessage }}
          </span>
        </div>

        <button 
          type="submit"
          :disabled="isLoading || otpCode.length !== 6"
          class="w-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-3 rounded-lg text-sm transition-colors shadow-lg shadow-cyan-400/20"
        >
          {{ isLoading ? 'Mengaktifkan...' : 'Aktifkan Akun' }}
        </button>
      </form>

      <div class="mt-6 flex flex-col items-center">
        <button 
          @click="handleResendOtp"
          :disabled="isLoading || cooldownLeft > 0"
          type="button"
          class="text-sm font-medium transition-colors"
          :class="cooldownLeft > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-cyan-400 hover:text-cyan-300'"
        >
          {{ resendButtonText }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthActions } from '@/stores/scene/useAuthActions.js'; 
import { usePopAlert } from '@/composables/usePopAlert'; 

const route = useRoute();
const router = useRouter();
const { verifyOtp, resendOtp, isLoading, errorMessage } = useAuthActions();
const { showPop } = usePopAlert();

const userEmail = ref('');
const otpCode = ref('');

// Konfigurasi Cooldown
const COOLDOWN_SECONDS = 180; // 3 menit
const cooldownLeft = ref(0); // Diubah menjadi 0 agar tombol langsung aktif di awal
let cooldownInterval = null;

// Teks dinamis untuk tombol resend
const resendButtonText = computed(() => {
    if (isLoading.value) return 'Mengirim Ulang...';
    if (cooldownLeft.value > 0) {
        const minutes = Math.floor(cooldownLeft.value / 60);
        const seconds = cooldownLeft.value % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        return `Kirim Ulang Kode OTP (${timeString})`;
    }
    return 'Kirim Ulang Kode OTP';
});

// Fungsi untuk menjalankan timer 3 menit
const startCooldown = () => {
    if (cooldownInterval) clearInterval(cooldownInterval);
    cooldownLeft.value = COOLDOWN_SECONDS;
    
    cooldownInterval = setInterval(() => {
        if (cooldownLeft.value > 0) {
            cooldownLeft.value--;
        } else {
            clearInterval(cooldownInterval);
        }
    }, 1000);
};

onMounted(() => {
    const hash = route.query.hash;
    const sessionToken = sessionStorage.getItem('otp_access_token');

    if (!hash || !sessionToken) {
        showPop({ title: 'Akses Dilarang', message: 'Sesi tidak valid.', type: 'error' });
        return router.replace('/');
    }

    try {
        userEmail.value = atob(hash);
        // Hapus pemanggilan startCooldown() dari sini agar timer tidak otomatis jalan
    } catch (e) {
        router.replace('/');
    }
});

onUnmounted(() => {
    if (cooldownInterval) clearInterval(cooldownInterval);
});

const handleActivation = async () => {
    if (otpCode.value.length !== 6) return;
    
    const result = await verifyOtp(userEmail.value, otpCode.value);
    
    if (result.success) {
        if (cooldownInterval) clearInterval(cooldownInterval);
        
        sessionStorage.removeItem('otp_access_token');
        sessionStorage.setItem('lupis_initial_check', 'true');

        router.replace('/dashboard'); 
    }
};

const handleResendOtp = async () => {
    // Cegah double klik saat sedang memuat atau masih cooldown
    if (cooldownLeft.value > 0 || isLoading.value) return;

    const result = await resendOtp(userEmail.value);
    
    if (result.success) {
        otpCode.value = ''; // Kosongkan input agar user bisa mengetik kode baru
        startCooldown(); // Mulai timer 3 menit HANYA setelah resend berhasil
    }
};
</script>