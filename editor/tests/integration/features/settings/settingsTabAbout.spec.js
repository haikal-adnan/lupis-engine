import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import SettingsTabAbout from '@settings/projects/layouts/section/SettingsTabAbout.vue';

describe('SettingsTabAbout Integration', () => {
  it('renders about content with current engine version, github link, and discord link', () => {
    const wrapper = mount(SettingsTabAbout, {
      props: {
        info: { id: 'about', label: 'About', desc: 'Engine version details' }
      }
    });

    // Content container exists
    expect(wrapper.find('[data-testid="settings-tab-about-content"]').exists()).toBe(true);

    // Version badge and version row
    const versionBadge = wrapper.find('[data-testid="about-engine-version-badge"]');
    expect(versionBadge.exists()).toBe(true);
    expect(versionBadge.text()).toBe('v0.1.0');

    const versionText = wrapper.find('[data-testid="about-engine-version"]');
    expect(versionText.exists()).toBe(true);
    expect(versionText.text()).toBe('0.1.0');

    // GitHub link with icon
    const githubLink = wrapper.find('[data-testid="about-github-link"]');
    expect(githubLink.exists()).toBe(true);
    expect(githubLink.attributes('href')).toBe('https://github.com/haikal-adnan/lupis-engine');
    expect(githubLink.attributes('target')).toBe('_blank');
    expect(githubLink.attributes('rel')).toBe('noopener noreferrer');
    expect(githubLink.text()).toContain('GitHub');
    expect(githubLink.find('svg').exists()).toBe(true);

    // Discord link with icon
    const discordLink = wrapper.find('[data-testid="about-discord-link"]');
    expect(discordLink.exists()).toBe(true);
    expect(discordLink.attributes('href')).toBe('https://haikal-adnan.github.io/lupis-engine-link?go=discord');
    expect(discordLink.attributes('target')).toBe('_blank');
    expect(discordLink.attributes('rel')).toBe('noopener noreferrer');
    expect(discordLink.text()).toContain('Discord');
    expect(discordLink.find('svg').exists()).toBe(true);
  });
});
