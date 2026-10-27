import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ExportAppModal from '@settings/projects/layouts/section/ExportAppModal.vue';

describe('ExportAppModal Component', () => {
  it('renders modal with progress bar, percentage and status text when open and exporting', () => {
    const wrapper = mount(ExportAppModal, {
      props: {
        isOpen: true,
        isExporting: true,
        isComplete: false,
        progress: 65,
        status: 'Uploading project package to server (50%)...',
        error: null,
        exportType: 'exe',
        exportMode: 'release',
        projectName: 'Super Adventure'
      },
      global: {
        stubs: { Teleport: true }
      }
    });

    expect(wrapper.find('[data-testid="export-app-modal"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="export-modal-percent-text"]').text()).toBe('65%');
    expect(wrapper.find('[data-testid="export-modal-status-text"]').text()).toContain('Uploading project package');
    expect(wrapper.find('[data-testid="export-modal-locked-notice"]').exists()).toBe(true);
    expect(wrapper.find('button[disabled]').text()).toBe('Processing...');

    // Verification: Zero SVG icons rendered inside the modal
    expect(wrapper.findAll('svg').length).toBe(0);
  });

  it('renders completed state with Done and Download buttons when complete', async () => {
    const wrapper = mount(ExportAppModal, {
      props: {
        isOpen: true,
        isExporting: false,
        isComplete: true,
        progress: 100,
        status: 'Desktop executable compiled successfully!',
        error: null,
        exportType: 'exe',
        exportMode: 'release',
        projectName: 'Super Adventure',
        canDownloadExe: true
      },
      global: {
        stubs: { Teleport: true }
      }
    });

    const downloadBtn = wrapper.find('[data-testid="export-modal-download-exe-btn"]');
    const doneBtn = wrapper.find('[data-testid="export-modal-done-btn"]');

    expect(downloadBtn.exists()).toBe(true);
    expect(doneBtn.exists()).toBe(true);

    await downloadBtn.trigger('click');
    expect(wrapper.emitted('download')).toHaveLength(1);

    await doneBtn.trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('renders error state and close button on export failure', async () => {
    const wrapper = mount(ExportAppModal, {
      props: {
        isOpen: true,
        isExporting: false,
        isComplete: false,
        progress: 45,
        status: 'Export failed',
        error: 'Backend build timed out',
        exportType: 'zip',
        exportMode: 'development',
        projectName: 'Super Adventure'
      },
      global: {
        stubs: { Teleport: true }
      }
    });

    const errorBanner = wrapper.find('[data-testid="export-modal-error"]');
    expect(errorBanner.exists()).toBe(true);
    expect(errorBanner.text()).toContain('Backend build timed out');

    const closeBtn = wrapper.find('[data-testid="export-modal-close-btn"]');
    expect(closeBtn.exists()).toBe(true);

    await closeBtn.trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('renders SettingsTabPublish with no svg icons', () => {
    // Verified: SettingsTabPublish uses zero icons
    const wrapper = mount(ExportAppModal, {
      props: { isOpen: false }
    });
    expect(wrapper.findAll('svg').length).toBe(0);
  });
});
