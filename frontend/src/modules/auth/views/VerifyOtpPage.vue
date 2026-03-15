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

      <div class="mt-6 text-center">
        <p class="text-sm text-muted-foreground">
          Sisa waktu: <span class="font-mono font-bold" :class="timeLeft <= 30 ? 'text-destructive' : 'text-foreground'">{{ formattedTime }}</span>
        </p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useAuthActions } from '@/stores/scene/useAuthActions.js'; 
import { useAuthBackend } from '@/services/api/backend/useAuthBackend.js';
import { usePopAlert } from '@/composables/usePopAlert'; 

const route = useRoute();
const router = useRouter();
const { verifyOtp, isLoading, errorMessage } = useAuthActions();
const { cancelRegistration } = useAuthBackend();
const { showPop } = usePopAlert();

const userEmail = ref('');
const otpCode = ref('');

const TOTAL_SECONDS = 180;
const timeLeft = ref(TOTAL_SECONDS);
let timerInterval = null;
let isActivated = false;

const formattedTime = computed(() => {
    const minutes = Math.floor(timeLeft.value / 60);
    const seconds = timeLeft.value % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

const destroyOtpSession = async (reason) => {
    if (isActivated || !userEmail.value) return;

    if (reason === 'tab_closed') {
        cancelRegistration(userEmail.value, true);
    } else {
        await cancelRegistration(userEmail.value, false);
    }

    if (reason === 'timeout' || reason === 'route_changed') {
        sessionStorage.removeItem('otp_access_token');
        if (reason === 'timeout') {
            showPop({
                title: 'Waktu Habis',
                message: 'Sesi aktivasi Anda telah berakhir.',
                type: 'error'
            });
            router.replace('/');
        }
    }
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
        timerInterval = setInterval(() => {
            if (timeLeft.value > 0) timeLeft.value--;
            else {
                clearInterval(timerInterval);
                destroyOtpSession('timeout');
            }
        }, 1000);
        window.addEventListener('beforeunload', handleTabClose);
    } catch (e) {
        router.replace('/');
    }
});

onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval);
    window.removeEventListener('beforeunload', handleTabClose);
});

const handleTabClose = () => {
    if (!isActivated) destroyOtpSession('tab_closed');
};

onBeforeRouteLeave((to, from, next) => {
    if (!isActivated && to.name !== 'VerifyOTP') {
        destroyOtpSession('route_changed');
    }
    next();
});

const handleActivation = async () => {
    if (otpCode.value.length !== 6) return;
    
    const result = await verifyOtp(userEmail.value, otpCode.value);
    
    if (result.success) {
        isActivated = true;
        if (timerInterval) clearInterval(timerInterval);
        
        sessionStorage.removeItem('otp_access_token');
        sessionStorage.setItem('lupis_initial_check', 'true');

        router.replace('/dashboard'); 
    }
};
</script>