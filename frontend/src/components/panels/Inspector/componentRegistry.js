// src/components/panels/Inspector/componentRegistry.js

// Import semua komponen inspector tambahan di sini
import ShapeComponent from "@/components/panels/Inspector/parts/ShapeComponent.vue";
import SpriteComponent from "@/components/panels/Inspector/parts/SpriteComponent.vue";
import TextComponent from "@/components/panels/Inspector/parts/TextComponent.vue";

// Mapping Key JSON -> Component Vue
// Key di sebelah kiri HARUS sama persis dengan key di selectedEntity.components
export const ComponentRegistry = {
  "ShapeRenderer": ShapeComponent,
  "SpriteRenderer": SpriteComponent,
  "TextRenderer": TextComponent,
  // Nanti tambah "AudioSource": AudioComponent, dst...
};