// assets/defaultProject.js

export const DEFAULT_PROJECT_PAYLOAD = {
  project: {
    id: "default_runtime_project",
    name: "Default Project",
    description: "Fallback runtime engine project",
    status: "PUBLISHED",
    createdAt: new Date().toISOString(),
    thumbnailUrl: null,
    settings: {
      tickRate: 60,
      debug: {
        active: false,
        position: "top-right",
        width: 360,
        height: 220,
        maxLogs: 50
      },
      ui: {
        width: 1920,
        height: 1080,
        showUIBorder: false,
        active: true
      },
      camera: {
        x: 0,
        y: 0,
        zoom: 1,
        lerp: 0.1
      },
      grid: {
        width: 32,
        height: 32,
        color: "#ffffff",
        opacity: 0.1,
        visible: false,
        snap: false
      }
    },
    globalVariables: [],
    tags: ["Untagged", "Player", "Enemy"]
  },
  scenes: [
    {
      id: "default_main_scene",
      name: "Main Scene",
      settings: {
        backgroundColor: "#1a1a1a",
        showRulers: false,
        worldBounds: {
          x1: -1920,
          x2: 1920,
          y1: -1080,
          y2: 1080,
          active: true
        },
        physics: {
          gravity: 1200,
          drag: 5
        }
      },
      entities: []
    }
  ],
  prefabs: [],
  assets: [],
  scripts: []
};