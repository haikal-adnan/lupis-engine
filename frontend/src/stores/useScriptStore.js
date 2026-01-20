// src/stores/useScriptStore.js
import { defineStore } from 'pinia';
import { 
  createScriptNode, 
  createScriptEdge 
} from '@/services/schema/scriptSchema';

const PLAYER_MOVEMENT_SCRIPT = {
  _id: "script_all_types_demo",
  projectId: "proj_demo_types",
  name: "NPC Dialogue System (All Types)",
  type: "scene_logic",
  exposedVariables: [],
  nodes: [
    // --- NODE 1: EVENT INTERACT (Trigger Awal) ---
    {
      _id: "n1_interact",
      type: "event_on_interact",
      position: { x: 50, y: 300 },
      settings: {
        headerTitle: "On Interact NPC",
        headerColor: "#E91E63", // Pink Event
      },
      inputs: [],
      outputs: [
        { _id: "out_exec", label: "Start", type: "execution", color: "#ffffff" }
      ],
      data: {}
    },

    // --- NODE 2: PLAYER DATA PROVIDER (Sumber Data String & Bool) ---
    {
      _id: "n2_player_data",
      type: "data_player_info",
      position: { x: 300, y: 100 },
      settings: {
        headerTitle: "Get Player Info",
        headerColor: "#9C27B0", // Ungu Data
        description: "Provides player stats"
      },
      inputs: [], // Node data murni, tidak butuh input flow
      outputs: [
        // 🟣 STRING OUTPUT
        { _id: "out_name", label: "Player Name", type: "string", color: "#9c27b0" },
        // 🔴 BOOLEAN OUTPUT
        { _id: "out_has_quest", label: "Is Quest Done?", type: "boolean", color: "#f44336" }
      ],
      data: { debugName: "Hero_01" }
    },

    // --- NODE 3: LOGIC BRANCH (Cek Boolean) ---
    {
      _id: "n3_branch",
      type: "logic_branch",
      position: { x: 350, y: 300 },
      settings: {
        headerTitle: "Check Quest State",
        headerColor: "#FF9800", // Orange Logic
      },
      inputs: [
        { _id: "in_exec", label: "In", color: "#ffffff" },
        // 🔴 Menerima input Boolean
        { _id: "in_cond", label: "Condition", color: "#f44336" } 
      ],
      outputs: [
        { _id: "out_true", label: "True (Done)", type: "execution", color: "#ffffff" },
        { _id: "out_false", label: "False (Not Yet)", type: "execution", color: "#ffffff" }
      ],
      data: {}
    },

    // --- NODE 4: WORLD DATA PROVIDER (Sumber Data Vector & Object) ---
    {
      _id: "n4_world_data",
      type: "data_world_info",
      position: { x: 300, y: 550 },
      settings: {
        headerTitle: "Get NPC & Reward Info",
        headerColor: "#2196F3", // Biru Data Object
      },
      inputs: [],
      outputs: [
        // 🟡 VECTOR OUTPUT
        { _id: "out_npc_pos", label: "NPC Look Pos", type: "vector", color: "#FFC107" },
        // 🔵 OBJECT OUTPUT
        { _id: "out_reward_item", label: "Reward Item Ref", type: "object", color: "#2196f3" }
      ],
      data: { rewardId: "sword_epic_01" }
    },

    // --- NODE 5: MATH CALCULATION (Sumber Data Number) ---
    {
      _id: "n5_calc_exp",
      type: "math_formula",
      position: { x: 700, y: 100 },
      settings: {
        headerTitle: "Calc EXP Reward",
        headerColor: "#009688", // Teal Math
        visibleDataFields: ["base", "bonus"]
      },
      inputs: [],
      outputs: [
        // 🟢 NUMBER OUTPUT
        { _id: "out_total_exp", label: "Total Exp", type: "number", color: "#00e676" }
      ],
      data: { base: 500, bonus: 1.2 }
    },

    // --- NODE 6: THE "KITCHEN SINK" (Menerima SEMUA Warna) ---
    // Ini adalah node final yang menampilkan dialog
    {
      _id: "n6_show_dialogue",
      type: "ui_show_advanced_dialogue",
      position: { x: 1000, y: 250 },
      settings: {
        headerTitle: "Show Final Dialogue",
        headerColor: "#607D8B", // Abu-abu UI
        description: "Displays complex UI with all data types.",
        visibleDataFields: ["message"]
      },
      // PERHATIKAN: 6 Input dengan warna berbeda-beda!
      inputs: [
        { _id: "in_exec", label: "Show", type: "execution", color: "#ffffff" }, // ⚪ Flow
        { _id: "in_name", label: "Target Name", type: "string", color: "#9c27b0" }, // 🟣 String
        { _id: "in_cond", label: "Is Happy?", type: "boolean", color: "#f44336" },  // 🔴 Bool
        { _id: "in_exp",  label: "Exp Amount", type: "number", color: "#00e676" },  // 🟢 Number
        { _id: "in_look", label: "Look At", type: "vector", color: "#FFC107" },     // 🟡 Vector
        { _id: "in_item", label: "Give Item", type: "object", color: "#2196f3" }    // 🔵 Object
      ],
      outputs: [
         { _id: "out_done", label: "On Closed", type: "execution", color: "#ffffff" }
      ],
      data: { message: "Thanks for helping, {name}! Here is {exp} exp and a {item}." }
    },

     // --- NODE 7: ALTERNATE DIALOGUE (Jalur False) ---
    {
      _id: "n7_simple_dialogue",
      type: "ui_message",
      position: { x: 700, y: 450 },
      settings: { headerTitle: "Simple Message", headerColor: "#607D8B" },
      inputs: [
        { _id: "in_exec", label: "Show", color: "#ffffff" },
        { _id: "in_name", label: "Name", color: "#9c27b0" } // 🟣 String
      ],
      outputs: [],
      data: { msg: "Please finish the quest first, {name}." }
    }
  ],
  
  edges: [
    // 1. Flow Utama: Interact -> Branch
    { _id: "e1", source: "n1_interact", sourceHandle: "out_exec", target: "n3_branch", targetHandle: "in_exec" },

    // 2. Data Bool: Player Data -> Branch Condition (🔴 Merah)
    { _id: "e2", source: "n2_player_data", sourceHandle: "out_has_quest", target: "n3_branch", targetHandle: "in_cond" },

    // --- JALUR TRUE (Quest Selesai) ---
    // 3. Flow: Branch(True) -> Final Dialogue
    { _id: "e3", source: "n3_branch", sourceHandle: "out_true", target: "n6_show_dialogue", targetHandle: "in_exec" },

    // 4. KONEKSI DATA WARNA-WARNI KE NODE FINAL (N6)
    // 🟣 String (Name)
    { _id: "e4", source: "n2_player_data", sourceHandle: "out_name", target: "n6_show_dialogue", targetHandle: "in_name" },
    // 🔴 Bool (Condition - Reused)
    { _id: "e5", source: "n2_player_data", sourceHandle: "out_has_quest", target: "n6_show_dialogue", targetHandle: "in_cond" },
    // 🟢 Number (Exp)
    { _id: "e6", source: "n5_calc_exp", sourceHandle: "out_total_exp", target: "n6_show_dialogue", targetHandle: "in_exp" },
    // 🟡 Vector (Posisi NPC)
    { _id: "e7", source: "n4_world_data", sourceHandle: "out_npc_pos", target: "n6_show_dialogue", targetHandle: "in_look" },
    // 🔵 Object (Reward Item)
    { _id: "e8", source: "n4_world_data", sourceHandle: "out_reward_item", target: "n6_show_dialogue", targetHandle: "in_item" },


    // --- JALUR FALSE (Quest Belum Selesai) ---
    // 9. Flow: Branch(False) -> Simple Dialogue
    { _id: "e9", source: "n3_branch", sourceHandle: "out_false", target: "n7_simple_dialogue", targetHandle: "in_exec" },
    // 10. Data String: Player Name -> Simple Dialogue (🟣 Ungu)
    { _id: "e10", source: "n2_player_data", sourceHandle: "out_name", target: "n7_simple_dialogue", targetHandle: "in_name" },
  ]
};

export const useScriptStore = defineStore('script', {
  state: () => ({
    // Langsung masukkan Object, bukan ID string
    scripts: [PLAYER_MOVEMENT_SCRIPT],
    activeScript: PLAYER_MOVEMENT_SCRIPT, 
    isLoading: false,
    selectedNodeId: null
  }),

  getters: {
    getScriptById: (state) => (id) => {
      return state.scripts.find(s => s._id === id);
    },

    componentScripts: (state) => {
      return state.scripts.filter(s => s.type === 'component');
    },

    logicScripts: (state) => {
      return state.scripts.filter(s => s.type === 'scene_logic');
    }
  },

  actions: {

    setSelectedNode(nodeId) {
      this.selectedNodeId = nodeId;
    },

    initScripts(scriptList) {
      this.scripts = scriptList;
    },

    addScript(script) {
      this.scripts.push(script);
    },

    removeScript(scriptId) {
      this.scripts = this.scripts.filter(s => s._id !== scriptId);
      if (this.activeScript && this.activeScript._id === scriptId) {
        this.activeScript = null;
      }
    },

    setActiveScript(scriptData) {
      this.activeScript = scriptData; 
    },

    // --- GRAPH ACTIONS (Sesuai diskusi sebelumnya) ---

    addNodeToActive(rawNodeData) {
      if (!this.activeScript) return;
      const newNode = createScriptNode(rawNodeData);
      this.activeScript.nodes.push(newNode);
    },

    updateNodeInActive(nodeId, updates) {
      if (!this.activeScript) return;
      const node = this.activeScript.nodes.find(n => n._id === nodeId);
      if (node) {
        Object.assign(node, updates);
        // Handle nested settings reactivity manually just in case
        if (updates.settings) {
          Object.assign(node.settings, updates.settings);
        }
      }
    },

    removeNodeFromActive(nodeId) {
      if (!this.activeScript) return;
      this.activeScript.nodes = this.activeScript.nodes.filter(n => n._id !== nodeId);
      this.activeScript.edges = this.activeScript.edges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      );
      
      // Reset selection jika node yang dihapus sedang dipilih
      if (this.selectedNodeId === nodeId) {
        this.selectedNodeId = null;
      }
    },

    addEdgeToActive(rawEdgeData) {
      if (!this.activeScript) return;
      // Cek duplikat agar tidak menumpuk
      const exists = this.activeScript.edges.find(e => 
        e.source === rawEdgeData.source && 
        e.target === rawEdgeData.target &&
        e.sourceHandle === rawEdgeData.sourceHandle &&
        e.targetHandle === rawEdgeData.targetHandle
      );

      if (!exists) {
        const newEdge = createScriptEdge(rawEdgeData);
        this.activeScript.edges.push(newEdge);
      }
    },

    removeEdgeFromActive(edgeId) {
      if (!this.activeScript) return;
      this.activeScript.edges = this.activeScript.edges.filter(e => e._id !== edgeId);
    },

    updateScriptInList(scriptId, updates) {
      const script = this.scripts.find(s => s._id === scriptId);
      if (script) {
        Object.assign(script, updates);
      }

      if (this.activeScript && this.activeScript._id === scriptId) {
        Object.assign(this.activeScript, updates);
      }
    }
  }
});