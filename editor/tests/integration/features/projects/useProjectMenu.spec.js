import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectMenu } from '@projects/projects.js';

const mockPush = vi.fn();
const mockResolve = vi.fn((route) => {
  if (typeof route === 'string') {
    return { href: route };
  }
  return { href: `/editor/${route.params?.idProject || ''}` };
});

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
    resolve: mockResolve
  })
}));

const mockPrompt = vi.fn();
const mockConfirm = vi.fn();
const mockShowPop = vi.fn();

vi.mock('@composables/composables.js', () => ({
  usePrompt: () => ({ prompt: mockPrompt }),
  useConfirm: () => ({ confirm: mockConfirm }),
  usePopAlert: () => ({ showPop: mockShowPop })
}));

const mockUpdateProject = vi.fn();
const mockDeleteProject = vi.fn();

vi.mock('@projects/projects.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useProjectActions: () => ({
      updateProject: mockUpdateProject,
      deleteProject: mockDeleteProject
    })
  };
});

const mockExportToLupisProject = vi.fn();
vi.mock('@opfs/opfs.js', () => ({
  useOPFSActions: () => ({
    exportToLupisProject: mockExportToLupisProject
  })
}));

describe('useProjectMenu Integration', () => {
  let mockWindowOpen;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowOpen = vi.fn();
    vi.stubGlobal('open', mockWindowOpen);
  });

  it('renders menu items when a project is selected', () => {
    const { menu, handleContextMenu, contextMenuItems } = useProjectMenu();

    const sampleProject = { id: 'proj_123', name: 'My Game', description: 'Test' };
    handleContextMenu({ clientX: 100, clientY: 200 }, sampleProject);

    expect(menu.value.visible).toBe(true);
    expect(menu.value.item).toEqual(sampleProject);

    const items = contextMenuItems.value;
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].label).toBe('My Game');

    const labels = items.filter(i => !i.separator).map(i => i.label);
    expect(labels).toContain('Open');
    expect(labels).toContain('Open in New Tab');
    expect(labels).toContain('Save Project');
    expect(labels).toContain('Rename');
    expect(labels).toContain('Edit Description');
    expect(labels).toContain('Delete Project');
  });

  it('invokes openProjectCallback with inNewTab false when clicking Open', () => {
    const openCallback = vi.fn();
    const { handleContextMenu, contextMenuItems } = useProjectMenu(null, openCallback);

    const sampleProject = { id: 'proj_456', name: 'Open Game' };
    handleContextMenu({ clientX: 50, clientY: 50 }, sampleProject);

    const openItem = contextMenuItems.value.find(i => i.label === 'Open');
    openItem.action();

    expect(openCallback).toHaveBeenCalledWith('proj_456', false);
  });

  it('invokes openProjectCallback with inNewTab true when clicking Open in New Tab', () => {
    const openCallback = vi.fn();
    const { handleContextMenu, contextMenuItems } = useProjectMenu(null, openCallback);

    const sampleProject = { id: 'proj_789', name: 'Tab Game' };
    handleContextMenu({ clientX: 50, clientY: 50 }, sampleProject);

    const openInNewTabItem = contextMenuItems.value.find(i => i.label === 'Open in New Tab');
    openInNewTabItem.action();

    expect(openCallback).toHaveBeenCalledWith('proj_789', true);
  });

  it('falls back to router.push for Open if no callback is supplied', () => {
    const { handleContextMenu, contextMenuItems } = useProjectMenu();

    const sampleProject = { id: 'proj_fallback_1', name: 'Fallback Game' };
    handleContextMenu({ clientX: 0, clientY: 0 }, sampleProject);

    const openItem = contextMenuItems.value.find(i => i.label === 'Open');
    openItem.action();

    expect(mockPush).toHaveBeenCalledWith('/editor/proj_fallback_1');
  });

  it('falls back to window.open for Open in New Tab if no callback is supplied', () => {
    const { handleContextMenu, contextMenuItems } = useProjectMenu();

    const sampleProject = { id: 'proj_fallback_2', name: 'Fallback New Tab' };
    handleContextMenu({ clientX: 0, clientY: 0 }, sampleProject);

    const openInNewTabItem = contextMenuItems.value.find(i => i.label === 'Open in New Tab');
    openInNewTabItem.action();

    expect(mockResolve).toHaveBeenCalledWith({
      name: 'Editor',
      params: { idProject: 'proj_fallback_2' }
    });
    expect(mockWindowOpen).toHaveBeenCalledWith('/editor/proj_fallback_2', '_blank');
  });
});
