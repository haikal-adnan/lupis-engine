<template>
    <div v-if="loading" class="text-muted text-sm">Loading properties...</div>
    <div v-else class="flex flex-col space-y-5 text-sm">
      
      <section
        v-for="(section, index) in sections"
        :key="index"
        class="space-y-2"
      >
        <h4 class="font-semibold text-sm text-primary mb-1 uppercase tracking-wider opacity-90">
          {{ section.name }}
        </h4>

        <template
          v-for="(value, key) in filteredFields(section.fields)"
          :key="key"
        >
          <div v-if="isNestedObject(value)" :key="key + '_nested'" class="space-y-1 ml-2 border-l pl-3 border-gray-700">
             <h5 class="text-xs font-medium text-gray-400 mt-2">{{ formatLabel(key) }}</h5>
             
             <template v-for="(nestedValue, nestedKey) in filteredFields(value)" :key="nestedKey">
                 <BaseInput
                   v-if="typeof nestedValue === 'string' || typeof nestedValue === 'number'"
                   :label="formatLabel(nestedKey)"
                   v-model="section.fields[key][nestedKey]"
                 />
                 <BaseSwitch
                   v-else-if="typeof nestedValue === 'boolean'"
                   :label="formatLabel(nestedKey)"
                   v-model="section.fields[key][nestedKey]"
                 />
                 </template>
          </div>
          
          <BaseSwitch
            v-else-if="typeof value === 'boolean'"
            :label="formatLabel(key)"
            v-model="section.fields[key]"
          />

          <BaseInput
            v-else-if="typeof value === 'string' || typeof value === 'number'"
            :label="formatLabel(key)"
            v-model="section.fields[key]"
          />
          
          </template>
      </section>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import BaseInput from "../../ui/BaseInput.vue" 
import BaseSwitch from "../../ui/BaseSwitch.vue"
import { useBackend } from "@/composables/useBackend.js"

const { API_URL } = useBackend()

const project = "template"
const sections = ref([])
const loading = ref(false)

function formatLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function isNestedObject(value) {
    // Definisi ulang: Objek harus ada, harus bertipe 'object', dan BUKAN Array.
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function filteredFields(fields) {
  const result = {}
  for (const key in fields) {
    if (key !== "NAME" && key !== "layers" && key !== "id") {
      result[key] = fields[key]
    }
  }
  return result
}

// ... (loadProjectConfigs dan onMounted tidak berubah)
async function loadProjectConfigs() {
  loading.value = true
  try {
    const res = await fetch(`${API_URL}/projects/${project}/config`)
    
    if (!res.ok) {
        console.error(`Gagal memuat config: Status ${res.status}`)
        return
    }
    
    const configData = await res.json()
    
    const parsedSections = []

    // Section 1: Meta
    if (configData.meta) {
        parsedSections.push({ name: "Project Metadata", fields: configData.meta })
    }
    
    // Section 2: Editor
    if (configData.editor) {
        parsedSections.push({ name: "Editor Configuration", fields: configData.editor })
    }

    // Section 3: Settings (Termasuk Physics)
    if (configData.settings) {
        parsedSections.push({ name: "Global Settings", fields: configData.settings })
    }
    
    sections.value = parsedSections
    
  } catch (err) {
    console.error("❌ Gagal memuat/parse config:", err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProjectConfigs()
})
</script>

<style scoped>
h3, h4 { user-select: none; }
</style>