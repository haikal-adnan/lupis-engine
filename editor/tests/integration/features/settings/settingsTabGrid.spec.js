import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SettingsTabGrid from '@settings/projects/layouts/section/SettingsTabGrid.vue';
import { useProjectStore } from '@projects/projects.js';

describe('SettingsTabGrid Integration - Camera & Grid Settings', () => {
  let projectStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    projectStore = useProjectStore();
    projectStore.project = {
      id: 'proj_grid_cam_test',
      name: 'Grid & Camera Test',
      settings: {
        ui: {
          width: 1920,
          height: 1080
        },
        grid: {
          visible: true,
          snap: false,
          width: 32,
          height: 32,
          color: '#ffffff',
          opacity: 0.1
        },
        camera: {
          x: 960,
          y: 540,
          zoom: 1,
          lerp: 0.1
        }
      }
    };
  });

  it('renders Zoom & Smoothing row and reflects initial store values', () => {
    const wrapper = mount(SettingsTabGrid, {
      props: {
        info: { id: 'grid', label: 'Grid & Camera', desc: 'Grid guidelines and camera perspective.' }
      }
    });

    expect(wrapper.text()).toContain('Camera');
    expect(wrapper.text()).toContain('Zoom & Smoothing');
    expect(wrapper.text()).toContain('World Position');
  });

  it('updates projectStore camera settings when Zoom and Lerp are modified', async () => {
    projectStore.updateCameraSettings({ zoom: 1.5, lerp: 0.05 });

    expect(projectStore.project.settings.camera.zoom).toBe(1.5);
    expect(projectStore.project.settings.camera.lerp).toBe(0.05);
  });

  it('resets camera position to center (ui.width / 2, ui.height / 2)', async () => {
    projectStore.project.settings.camera.x = 200;
    projectStore.project.settings.camera.y = 100;

    const wrapper = mount(SettingsTabGrid, {
      props: {
        info: { id: 'grid', label: 'Grid & Camera', desc: 'Grid guidelines and camera perspective.' }
      }
    });

    const resetBtn = wrapper.find('button[title="Reset to Center"]');
    expect(resetBtn.exists()).toBe(true);

    await resetBtn.trigger('click');

    expect(projectStore.project.settings.camera.x).toBe(960);
    expect(projectStore.project.settings.camera.y).toBe(540);
  });
});
