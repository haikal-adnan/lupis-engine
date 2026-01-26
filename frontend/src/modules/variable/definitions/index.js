// src/modules/nodes/definitions/index.js

import { basicEvent } from '@/modules/variable/definitions/basicEvent.js';
// import { localEventsGroup } from '@/modules/variable/definitions/localEvent.js';
import { basicTransform } from '@/modules/variable/definitions/basicTransform.js';
// import { renderingGroup } from '@/modules/variable/definitions/rendering.js';
// import { logicGroup } from '@/modules/variable/definitions/logic.js';
import { basicMath } from '@/modules/variable/definitions/basicMath.js';
import { basicUI } from '@/modules/variable/definitions/basicUI.js';
import { basicString } from '@/modules/variable/definitions/basicString';

export const STATIC_NODE_GROUPS = [
  basicEvent,        // 1. Basic Events
  // localEventsGroup,   // 2. Local Events
  // logicGroup,         // 3. Flow Control
  basicTransform,    // 4. Transform
  // renderingGroup,     // 5. Visuals
  basicMath,          // 6. Math
  basicUI,             // 7. UI
  basicString
];