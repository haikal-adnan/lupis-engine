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
    const input = this.page.getByTestId('object-name-input').locator('input').first();
    await input.fill(newName);
    await input.press('Enter');
  }

  async setScriptId(newId) {
    const input = this.page.getByTestId('object-script-id-input').locator('input').first();
    await input.fill(newId);
    await input.blur();
  }

  // =========================================================================
  // LAYER INSPECTOR ACTIONS
  // =========================================================================
  async setLayerName(newName) {
    const input = this.page.getByTestId('layer-name-input').locator('input').first();
    await input.fill(newName);
    await input.press('Enter');
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
    if ((await this.audioSection.count()) === 0 || !(await this.audioSection.isVisible())) {
      await this.addComponent('Audio');
      await expect(this.audioSection).toBeVisible();
    }
  }

  async selectAudioClip(clipLabel) {
    await this.controls.selectOption('audio-clip-select', clipLabel, this.audioSection);
  }

  async addAudioClip() {
    const trigger = this.page.getByTestId('audio-clip-options-trigger');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const addBtn = this.page.getByTestId('audio-add-clip-btn');
    await expect(addBtn).toBeVisible();
    await addBtn.click();
  }

  async removeAudioClip() {
    const trigger = this.page.getByTestId('audio-clip-options-trigger');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const removeBtn = this.page.getByTestId('audio-remove-clip-btn');
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();
  }

  async setClipScriptId(scriptId) {
    const input = this.page.getByTestId('audio-script-id-input').locator('input').first();
    await input.fill(scriptId);
    await input.blur();
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
    if ((await this.scriptControllerSection.count()) === 0 || !(await this.scriptControllerSection.isVisible())) {
      await this.addComponent('Script Controller');
      await expect(this.scriptControllerSection).toBeVisible();
    }
  }

  async selectAttachedScript(scriptName) {
    await this.page.getByTestId('script-controller-dropdown-trigger').click();
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
    if ((await this.spriteRendererSection.count()) === 0 || !(await this.spriteRendererSection.isVisible())) {
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
    if ((await this.textRendererSection.count()) === 0 || !(await this.textRendererSection.isVisible())) {
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

  async toggleTextShadow(checked) {
    const checkbox = this.page.getByTestId('text-renderer-shadow-toggle').locator('input[type="checkbox"]').or(this.page.getByTestId('text-renderer-shadow-toggle')).first();
    const isChecked = await checkbox.isChecked();
    if (isChecked !== checked) {
      await checkbox.click();
    }
  }

  // =========================================================================
  // SPRITE ANIMATOR ACTIONS
  // =========================================================================
  async ensureSpriteAnimatorComponent() {
    if ((await this.spriteAnimatorSection.count()) === 0 || !(await this.spriteAnimatorSection.isVisible())) {
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
    if ((await this.shapeRendererSection.count()) === 0 || !(await this.shapeRendererSection.isVisible())) {
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
    if ((await this.tilemapSection.count()) === 0 || !(await this.tilemapSection.isVisible())) {
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
    if ((await this.colliderSection.count()) === 0 || !(await this.colliderSection.isVisible())) {
      await this.addComponent('Collider');
      await expect(this.colliderSection).toBeVisible();
    }
  }

  async setColliderType(typeLabel) {
    await this.controls.selectOption('collider-type-select', typeLabel, this.colliderSection);
  }

  async toggleColliderAutoFit(checked) {
    const checkbox = this.page.getByTestId('collider-autofit-toggle').locator('input[type="checkbox"]').or(this.page.getByTestId('collider-autofit-toggle')).first();
    const isChecked = await checkbox.isChecked();
    if (isChecked !== checked) {
      await checkbox.click();
    }
  }

  // =========================================================================
  // PHYSICS ACTIONS
  // =========================================================================
  async ensurePhysicsComponent() {
    if ((await this.physicsSection.count()) === 0 || !(await this.physicsSection.isVisible())) {
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