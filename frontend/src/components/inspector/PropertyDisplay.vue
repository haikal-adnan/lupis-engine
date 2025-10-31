<template>
  <section class="space-y-2">
    <h4 class="font-semibold text-sm text-white/90 mb-1">Display</h4>

    <InputField label="Width" v-model="width" />
    <InputField label="Height" v-model="height" />
    <InputField label="Scale" v-model="scale" />
    <InputField label="Tile Size" v-model="tileSize" />
    <SwitchButton label="Pixel Perfect" v-model="pixelPerfect" />
  </section>
</template>

<script setup>
import InputField from "../ui/InputField.vue"
import SwitchButton from "../ui/SwitchButton.vue"
import { ref } from "vue"

const width = ref(1920)
const height = ref(1080)
const scale = ref(4)
const tileSize = ref(16)
const pixelPerfect = ref(false)
</script>
