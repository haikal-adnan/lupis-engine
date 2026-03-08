<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
        @click.self="handleClose"
      >
        <div class="w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          
          <div class="w-full md:w-[55%] p-8 md:p-12 flex flex-col justify-center bg-background">
            
            <div class="mb-8">
              <h2 class="text-3xl font-bold tracking-tight text-cyan-400 mb-1">
                Lupis<span class="text-foreground">Engine</span>
              </h2>
              <p class="text-sm text-muted-foreground font-medium mt-1.5">
                {{ mode === 'login' ? 'Welcome back to the visual editor.' : 'Start your game dev journey.' }}
              </p>
            </div>

            <form @submit.prevent="handleSubmit" class="flex flex-col">
              
              <div v-if="mode === 'register'" class="mb-5">
                <label class="block text-xs font-medium text-foreground mb-1.5">Full Name</label>
                <input 
                  v-model="form.name" 
                  type="text" 
                  placeholder="John Doe"
                  class="w-full bg-background text-foreground placeholder:text-muted-foreground border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 transition-colors"
                  :class="errors.name ? 'border-destructive focus:ring-destructive' : 'border-border focus:border-cyan-400 focus:ring-cyan-400'"
                />
                <span v-if="errors.name" class="text-[10px] text-destructive mt-1 block">{{ errors.name }}</span>
              </div>

              <div class="mb-5">
                <label class="block text-xs font-medium text-foreground mb-1.5">Email</label>
                <input 
                  v-model="form.email" 
                  type="text" 
                  placeholder="you@example.com"
                  class="w-full bg-background text-foreground placeholder:text-muted-foreground border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 transition-colors"
                  :class="errors.email ? 'border-destructive focus:ring-destructive' : 'border-border focus:border-cyan-400 focus:ring-cyan-400'"
                />
                <span v-if="errors.email" class="text-[10px] text-destructive mt-1 block">{{ errors.email }}</span>
              </div>

              <div class="mb-8">
                <div class="flex justify-between items-center mb-1.5">
                  <label class="block text-xs font-medium text-foreground">Password</label>
                  <a v-if="mode === 'login'" href="#" class="text-[11px] font-medium text-muted-foreground hover:text-cyan-400 transition-colors">Forgot password?</a>
                </div>
                <input 
                  v-model="form.password" 
                  type="password" 
                  placeholder="••••••••"
                  class="w-full bg-background text-foreground placeholder:text-muted-foreground border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 transition-colors"
                  :class="errors.password ? 'border-destructive focus:ring-destructive' : 'border-border focus:border-cyan-400 focus:ring-cyan-400'"
                />
                <span v-if="errors.password" class="text-[10px] text-destructive mt-1 block">{{ errors.password }}</span>
              </div>
              
              <button 
                type="submit"
                class="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-bold py-3 rounded-lg text-sm transition-colors shadow-lg shadow-cyan-400/20"
              >
                {{ mode === 'login' ? 'Sign In' : 'Create Account' }}
              </button>
            </form>

            <div class="mt-8 text-sm text-foreground">
              {{ mode === 'login' ? "Don't have an account?" : "Already have an account?" }}
              <button type="button" @click="switchMode(mode === 'login' ? 'register' : 'login')" class="text-cyan-400 hover:text-cyan-300 font-semibold ml-1 transition-colors">
                {{ mode === 'login' ? 'Sign up' : 'Sign in' }}
              </button>
            </div>

          </div>

          <div class="w-full md:w-[45%] p-8 md:p-12 border-t md:border-t-0 md:border-l border-border flex flex-col justify-center bg-muted/20">
            
            <p class="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-6 text-center md:text-left">
              Or continue with
            </p>

            <div class="flex flex-col gap-4">
              <button 
                type="button" 
                class="w-full flex justify-center items-center gap-2 bg-background border border-border hover:bg-muted text-foreground py-3 rounded-lg text-sm font-semibold transition-all hover:shadow-sm"
              >
                <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                Google
              </button>
              
              <button 
                type="button" 
                class="w-full flex justify-center items-center gap-2 bg-background border border-border hover:bg-muted text-foreground py-3 rounded-lg text-sm font-semibold transition-all hover:shadow-sm"
              >
                <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.45-1.15-1.11-1.46-1.11-1.46c-.9-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"/>
                </svg>
                GitHub
              </button>
            </div>
            
            <div class="mt-8 text-center md:text-left">
              <p class="text-[12px] text-muted-foreground leading-relaxed">
                By logging in, you agree to our <br class="hidden lg:block"/>
                <a href="#" class="text-foreground hover:text-cyan-400 transition-colors font-medium">Terms of Service</a> and 
                <a href="#" class="text-foreground hover:text-cyan-400 transition-colors font-medium">Privacy Policy</a>.
              </p>
            </div>

          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup>
import { ref, reactive, watch } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  initialMode: {
    type: String,
    default: 'login' // 'login' | 'register'
  }
});

const emit = defineEmits(['close', 'auth-success']);

const mode = ref(props.initialMode);

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
    mode.value = props.initialMode;
    resetForm();
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
  clearErrors();
};

const handleClose = () => {
  emit('close');
};

const validateForm = () => {
  clearErrors();
  let isValid = true;

  if (mode.value === 'register' && !form.name.trim()) {
    errors.name = 'Full name is required';
    isValid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!form.email.trim()) {
    errors.email = 'Email is required';
    isValid = false;
  } else if (!emailRegex.test(form.email)) {
    errors.email = 'Please enter a valid email address';
    isValid = false;
  }

  if (!form.password) {
    errors.password = 'Password is required';
    isValid = false;
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = () => {
  if (!validateForm()) return;

  console.log(`Submitting ${mode.value} payload:`, form);
  // emit('auth-success', { user: form.email });
  // handleClose();
};
</script>