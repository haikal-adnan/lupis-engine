import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router.js' 
import App from './App.vue'
import './main.css'
import { initStoragePersistence, startStorageMonitor } from '@opfs/opfs.js'

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')

// Request browser storage persistence to prevent auto-eviction under low disk space
initStoragePersistence().catch(err => {
  console.warn('[App] Storage persistence initialization error:', err)
})

// Start background storage quota monitoring and health detection
startStorageMonitor(60000)