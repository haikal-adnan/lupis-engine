// helpers/entityIcon.js
import { 
    Box, 
    Type, 
    Image, 
    Shapes, // <-- Ganti 'shapes' jadi 'Shapes'
    Folder, 
    Layers, 
    Hexagon 
} from 'lucide-vue-next';

export const getEntityIcon = (entity, isGroup = false) => {
  if (isGroup) return Folder; // Jika group/parent
  
  const comps = entity.components || {};
  if (comps.TextRenderer) return Type;
  if (comps.SpriteRenderer) return Image;
  if (comps.ShapeRenderer) return shapes; // atau Hexagon
  
  return Box; // Default Entity
};

export const getLayerIcon = () => Layers;