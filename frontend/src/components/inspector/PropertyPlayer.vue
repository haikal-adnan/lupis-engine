<template>
  <section class="space-y-2">
    <h4 class="font-semibold text-sm text-white/90 mb-1">Player</h4>

    <InputField label="Width" v-model="width" />
    <InputField label="Height" v-model="height" />
    <InputField label="Speed" v-model="speed" />
    <InputField label="X" v-model="posX" />
    <InputField label="Y" v-model="posY" />
  </section>
</template>

<script setup>
import InputField from "../ui/InputField.vue"
import { ref } from "vue"

const width = ref(32)
const height = ref(48)
const speed = ref(6)
const posX = ref(100)
const posY = ref(240)
</script>
