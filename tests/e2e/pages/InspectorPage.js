import { expect } from '@playwright/test';
import { BaseControlHelper } from '../helpers/BaseControlHelper.js';
import { PopupHelper } from '../helpers/PopupHelper.js';

export class InspectorPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.controls = new BaseControlHelper(page);
    this.popup = new PopupHelper(page);
  }

  field(testId, inner = 'input') {
    if (testId === 'object-name-input') {
      return this.page.locator('[data-testid="object-script-id-input"], [data-testid="object-name-input"]').locator(inner).first();
    }
    if (testId === 'layer-name-input') {
      return this.page.locator('[data-testid="layer-script-id-input"], [data-testid="layer-name-input"]').locator(inner).first();
    }
    return this.page.getByTestId(testId).locator(inner).first();
  }

  checkbox(testId) {
    return this.page.getByTestId(testId).locator('input[type="checkbox"]');
  }

  async _settle() {
    await expect(this.objectSection).toBeVisible();
  }

  // =========================================================================
  // SECTIONS LOCATORS
  // =========================================================================
  get projectSection() {
    return this.page.getByTestId('editor-project-section');
  }

  get sceneSection() {
    return this.page.getByTestId('editor-scene-section');
  }

  get layerSection() {
    return this.page.getByTestId('editor-layer-section');
  }

  get objectSection() {
    return this.page.getByTestId('editor-object-section');
  }

  get transformSection() {
    return this.page.getByTestId('editor-transform-section');
  }

  get uiTransformSection() {
    return this.page.getByTestId('editor-ui-transform-section');
  }

  get colliderSection() {
    return this.page.getByTestId('editor-collider-section');
  }

  get physicsSection() {
    return this.page.getByTestId('editor-physics-section');
  }

  get audioSection() {
    return this.page.getByTestId('editor-audio-section');
  }

  get scriptControllerSection() {
    return this.page.getByTestId('editor-script-controller-section');
  }

  get spriteRendererSection() {
    return this.page.getByTestId('editor-sprite-renderer-section');
  }

  get textRendererSection() {
    return this.page.getByTestId('editor-text-renderer-section');
  }

  get spriteAnimatorSection() {
    return this.page.getByTestId('editor-sprite-animator-section');
  }

  get shapeRendererSection() {
    return this.page.getByTestId('editor-shape-renderer-section');
  }

  get tilemapSection() {
    return this.page.getByTestId('editor-tilemap-section');
  }

  get addComponentContainer() {
    return this.page.locator('div', { hasText: 'Actions' })
      .filter({ has: this.page.getByTestId('add-component-select').or(this.page.getByTestId('select-container')) })
      .last();
  }

  // =========================================================================
  // PROJECT & SCENE INSPECTOR ACTIONS (Deselected State)
  // =========================================================================
  async toggleProjectGridGuide() {
    await this.page.getByTestId('project-show-grid-toggle').click();
  }

  async toggleProjectSnapGrid() {
    await this.page.getByTestId('project-snap-grid-toggle').click();
  }

  async toggleProjectRulers() {
    await this.page.getByTestId('project-show-rulers-toggle').click();
  }

  async toggleProjectUILayer() {
    await this.page.getByTestId('project-enable-ui-toggle').click();
  }

  // =========================================================================
  // ACTIONS: ADD COMPONENT
  // =========================================================================
  async addComponent(componentName) {
    await this.addComponentContainer.scrollIntoViewIfNeeded();
    await expect(this.addComponentContainer).toBeVisible();
    await this.controls.selectOption('add-component-select', componentName, this.addComponentContainer);
  }

  // =========================================================================
  // OBJECT INSPECTOR ACTIONS
  // =========================================================================
  async setEntityName(newName) {
    const scriptInput = this.page.getByTestId('object-script-id-input').locator('input').first();
    const nameInput = this.page.getByTestId('object-name-input').locator('input').first();
    const isScriptVisible = await scriptInput.isVisible().catch(() => false);
    const input = isScriptVisible ? scriptInput : nameInput;
    await input.fill(newName);
    await input.press('Enter');
    await input.blur();
  }

  async setScriptId(newId) {
    const input = this.page.getByTestId('object-script-id-input').locator('input').first();
    await input.fill(newId);
    await input.blur();
  }

  async setEntityTag(tag) {
    // 1. Make sure the tag is registered in the Pinia project metadata
    await this.page.evaluate(({ t }) => {
      const app = document.querySelector('#app')?.__vue_app__;
      const pinia = app?.config?.globalProperties?.$pinia;
      const projectStore = pinia?._s?.get('project');
      if (projectStore?.project) {
        projectStore.project.tags = projectStore.project.tags || [];
        if (!projectStore.project.tags.includes(t)) {
          projectStore.project.tags.push(t);
        }
      }
    }, { t: tag });

    // 2. Pick the tag from the BaseSelect dropdown in the Object Inspector
    const tagSelect = this.objectSection.getByTestId('object-tag-select');
    await expect(tagSelect).toBeVisible();

    const trigger = tagSelect
      .getByTestId('select-trigger')
      .or(tagSelect.locator('button'))
      .or(tagSelect)
      .first();
    await trigger.click();

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const option = this.page
      .getByTestId('select-option')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegex(tag)}\\s*$`, 'i') })
      .or(this.page.getByRole('option', { name: tag }))
      .first();

    await expect(option).toBeVisible();
    await option.click();
  }

  async toggleEntityActive() {
    await this.page.getByTestId('object-active-toggle').click();
  }

  async toggleEntityVisible() {
    await this.page.getByTestId('object-visible-toggle').click();
  }

  async toggleEntityLock() {
    await this.page.getByTestId('object-lock-toggle').click();
  }

  // =========================================================================
  // LAYER INSPECTOR ACTIONS
  // =========================================================================
  async setLayerName(newName) {
    const scriptInput = this.page.getByTestId('layer-script-id-input').locator('input').first();
    const nameInput = this.page.getByTestId('layer-name-input').locator('input').first();
    const isScriptVisible = await scriptInput.isVisible().catch(() => false);
    const input = isScriptVisible ? scriptInput : nameInput;
    await input.fill(newName);
    await input.press('Enter');
    await input.blur();
  }

  async setLayerZIndex(zIndex) {
    const input = this.page.getByTestId('layer-z-index-input').locator('input').first();
    await input.fill(String(zIndex));
    await input.press('Enter');
  }

  async toggleLayerActive() {
    await this.page.getByTestId('layer-active-toggle').click();
  }

  // =========================================================================
  // TRANSFORM ACTIONS
  // =========================================================================
  async setPosition(x, y) {
    const posX = this.page.getByTestId('transform-pos-x').locator('input').first();
    const posY = this.page.getByTestId('transform-pos-y').locator('input').first();

    await posX.fill(String(x));
    await posX.press('Enter');
    await posY.fill(String(y));
    await posY.press('Enter');
  }

  async setRotation(deg) {
    const rot = this.page.getByTestId('transform-rotation').locator('input').first();
    await rot.fill(String(deg));
    await rot.press('Enter');
  }

  // =========================================================================
  // UI TRANSFORM ACTIONS
  // =========================================================================
  async setUIPosition(x, y) {
    const posX = this.page.getByTestId('ui-transform-pos-x').locator('input').first();
    const posY = this.page.getByTestId('ui-transform-pos-y').locator('input').first();

    await posX.fill(String(x));
    await posX.press('Enter');
    await posY.fill(String(y));
    await posY.press('Enter');
  }

  async setUISize(w, h) {
    const sizeW = this.page.getByTestId('ui-transform-size-w').locator('input').first();
    const sizeH = this.page.getByTestId('ui-transform-size-h').locator('input').first();

    await sizeW.fill(String(w));
    await sizeW.press('Enter');
    await sizeH.fill(String(h));
    await sizeH.press('Enter');
  }

  // =========================================================================
  // AUDIO INSPECTOR ACTIONS
  // =========================================================================
  async ensureAudioComponent() {
    await this._settle();
    if ((await this.audioSection.count()) === 0) {
      await this.addComponent('Audio');
      await expect(this.audioSection).toBeVisible();
    }
  }

  async setAudioVolume(volumePercent) {
    const input = this.page.getByTestId('audio-volume-input').locator('input').first();
    await input.fill(String(volumePercent));
    await input.press('Enter');
  }

  async setAudioPitch(pitchValue) {
    const input = this.page.getByTestId('audio-pitch-input').locator('input').first();
    await input.fill(String(pitchValue));
    await input.press('Enter');
  }

  async toggleAudioMute() {
    await this.page.getByTestId('audio-active-toggle').click();
  }

  async toggleAudioAutoplay() {
    await this.page.getByTestId('audio-autoplay-toggle').click();
  }

  async toggleAudioLoop() {
    await this.page.getByTestId('audio-loop-toggle').click();
  }

  async toggleAudioPersist() {
    await this.page.getByTestId('audio-persist-toggle').click();
  }

  async toggleAudioSpatial() {
    await this.page.getByTestId('audio-spatial-toggle').click();
  }

  // =========================================================================
  // SCRIPT CONTROLLER ACTIONS
  // =========================================================================
  async ensureScriptControllerComponent() {
    await this._settle();
    if ((await this.scriptControllerSection.count()) === 0) {
      await this.addComponent('Script Controller');
      await expect(this.scriptControllerSection).toBeVisible();
    }
  }

  async selectAttachedScript(scriptName) {
    await this._settle();
    await this.scriptControllerSection.scrollIntoViewIfNeeded();
    await expect(this.scriptControllerSection).toBeVisible();

    const trigger = this.page.getByTestId('script-controller-dropdown-trigger');
    await trigger.scrollIntoViewIfNeeded();
    await expect(trigger).toBeVisible();
    await trigger.click();

    const list = this.page.getByTestId('script-controller-dropdown-list');
    await expect(list).toBeVisible();
    await list.getByTestId('script-controller-item').filter({ hasText: scriptName }).click();
  }

  async toggleScriptActive() {
    await this.page.getByTestId('script-controller-active-toggle').click();
  }

  // =========================================================================
  // SPRITE RENDERER ACTIONS
  // =========================================================================
  async ensureSpriteRendererComponent() {
    await this._settle();
    if ((await this.spriteRendererSection.count()) === 0) {
      await this.addComponent('Image Renderer');
      await expect(this.spriteRendererSection).toBeVisible();
    }
  }

  async setSpriteSourceRect(x, y, w, h) {
    const xInput = this.page.getByTestId('sprite-renderer-source-x').locator('input').first();
    const yInput = this.page.getByTestId('sprite-renderer-source-y').locator('input').first();
    const wInput = this.page.getByTestId('sprite-renderer-source-w').locator('input').first();
    const hInput = this.page.getByTestId('sprite-renderer-source-h').locator('input').first();

    await xInput.fill(String(x));
    await xInput.press('Enter');
    await yInput.fill(String(y));
    await yInput.press('Enter');
    await wInput.fill(String(w));
    await wInput.press('Enter');
    await hInput.fill(String(h));
    await hInput.press('Enter');
  }

  async setSpriteOpacity(opacityPercent) {
    const input = this.page.getByTestId('sprite-renderer-opacity').locator('input').first();
    await input.fill(String(opacityPercent));
    await input.press('Enter');
  }

  async setSpriteFilterMode(filterLabel) {
    await this.controls.selectOption('sprite-renderer-filter-select', filterLabel, this.spriteRendererSection);
  }

  async toggleSpriteSDF() {
    await this.page.getByTestId('sprite-renderer-sdf-toggle').click();
  }

  // =========================================================================
  // TEXT RENDERER ACTIONS
  // =========================================================================
  async ensureTextRendererComponent() {
    await this._settle();
    if ((await this.textRendererSection.count()) === 0) {
      await this.addComponent('Text Renderer');
      await expect(this.textRendererSection).toBeVisible();
    }
  }

  async setTextContent(text) {
    const input = this.page.getByTestId('text-renderer-text-input').locator('textarea, input').first();
    await input.fill(text);
    await input.blur();
  }

  async setFontSize(size) {
    const input = this.page.getByTestId('text-renderer-font-size').locator('input').first();
    await input.fill(String(size));
    await input.press('Enter');
  }

  async setTextAlign(align) {
    await this.page.getByTestId(`text-renderer-align-${align}`).click();
  }

  async setTextMode(modeLabel) {
    await this.controls.selectOption('text-renderer-mode-select', modeLabel, this.textRendererSection);
  }

  async toggleTextAutoLine(checked) {
    const checkbox = this.checkbox('text-renderer-auto-line-toggle');
    await checkbox.setChecked(checked);
    await expect(checkbox).toBeChecked({ checked });
  }

  async toggleTextShadow(checked) {
    const checkbox = this.page.getByTestId('text-renderer-shadow-toggle').locator('input[type="checkbox"]').or(this.page.getByTestId('text-renderer-shadow-toggle')).first();
    await checkbox.setChecked(checked);
    await expect(checkbox).toBeChecked({ checked });
  }

  // =========================================================================
  // SPRITE ANIMATOR ACTIONS
  // =========================================================================
  async ensureSpriteAnimatorComponent() {
    await this._settle();
    if ((await this.spriteAnimatorSection.count()) === 0) {
      await this.addComponent('Sprite Animator');
      await expect(this.spriteAnimatorSection).toBeVisible();
    }
  }

  async toggleAnimatorActive() {
    await this.page.getByTestId('animator-active-toggle').click();
  }

  async toggleAnimatorPlay() {
    await this.page.getByTestId('animator-play-toggle').click();
  }

  async openAnimatorEditor() {
    await this.page.getByTestId('animator-open-editor-btn').click();
  }

  // =========================================================================
  // SHAPE RENDERER ACTIONS
  // =========================================================================
  async ensureShapeRendererComponent() {
    await this._settle();
    if ((await this.shapeRendererSection.count()) === 0) {
      await this.addComponent('Shape Renderer');
      await expect(this.shapeRendererSection).toBeVisible();
    }
  }

  async setShapeOutlineWidth(width) {
    const input = this.page.getByTestId('shape-renderer-outline-width').locator('input').first();
    await input.fill(String(width));
    await input.press('Enter');
  }

  async openShapeEditor() {
    await this.page.getByTestId('shape-renderer-open-editor-btn').click();
  }

  // =========================================================================
  // TILEMAP ACTIONS
  // =========================================================================
  async ensureTilemapComponent() {
    await this._settle();
    if ((await this.tilemapSection.count()) === 0) {
      await this.addComponent('Tilemap');
      await expect(this.tilemapSection).toBeVisible();
    }
  }

  async setTilemapOpacity(opacityPercent) {
    const input = this.page.getByTestId('tilemap-opacity-input').locator('input').first();
    await input.fill(String(opacityPercent));
    await input.press('Enter');
  }

  async openTilemapEditor() {
    await this.page.getByTestId('tilemap-open-editor-btn').click();
  }

  // =========================================================================
  // COLLIDER ACTIONS
  // =========================================================================
  async ensureColliderComponent() {
    await this._settle();
    if ((await this.colliderSection.count()) === 0) {
      await this.addComponent('Collider');
      await expect(this.colliderSection).toBeVisible();
    }
  }

  async setColliderType(typeLabel) {
    await this.controls.selectOption('collider-type-select', typeLabel, this.colliderSection);
  }

  async toggleColliderAutoFit(checked) {
    const checkbox = this.page.getByTestId('collider-autofit-toggle').locator('input[type="checkbox"]').or(this.page.getByTestId('collider-autofit-toggle')).first();
    await checkbox.setChecked(checked);
    await expect(checkbox).toBeChecked({ checked });
  }

  // =========================================================================
  // PHYSICS ACTIONS
  // =========================================================================
  async ensurePhysicsComponent() {
    await this._settle();
    if ((await this.physicsSection.count()) === 0) {
      await this.addComponent('Physics');
      await expect(this.physicsSection).toBeVisible();
    }
  }

  async setPhysicsBodyType(typeLabel) {
    await this.controls.selectOption('physics-body-type-select', typeLabel, this.physicsSection);
  }

  async setPhysicsMass(mass) {
    const input = this.page.getByTestId('physics-mass-input').locator('input').first();
    await input.fill(String(mass));
    await input.press('Enter');
  }

  async setPhysicsGravityScale(scale) {
    const input = this.page.getByTestId('physics-gravity-scale-input').locator('input').first();
    await input.fill(String(scale));
    await input.press('Enter');
  }
}