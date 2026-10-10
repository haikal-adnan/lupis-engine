import { expect } from '@playwright/test';
import { InspectorPage } from '../pages/InspectorPage.js';
import { HierarchyPage } from '../pages/HierarchyPage.js';
import { PopupHelper } from '../helpers/PopupHelper.js';
import { AssetCrudObject } from './assets.js';
import { ScriptCrudObject } from './scripts.js';

export class InspectorCrudObject {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.inspector = new InspectorPage(page);
    this.hierarchy = new HierarchyPage(page);
    this.popup = new PopupHelper(page);
    this.assetCrud = new AssetCrudObject(page);
    this.scriptCrud = new ScriptCrudObject(page);
  }

  // =========================================================================
  // 1. EDITOR PROJECT & 2. EDITOR SCENE (DESELECTED STATE)
  // =========================================================================
  async configureProjectQuickActions({ grid = true, snap = false, rulers = false, uiLayer = true } = {}) {
    await expect(this.inspector.projectSection).toBeVisible();
    if (grid) await this.inspector.toggleProjectGridGuide();
    if (snap) await this.inspector.toggleProjectSnapGrid();
    if (rulers) await this.inspector.toggleProjectRulers();
    if (uiLayer) await this.inspector.toggleProjectUILayer();
  }

  async verifySceneInspector() {
    await expect(this.inspector.sceneSection).toBeVisible();
    const sceneBgPicker = this.page.getByTestId('scene-bg-color-picker');
    await expect(sceneBgPicker).toBeVisible();
  }

  // =========================================================================
  // 3. EDITOR LAYER
  // =========================================================================
  async configureLayer({ name, zIndex, active = true } = {}) {
    await expect(this.inspector.layerSection).toBeVisible();
    if (name) await this.inspector.setLayerName(name);
    if (zIndex !== undefined) await this.inspector.setLayerZIndex(zIndex);
    if (!active) await this.inspector.toggleLayerActive();
  }

  // =========================================================================
  // 4. EDITOR OBJECT
  // =========================================================================
  async configureObjectMetaData({ name, scriptId } = {}) {
    await expect(this.inspector.objectSection).toBeVisible();
    if (name) await this.inspector.setEntityName(name);
    if (scriptId) await this.inspector.setScriptId(scriptId);
  }

  // =========================================================================
  // 5. EDITOR TRANSFORM & 6. EDITOR UI TRANSFORM
  // =========================================================================
  async setupTransform(x, y, rotation = 0) {
    await expect(this.inspector.transformSection).toBeVisible();
    await this.inspector.setPosition(x, y);
    if (rotation !== 0) await this.inspector.setRotation(rotation);
  }

  async setupUITransform(x, y, w, h) {
    await expect(this.inspector.uiTransformSection).toBeVisible();
    await this.inspector.setUIPosition(x, y);
    await this.inspector.setUISize(w, h);
  }

  // =========================================================================
  // 7. EDITOR SPRITE (SPRITE RENDERER)
  // =========================================================================
  async configureSpriteRenderer({
    rect = { x: 0, y: 0, w: 128, h: 128 },
    opacity = 100,
    filterMode = 'Smooth',
    enableSDF = false,
    textureFileName = null,
  } = {}) {
    await this.inspector.ensureSpriteRendererComponent();
    if (rect) await this.inspector.setSpriteSourceRect(rect.x, rect.y, rect.w, rect.h);
    if (opacity !== undefined) await this.inspector.setSpriteOpacity(opacity);
    if (filterMode) await this.inspector.setSpriteFilterMode(filterMode);
    if (enableSDF) await this.inspector.toggleSpriteSDF();

    if (textureFileName) {
      const textureCard = await this.assetCrud.uploadAsset(textureFileName);
      await this.assetCrud.applyToActiveEntity(textureCard, 'Apply to SpriteRenderer');
    }
  }

  // =========================================================================
  // 8. EDITOR SHAPE (SHAPE RENDERER)
  // =========================================================================
  async configureShapeRenderer({ outlineWidth = 1, openEditor = false } = {}) {
    await this.inspector.ensureShapeRendererComponent();
    if (outlineWidth !== undefined) await this.inspector.setShapeOutlineWidth(outlineWidth);
    if (openEditor) await this.inspector.openShapeEditor();
  }

  // =========================================================================
  // 9. EDITOR TEXT (TEXT RENDERER)
  // =========================================================================
  async configureTextRenderer({
    text = 'Sample Text',
    mode = 'Rich Text',
    fontSize = 24,
    align = 'center',
    enableShadow = false,
    fontFileName = null,
  } = {}) {
    await this.inspector.ensureTextRendererComponent();
    await this.inspector.setTextContent(text);
    if (mode) await this.inspector.setTextMode(mode);
    if (fontSize) await this.inspector.setFontSize(fontSize);
    if (align) await this.inspector.setTextAlign(align);
    if (enableShadow) await this.inspector.toggleTextShadow(true);

    if (fontFileName) {
      const fontCard = await this.assetCrud.uploadAsset(fontFileName);
      await this.assetCrud.applyToActiveEntity(fontCard, 'Apply to TextRenderer');
    }
  }

  // =========================================================================
  // 10. EDITOR TILEMAP
  // =========================================================================
  async configureTilemap({ opacity = 100, sampleImageName = null, openEditor = false } = {}) {
    await this.inspector.ensureTilemapComponent();
    if (opacity !== undefined) await this.inspector.setTilemapOpacity(opacity);

    if (sampleImageName) {
      const assetCard = await this.assetCrud.uploadAsset(sampleImageName);
      await this.assetCrud.applyToActiveEntity(assetCard, 'Apply to Tilemap');
    }

    if (openEditor) await this.inspector.openTilemapEditor();
  }

  // =========================================================================
  // 11. EDITOR SCRIPT (SCRIPT CONTROLLER)
  // =========================================================================
  async attachScriptToEntity(entityName, scriptName) {
    await this.inspector.setEntityName(entityName);
    await this.inspector.ensureScriptControllerComponent();
    await this.scriptCrud.createScript(scriptName);
    await this.scriptCrud.attachScriptToEntity(scriptName, entityName);

    const entityNode = this.hierarchy.nodesByText(entityName).first();
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    const dropdownTrigger = this.inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger');
    await expect(dropdownTrigger).toContainText(scriptName);
  }

  // =========================================================================
  // 12. EDITOR COLLIDER & 13. EDITOR PHYSICS
  // =========================================================================
  async setupCollider(typeLabel = 'Trigger (Zone)', autoFit = true) {
    await this.inspector.ensureColliderComponent();
    await this.inspector.setColliderType(typeLabel);
    await this.inspector.toggleColliderAutoFit(autoFit);
  }

  async setupPhysics(bodyType = 'Dynamic (Standard)', mass = 1.0, gravityScale = 1.0) {
    await this.inspector.ensurePhysicsComponent();
    await this.inspector.setPhysicsBodyType(bodyType);
    await this.inspector.setPhysicsMass(mass);
    await this.inspector.setPhysicsGravityScale(gravityScale);
  }

  // =========================================================================
  // 14. EDITOR ANIMATOR (SPRITE ANIMATOR)
  // =========================================================================
  async configureSpriteAnimator({ active = true, sampleImageName = null, openEditor = false } = {}) {
    await this.inspector.ensureSpriteAnimatorComponent();
    if (!active) await this.inspector.toggleAnimatorActive();

    if (sampleImageName) {
      const assetCard = await this.assetCrud.uploadAsset(sampleImageName);
      await this.assetCrud.applyToActiveEntity(assetCard, 'Apply to SpriteRenderer');
    }

    if (openEditor) await this.inspector.openAnimatorEditor();
  }

  // =========================================================================
  // 15. EDITOR AUDIO
  // =========================================================================
  async configureAudioComponent({
    volume = 80,
    pitch = 1.0,
    mute = false,
    autoplay = false,
    loop = false,
    spatial = false,
    persist = false,
    fadeIn,
    fadeOut,
    refDistance,
    maxDistance,
    audioFileName = null,
  } = {}) {
    await this.inspector.ensureAudioComponent();
    await this.inspector.audioSection.scrollIntoViewIfNeeded();

    if (volume !== undefined) await this.inspector.setAudioVolume(volume);
    if (pitch !== undefined) await this.inspector.setAudioPitch(pitch);

    if (mute) await this.inspector.toggleAudioMute();
    if (autoplay) await this.inspector.toggleAudioAutoplay();
    if (loop) await this.inspector.toggleAudioLoop();

    if (persist) {
      await this.inspector.toggleAudioPersist();
      // Verifikasi bahwa Spatial 2D ter-disable saat Persist aktif
      const spatialBtn = this.page.getByTestId('audio-spatial-toggle');
      await expect(spatialBtn).toBeDisabled();
    } else if (spatial) {
      await this.inspector.toggleAudioSpatial();
    }

    if (fadeIn !== undefined) await this.inspector.setAudioFadeIn(fadeIn);
    if (fadeOut !== undefined) await this.inspector.setAudioFadeOut(fadeOut);
    if (refDistance !== undefined && spatial && !persist) await this.inspector.setAudioRefDistance(refDistance);
    if (maxDistance !== undefined && spatial && !persist) await this.inspector.setAudioMaxDistance(maxDistance);

    if (audioFileName) {
      const audioCard = await this.assetCrud.uploadAsset(audioFileName);
      await this.assetCrud.applyToActiveEntity(audioCard, 'Apply to Audio Component');
    }
  }
}