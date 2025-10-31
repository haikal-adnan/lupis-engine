import PhysicsCore from "./PhysicsCore.js";
import Gravity from "./Gravity.js";
import { Force } from "./Force.js";
import { Integrator } from "./Integrator.js";

// Entry point modular untuk sistem fisika
export const Physics = PhysicsCore;
export { Gravity, Force, Integrator };
export default Physics;
