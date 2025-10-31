<template>
  <section class="space-y-2">
    <h4 class="font-semibold text-sm text-white/90 mb-1">Physics</h4>

    <InputField label="Gravity" v-model="gravity" />
    <InputField label="Velocity" v-model="velocity" />
    <InputField label="Friction" v-model="friction" />
    <InputField label="Jump Level" v-model="jumpLevel" />
    <InputField label="Jump Limit" v-model="jumpLimit" />
  </section>
</template>

<script setup>
import InputField from "../ui/InputField.vue"
import { ref } from "vue"

const gravity = ref(9.8)
const velocity = ref(12)
const friction = ref(0.2)
const jumpLevel = ref(1)
const jumpLimit = ref(2)
</script>
