<!-- components/inspector/Property.vue -->

<template>
    <div v-if="loading" class="text-white/70 text-sm">Loading properties...</div>
    <div v-else class="flex flex-col space-y-5 text-sm">
      <section
        v-for="(section, index) in sections"
        :key="index"
        class="space-y-2"
      >
        <h4 class="font-semibold text-sm text-white/90 mb-1">
          {{ section.name }}
        </h4>

        <template
          v-for="(value, key) in filteredFields(section.fields)"
          :key="key"
        >
          <InputField
            v-if="typeof value !== 'boolean'"
            :label="formatLabel(key)"
            v-model="section.fields[key]"
          />
          <SwitchButton
            v-else
            :label="formatLabel(key)"
            v-model="section.fields[key]"
          />
        </template>
      </section>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import Sidebar from "../layout/Sidebar.vue"
import InputField from "../ui/InputField.vue"
import SwitchButton from "../ui/SwitchButton.vue"
import { useBackend } from "@/composables/useBackend.js"

const { API_URL } = useBackend()
const rowMainMargin = { marginRight: "0px" }

const project = "template-platformer" 
const sections = ref([])
const loading = ref(false)

function formatLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function filteredFields(fields) {
  const result = {}
  for (const key in fields) {
    if (key !== "NAME") result[key] = fields[key]
  }
  return result
}

async function loadProjectConfigs() {
  loading.value = true
  try {
    const configFiles = [
      "camera.json",
      "core.json",
      "physics.json",
      "player.json",
      "timing.json",
      "world.json",
    ]

    const promises = configFiles.map(async (file) => {
      const res = await fetch(
        `${API_URL}/static/projects/${project}/config/${file}`
      )
      if (!res.ok) return null
      const json = await res.json()
      return {
        name: json.NAME || file.replace(".json", ""),
        fields: json,
      }
    })

    const results = (await Promise.all(promises)).filter(Boolean)
    sections.value = results
  } catch (err) {
    console.error("❌ Gagal memuat config:", err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProjectConfigs()
})
</script>

<style scoped>
h3,
h4 {
  user-select: none;
}
</style>
