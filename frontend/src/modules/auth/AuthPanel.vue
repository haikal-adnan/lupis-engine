<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 md:scale-95 translate-y-full md:translate-y-0"
      enter-to-class="opacity-100 md:scale-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 md:scale-100 translate-y-0"
      leave-to-class="opacity-0 md:scale-95 translate-y-full md:translate-y-0"
    >
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6"
        @mousedown="onOutsideMouseDown"
        @mouseup="onOutsideMouseUp"
      >
        <div class="w-full max-h-[95vh] md:h-auto md:max-h-[90vh] max-w-3xl bg-card md:border border-border md:rounded-xl rounded-t-2xl shadow-2xl flex flex-col relative overflow-hidden">
          
          <button 
            @click="handleClose" 
            class="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-background/80 md:bg-muted/50 backdrop-blur-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none shadow-sm md:shadow-none"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div class="w-full flex-1 overflow-y-auto overflow-x-hidden flex flex-col md:flex-row">
            
            <div class="w-full md:w-[55%] p-6 pt-16 md:p-12 flex flex-col justify-center bg-background min-h-max">
              
              <div class="mb-8">
                <h2 class="text-3xl font-bold tracking-tight text-cyan-400 mb-1">
                  Lupis<span class="text-foreground">Engine</span>
                </h2>
                <p class="text-sm text-muted-foreground font-medium mt-1.5">
                  {{ mode === 'login' ? 'Selamat datang kembali di visual editor.' : 'Mulai perjalanan game dev Anda.' }}
                </p>
              </div>

              <form @submit.prevent="handleSubmit" class="flex flex-col">
                
                <div v-if="mode === 'register'" class="mb-5">
                  <label class="block text-xs font-medium text-foreground mb-1.5">Nama Lengkap</label>
                  <input 
                    v-model="form.name" 
                    type="text" 
                    placeholder="Nama tampilan Anda"
                    class="w-full bg-background text-foreground placeholder:text-muted-foreground border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 transition-colors"
                    :class="errors.name ? 'border-destructive focus:ring-destructive' : 'border-border focus:border-cyan-400 focus:ring-cyan-400'"
                  />
                  <span v-if="errors.name" class="text-[10px] text-destructive mt-1 block">{{ errors.name }}</span>
                </div>

                <div class="mb-5">
                  <label class="block text-xs font-medium text-foreground mb-1.5">Email</label>
                  <input 
                    v-model="form.email" 
                    type="email" 
                    placeholder="anda@example.com"
                    class="w-full bg-background text-foreground placeholder:text-muted-foreground border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 transition-colors"
                    :class="errors.email ? 'border-destructive focus:ring-destructive' : 'border-border focus:border-cyan-400 focus:ring-cyan-400'"
                  />
                  <span v-if="errors.email" class="text-[10px] text-destructive mt-1 block">{{ errors.email }}</span>
                </div>

                <div class="mb-8">
                  <div class="relative flex flex-col">
                    <label class="block text-xs font-medium text-foreground mb-1.5">Password</label>
                    
                    <div class="relative">
                      <input 
                        v-model="form.password" 
                        :type="showPassword ? 'text' : 'password'" 
                        placeholder="Masukkan password Anda"
                        class="w-full bg-background text-foreground placeholder:text-muted-foreground border rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-1 transition-colors"
                        :class="errors.password ? 'border-destructive focus:ring-destructive' : 'border-border focus:border-cyan-400 focus:ring-cyan-400'"
                      />
                      
                      <button 
                        type="button" 
                        tabindex="-1" 
                        @click="showPassword = !showPassword"
                        class="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground outline-none"
                      >
                         <span class="text-[10px] uppercase font-bold">{{ showPassword ? 'Sembunyikan' : 'Tampilkan' }}</span>
                      </button>
                    </div>

                    <button 
                      v-if="mode === 'login'" 
                      type="button"
                      disabled
                      class="absolute top-0 right-0 text-[11px] font-medium text-muted-foreground cursor-not-allowed"
                    >
                      Lupa password?
                    </button>
                  </div>
                  
                  <span v-if="errors.password" class="text-[10px] text-destructive mt-1 block">{{ errors.password }}</span>
                </div>
                
                <button 
                  type="submit"
                  :disabled="isLoading"
                  class="w-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-3 rounded-lg text-sm transition-colors shadow-lg shadow-cyan-400/20"
                >
                  {{ isLoading ? 'Memproses...' : (mode === 'login' ? 'Masuk' : 'Buat Akun') }}
                </button>
              </form>

              <div class="mt-8 text-sm text-foreground text-center md:text-left">
                {{ mode === 'login' ? "Belum punya akun?" : "Sudah punya akun?" }}
                <button type="button" @click="switchMode(mode === 'login' ? 'register' : 'login')" class="text-cyan-400 hover:text-cyan-300 font-semibold ml-1 transition-colors outline-none">
                  {{ mode === 'login' ? 'Daftar' : 'Masuk' }}
                </button>
              </div>

            </div>

            <div class="w-full md:w-[45%] p-6 pb-10 md:p-12 border-t md:border-t-0 md:border-l border-border flex flex-col justify-center bg-muted/20 min-h-max shrink-0">
              
              <p class="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-6 text-center md:text-left">
                Atau lanjutkan dengan
              </p>

              <div class="flex flex-col gap-4">
                <button 
                  type="button" 
                  @click="handleCustomGoogleLogin"
                  class="w-full flex justify-center items-center gap-2 bg-background border border-border hover:bg-muted text-foreground py-3 rounded-lg text-sm font-semibold transition-all hover:shadow-sm outline-none"
                >
                  <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                  </svg>
                  Google
                </button>
                
              </div>
              
              <div class="mt-8 text-center md:text-left">
                <p class="text-[12px] text-muted-foreground leading-relaxed">
                  Dengan masuk, Anda menyetujui <br class="hidden lg:block"/>
                  <a href="#" class="text-foreground hover:text-cyan-400 transition-colors font-medium">Ketentuan Layanan</a> dan 
                  <a href="#" class="text-foreground hover:text-cyan-400 transition-colors font-medium">Kebijakan Privasi</a> kami.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthActions } from '@/stores/scene/useAuthActions.js'; 
import { useAuthStore } from '@/stores/useAuthStore.js';
import { usePopAlert } from '@/composables/usePopAlert'; 

const { login, register, loginWithGoogle, isLoading, errorMessage } = useAuthActions();
const authStore = useAuthStore(); 
const { showPop } = usePopAlert();
const router = useRouter();

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  initialMode: {
    type: String,
    default: 'login' 
  }
});

const emit = defineEmits(['close', 'auth-success']);

const mode = ref(props.initialMode);
const showPassword = ref(false); 
const isMouseDownOutside = ref(false);

let googleTokenClient = null;

const onOutsideMouseDown = (e) => {
  isMouseDownOutside.value = e.target === e.currentTarget;
};

const onOutsideMouseUp = (e) => {
  if (isMouseDownOutside.value && e.target === e.currentTarget) {
    handleClose();
  }
  isMouseDownOutside.value = false;
};

const form = reactive({
  name: '',
  email: '',
  password: ''
});

const errors = reactive({
  name: '',
  email: '',
  password: ''
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    mode.value = authStore.authMode || props.initialMode;
    showPassword.value = false;
    resetForm();
    
    if (window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    }
  } else {
    document.body.style.overflow = '';
  }
});

const resetForm = () => {
  form.name = '';
  form.email = '';
  form.password = '';
  clearErrors();
};

const clearErrors = () => {
  errors.name = '';
  errors.email = '';
  errors.password = '';
};

const switchMode = (newMode) => {
  mode.value = newMode;
  authStore.setAuthMode(newMode); 
  showPassword.value = false;
  clearErrors();
};

const handleClose = () => {
  emit('close');
};

const validateForm = () => {
  clearErrors();
  let isValid = true;

  if (mode.value === 'register' && !form.name.trim()) {
    errors.name = 'Nama lengkap wajib diisi';
    isValid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!form.email.trim()) {
    errors.email = 'Email wajib diisi';
    isValid = false;
  } else if (!emailRegex.test(form.email)) {
    errors.email = 'Silakan masukkan alamat email yang valid';
    isValid = false;
  }

  if (!form.password) {
    errors.password = 'Password wajib diisi';
    isValid = false;
  } else if (form.password.length < 6) {
    errors.password = 'Password minimal harus 6 karakter';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  if (mode.value === 'login') {
    const result = await login(form.email, form.password);
    
    if (result.success) {
      emit('auth-success');
    } else {
      showPop({
        title: 'Login Gagal',
        message: errorMessage.value || 'Email atau password salah.',
        type: 'error'
      });
    }
  } else {
    const result = await register(form.email, form.password, form.name);
    const encodedEmail = btoa(form.email);
    if (result.success) {
      handleClose();

      sessionStorage.setItem('otp_access_token', 'valid_session_' + Date.now());

      router.push({ 
        name: 'VerifyOTP', 
        query: { hash: encodedEmail }
      });
    } else {
      showPop({
        title: 'Registrasi Gagal',
        message: errorMessage.value || 'Terjadi kesalahan saat membuat akun.',
        type: 'error'
      });
    }
  }
};

onMounted(() => {
  if (!document.getElementById('google-gsi-script')) {
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = initializeGoogleCustomAuth;
  } else if (window.google) {
    initializeGoogleCustomAuth();
  }
});

const initializeGoogleCustomAuth = () => {
  const clientId = '1036067672363-cq86tpni5p4ld7obc0vspv37dbatfhjn.apps.googleusercontent.com';

  googleTokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: 'email profile', 
    callback: async (tokenResponse) => {
      if (tokenResponse && tokenResponse.access_token) {
        
        const result = await loginWithGoogle(tokenResponse.access_token);
        
        if (result && result.success) {
          handleClose();
          emit('auth-success');
          showPop({
            title: 'Berhasil',
            message: 'Berhasil login dengan akun Google.',
            type: 'success'
          });
        } else {
          showPop({
            title: 'Autentikasi Gagal',
            message: errorMessage.value || 'Gagal memproses data dari Google.',
            type: 'error'
          });
        }
      }
    },
    error_callback: (error) => {
      console.error('Google Login Error:', error);
    }
  });
};

const handleCustomGoogleLogin = () => {
  if (googleTokenClient) {
    googleTokenClient.requestAccessToken(); 
  } else {
    showPop({
      title: 'Mohon Tunggu',
      message: 'Sistem autentikasi Google sedang dimuat...',
      type: 'warning'
    });
  }
};
</script>