import { Wrench } from 'lucide-vue-next';
import { BlueprintUI } from './BlueprintUI.js';
import { BlueprintDialogue } from './BlueprintDialogue.js';
import { BlueprintPlatformer } from './BlueprintPlatformer.js';
import { BlueprintAI } from './BlueprintAI.js';
import { BlueprintCollectable } from './BlueprintCollectable.js';

export const BlueprintHelperTool = {
  id: 'helper_tool',
  label: 'Helper & Tool',
  color: '#AB47BC',
  icon: Wrench,
  items: [
    ...BlueprintUI.items,
    ...BlueprintDialogue.items,
    ...BlueprintPlatformer.items,
    ...BlueprintAI.items,
    ...BlueprintCollectable.items
  ]
};
