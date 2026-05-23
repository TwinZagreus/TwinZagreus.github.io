import { gsap } from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import { PROJECT_COLOR_MAP, PROJECT_COLORS, PROJECT_COLOR_SEQUENCE } from "../lib/theme";
import * as THREE from "three";


const AREA_FONT_FAMILY = '"AreaKilometer50", "Segoe UI", sans-serif';
const AREA_FONT_URL = "/font/AreaKilometer50-gxmEq.otf";
let areaFontPromise = null;

export const LOADING_OVERLAY_CONFIG = Object.freeze({
  backgroundColor: PROJECT_COLOR_MAP.coral100, // Loading 全屏背景色
  logoText: "TwinZ", // Logo 文案
  logoColor: PROJECT_COLOR_MAP.ink950, // Twin 文字颜色
  animatedLetterColor: PROJECT_COLOR_MAP.coral, // Z 红框颜色
  zAssetUrl: "/img/final-single.svg", // Z 使用的 SVG 动效资源
  zAssetHeightScale: 1.12, // SVG Z 相对 zLogoSize 的高度比例
  logoSize: 104, // 通用字号兜底值
  twinLogoSize: 104, // Twin 的字号
  zLogoSize: 90, // Z 的字号
  logoGap: -12, // Twin 和 Z 之间的水平间距
  twinPaddingXScale: 0.22, // Twin 贴图左右留白比例
  twinPaddingYScale: 0.1, // Twin 贴图上下留白比例
  zPaddingXScale: 0.34, // Z 红框左右留白比例
  zPaddingTopScale: 0.1, // Z 红框上边距比例
  zPaddingBottomScale: 0.01, // Z 红框下边距比例
  zCornerRadiusScale: 0.22, // Z 红框圆角比例
  zOffsetY: 10, // Z 整体上下偏移，正数向上
  zColorLoopDuration: 1.4, // 保留字段，当前未参与动画
  sliceCount: 10, // 背景切片数量
  sliceSkewAngle: 10, // 每个切片的斜切角度
  transitionDuration: 0.5, // 单轮切片下落的总时长基准
  sliceStagger: 0.035, // 切片从左到右的错峰延迟
  sliceFallDistance: 1200, // 切片下落距离
  logoDisappearDuration: 0.2, // 切片结束后 Twin 收拢消失时长
  zFadeDuration: 0.8, // 最后 Z 单独渐隐时长
  easing: "power3.in", // 切片下落缓动
});

function ensureAreaKilometerFont() {
  if (typeof window === "undefined" || typeof FontFace === "undefined") {
    return Promise.resolve();
  }

  if (!areaFontPromise) {
    const font = new FontFace("AreaKilometer50", `url("${AREA_FONT_URL}") format("opentype")`);
    areaFontPromise = font.load().then((loadedFace) => {
      document.fonts.add(loadedFace);
      return document.fonts.load(`400 120px ${AREA_FONT_FAMILY}`);
    });
  }

  return areaFontPromise;
}

function getViewportFromContainer(container) {
  const visualViewport = window.visualViewport;
  const rect = container?.getBoundingClientRect?.();
  if (rect && rect.width > 0 && rect.height > 0) {
    return {
      height: rect.height,
      left: rect.left,
      top: rect.top,
      visualViewport: visualViewport
        ? {
            height: visualViewport.height,
            offsetLeft: visualViewport.offsetLeft,
            offsetTop: visualViewport.offsetTop,
            scale: visualViewport.scale,
            width: visualViewport.width,
          }
        : null,
      width: rect.width,
    };
  }

  return {
    height: window.innerHeight,
    left: 0,
    top: 0,
    visualViewport: visualViewport
      ? {
          height: visualViewport.height,
          offsetLeft: visualViewport.offsetLeft,
          offsetTop: visualViewport.offsetTop,
          scale: visualViewport.scale,
          width: visualViewport.width,
        }
      : null,
    width: window.innerWidth,
  };
}

function worldToScreenPoint(viewport, x, y) {
  return {
    x: x + viewport.width / 2,
    y: viewport.height / 2 - y,
  };
}

function makeTextCanvas({
  color,
  fontSize,
  text,
  paddingXScale = LOADING_OVERLAY_CONFIG.twinPaddingXScale,
  paddingYScale = LOADING_OVERLAY_CONFIG.twinPaddingYScale,
}) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const font = `400 ${fontSize}px ${AREA_FONT_FAMILY}`;
  const paddingX = Math.ceil(fontSize * paddingXScale);
  const paddingY = Math.ceil(fontSize * paddingYScale);

  context.font = font;
  const metrics = context.measureText(text);
  const width = Math.ceil(metrics.width + paddingX * 2);
  const height = Math.ceil(fontSize * 1.24 + paddingY * 2);

  canvas.width = width;
  canvas.height = height;

  const drawContext = canvas.getContext("2d");
  drawContext.clearRect(0, 0, width, height);
  drawContext.font = font;
  drawContext.textAlign = "left";
  drawContext.textBaseline = "middle";
  drawContext.fillStyle = color;
  drawContext.fillText(text, paddingX, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  return {
    bounds: getCanvasAlphaBounds(canvas),
    canvas,
    texture,
  };
}

function drawRoundedRect(context, x, y, width, height, radius) {
  const nextRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + nextRadius, y);
  context.lineTo(x + width - nextRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + nextRadius);
  context.lineTo(x + width, y + height - nextRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - nextRadius, y + height);
  context.lineTo(x + nextRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - nextRadius);
  context.lineTo(x, y + nextRadius);
  context.quadraticCurveTo(x, y, x + nextRadius, y);
  context.closePath();
}

function getCanvasAlphaBounds(canvas) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const { width, height } = canvas;
  const pixels = context.getImageData(0, 0, width, height).data;
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha === 0)
        continue;

      if (x < left)
        left = x;
      if (x > right)
        right = x;
      if (y < top)
        top = y;
      if (y > bottom)
        bottom = y;
    }
  }

  if (right < left || bottom < top) {
    return {
      bottom: height,
      left: 0,
      right: width,
      top: 0,
    };
  }

  return {
    bottom: bottom + 1,
    left,
    right: right + 1,
    top,
  };
}

function getCanvasAlphaCentroid(canvas) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const { width, height } = canvas;
  const pixels = context.getImageData(0, 0, width, height).data;
  let weightSum = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha === 0)
        continue;

      weightSum += alpha;
      weightedX += (x + 0.5) * alpha;
      weightedY += (y + 0.5) * alpha;
    }
  }

  if (weightSum === 0) {
    return {
      x: width / 2,
      y: height / 2,
    };
  }

  return {
    x: weightedX / weightSum,
    y: weightedY / weightSum,
  };
}

function getCompositeLogoBounds({
  twinCanvas,
  twinX,
  twinY,
  twinClipRight,
  zCanvas,
  zX,
  zY,
}) {
  const minX = Math.floor(Math.min(twinX - twinCanvas.width / 2, zX - zCanvas.width / 2));
  const maxX = Math.ceil(Math.max(twinX + twinCanvas.width / 2, zX + zCanvas.width / 2));
  const minY = Math.floor(Math.min(twinY - twinCanvas.height / 2, zY - zCanvas.height / 2));
  const maxY = Math.ceil(Math.max(twinY + twinCanvas.height / 2, zY + zCanvas.height / 2));

  const compositeCanvas = document.createElement("canvas");
  compositeCanvas.width = Math.max(1, maxX - minX);
  compositeCanvas.height = Math.max(1, maxY - minY);

  const context = compositeCanvas.getContext("2d");
  const twinLeft = twinX - twinCanvas.width / 2 - minX;
  const twinTop = maxY - (twinY + twinCanvas.height / 2);
  const zLeft = zX - zCanvas.width / 2 - minX;
  const zTop = maxY - (zY + zCanvas.height / 2);

  context.save();
  context.beginPath();
  context.rect(0, 0, Math.max(0, twinClipRight - minX), compositeCanvas.height);
  context.clip();
  context.drawImage(twinCanvas, twinLeft, twinTop);
  context.restore();
  context.drawImage(zCanvas, zLeft, zTop);

  const bounds = getCanvasAlphaBounds(compositeCanvas);
  const centroid = getCanvasAlphaCentroid(compositeCanvas);

  return {
    bottom: maxY - bounds.bottom,
    centroid: {
      x: minX + centroid.x,
      y: maxY - centroid.y,
    },
    left: minX + bounds.left,
    right: minX + bounds.right,
    top: maxY - bounds.top,
  };
}

function makeKnockoutBadgeCanvas({
  badgeColor,
  fontSize,
  text,
  paddingXScale = LOADING_OVERLAY_CONFIG.zPaddingXScale,
  paddingTopScale = LOADING_OVERLAY_CONFIG.zPaddingTopScale,
  paddingBottomScale = LOADING_OVERLAY_CONFIG.zPaddingBottomScale,
  radiusScale = LOADING_OVERLAY_CONFIG.zCornerRadiusScale,
}) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const font = `400 ${fontSize}px ${AREA_FONT_FAMILY}`;
  const paddingX = Math.ceil(fontSize * paddingXScale);
  const paddingTop = Math.ceil(fontSize * paddingTopScale);
  const paddingBottom = Math.ceil(fontSize * paddingBottomScale);
  const radius = Math.ceil(fontSize * radiusScale);

  context.font = font;
  const metrics = context.measureText(text);
  const width = Math.ceil(metrics.width + paddingX * 2);
  const innerHeight = Math.ceil(fontSize * 0.94);
  const height = innerHeight + paddingTop + paddingBottom;

  canvas.width = width;
  canvas.height = height;

  const drawContext = canvas.getContext("2d");
  drawContext.clearRect(0, 0, width, height);
  drawContext.fillStyle = badgeColor;
  drawRoundedRect(drawContext, 0, 0, width, height, radius);
  drawContext.fill();

  drawContext.globalCompositeOperation = "destination-out";
  drawContext.font = font;
  drawContext.textAlign = "left";
  drawContext.textBaseline = "middle";
  drawContext.fillStyle = "#000000";
  drawContext.fillText(text, paddingX, paddingTop + innerHeight / 2);
  drawContext.globalCompositeOperation = "source-over";

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  return {
    bounds: getCanvasAlphaBounds(canvas),
    canvas,
    texture,
  };
}

class LoadingOverlayScene {
  constructor({ config, container, onFinish }) {
    this.config = config;
    this.activeConfig = config;
    this.container = container;
    this.onFinish = onFinish;

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera();
    this.twinClipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 999999);
    this.logoAssets = null;
    this.zAssetSize = null;
    this.zAssetUrl = null;
    this.zDomImage = null;
    this.slices = [];
    this.sliceGeometries = [];
    this.sliceMaterials = [];
    this.exitTimeline = null;
    this.rafId = 0;
    this.isDisposed = false;
    this.isExiting = false;

    this.handleResize = this.handleResize.bind(this);
    this.render = this.render.bind(this);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.localClippingEnabled = true;
    this.container.style.backgroundColor = this.activeConfig.backgroundColor;
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.inset = "0";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.zIndex = "1";
    this.container.appendChild(this.renderer.domElement);

    this.createZDomAsset();
    this.buildScene();
    this.handleResize();
    window.addEventListener("resize", this.handleResize);
    this.render();
    ensureAreaKilometerFont().then(() => {
      if (!this.isDisposed) {
        this.rebuildLogo();
      }
    });
  }

  getViewport() {
    return getViewportFromContainer(this.container);
  }

  buildScene() {
    this.sliceGroup = new THREE.Group();
    this.logoGroup = new THREE.Group();
    this.scene.add(this.sliceGroup);
    this.scene.add(this.logoGroup);
    this.rebuildSlices();
    this.rebuildLogo();
  }

  createZDomAsset() {
    const url = this.activeConfig.zAssetUrl;
    if (!url)
      return;

    this.zAssetUrl = url;
    this.zAssetSize = {
      height: 602,
      width: 504.194,
    };

    const image = document.createElement("img");
    image.alt = "";
    image.decoding = "async";
    image.draggable = false;
    image.src = url;
    image.style.position = "absolute";
    image.style.left = "0";
    image.style.top = "0";
    image.style.zIndex = "2";
    image.style.pointerEvents = "none";
    image.style.transformOrigin = "center center";
    image.style.willChange = "opacity, transform";
    image.style.opacity = "0";

    image.onload = () => {
      if (this.isDisposed || this.zAssetUrl !== url)
        return;

      this.zAssetSize = {
        height: image.naturalHeight || 602,
        width: image.naturalWidth || 504.194,
      };
      this.rebuildLogo();
    };
    image.onerror = (error) => {
      console.warn("[ThreeLoadingOverlay] Failed to load Z SVG asset", error);
    };

    this.zDomImage = image;
    this.container.appendChild(image);
    console.info("[ThreeLoadingOverlay] Z SVG DOM asset mounted", url);
  }

  clearSlices() {
    this.slices.forEach((slice) => this.sliceGroup.remove(slice));
    this.sliceGeometries.forEach((geometry) => geometry.dispose());
    this.sliceMaterials.forEach((material) => material.dispose());
    this.slices = [];
    this.sliceGeometries = [];
    this.sliceMaterials = [];
  }

  rebuildSlices() {
    this.clearSlices();

    const viewport = this.getViewport();
    const sliceWidth = viewport.width / this.activeConfig.sliceCount;
    const verticalOverscan = 8;
    const skewOffset =
      Math.tan(THREE.MathUtils.degToRad(this.activeConfig.sliceSkewAngle)) * viewport.height;
    const overscan = Math.abs(skewOffset) + 2;

    for (let index = 0; index < this.activeConfig.sliceCount; index += 1) {
      const x0 = -viewport.width / 2 + index * sliceWidth;
      const x1 = x0 + sliceWidth;
      const shape = new THREE.Shape();

      shape.moveTo(x0 - overscan, viewport.height / 2 + verticalOverscan);
      shape.lineTo(x1 + overscan, viewport.height / 2 + verticalOverscan);
      shape.lineTo(x1 + overscan - skewOffset, -viewport.height / 2 - verticalOverscan);
      shape.lineTo(x0 - overscan - skewOffset, -viewport.height / 2 - verticalOverscan);
      shape.closePath();

      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.activeConfig.backgroundColor),
        transparent: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, 0);
      mesh.rotation.set(0, 0, 0);

      this.sliceGeometries.push(geometry);
      this.sliceMaterials.push(material);
      this.slices.push(mesh);
      this.sliceGroup.add(mesh);
    }
  }

  rebuildLogo() {
    if (this.logoAssets) {
      this.logoGroup.remove(this.logoAssets.twinMesh);
      this.logoGroup.remove(this.logoAssets.zMesh);
      this.logoAssets.twinMesh.geometry.dispose();
      this.logoAssets.zMesh.geometry.dispose();
      this.logoAssets.twinMaterial.dispose();
      this.logoAssets.zMaterial.dispose();
      this.logoAssets.twinTexture.dispose();
      this.logoAssets.zTexture.dispose();
    }

    const baseText = this.activeConfig.logoText.slice(0, -1) || "Twin";
    const animatedText = this.activeConfig.logoText.slice(-1) || "Z";
    const twinFontSize = this.activeConfig.twinLogoSize ?? this.activeConfig.logoSize;
    const zFontSize = this.activeConfig.zLogoSize ?? this.activeConfig.logoSize;
    const twinCanvas = makeTextCanvas({
      color: this.activeConfig.logoColor,
      fontSize: twinFontSize,
      paddingXScale: this.activeConfig.twinPaddingXScale,
      paddingYScale: this.activeConfig.twinPaddingYScale,
      text: baseText,
    });
    const useZDomAsset = Boolean(this.activeConfig.zAssetUrl && this.zAssetSize);
    let zCanvas;
    if (useZDomAsset) {
      const zHeight = zFontSize * (this.activeConfig.zAssetHeightScale ?? 1);
      const zWidth = zHeight * (this.zAssetSize.width / this.zAssetSize.height);
      const texture = new THREE.CanvasTexture(makeLayoutBoundsCanvas(zWidth, zHeight));
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      zCanvas = {
        bounds: {
          bottom: zHeight,
          left: 0,
          right: zWidth,
          top: 0,
        },
        canvas: makeLayoutBoundsCanvas(zWidth, zHeight),
        isSvgAsset: true,
        texture,
      };
    } else {
      zCanvas = makeKnockoutBadgeCanvas({
        badgeColor: this.activeConfig.animatedLetterColor,
        fontSize: zFontSize,
        paddingXScale: this.activeConfig.zPaddingXScale,
        paddingTopScale: this.activeConfig.zPaddingTopScale,
        paddingBottomScale: this.activeConfig.zPaddingBottomScale,
        radiusScale: this.activeConfig.zCornerRadiusScale,
        text: animatedText,
      });
    }

    const twinMaterial = new THREE.MeshBasicMaterial({
      clippingPlanes: [this.twinClipPlane],
      map: twinCanvas.texture,
      transparent: true,
      opacity: 1,
    });
    const zMaterial = new THREE.MeshBasicMaterial({
      map: zCanvas.texture,
      transparent: true,
      opacity: zCanvas.isSvgAsset ? 0 : 1,
    });

    const twinMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(twinCanvas.canvas.width, twinCanvas.canvas.height),
      twinMaterial,
    );
    const zMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(zCanvas.canvas.width, zCanvas.canvas.height),
      zMaterial,
    );

    const gap = this.activeConfig.logoGap ?? Math.max(2, Math.min(twinFontSize, zFontSize) * 0.01);
    const totalWidth = twinCanvas.canvas.width + zCanvas.canvas.width + gap;
    twinMesh.position.x = -totalWidth / 2 + twinCanvas.canvas.width / 2;
    zMesh.position.x = totalWidth / 2 - zCanvas.canvas.width / 2;
    zMesh.position.y = this.activeConfig.zOffsetY ?? 0;
    const badgeLeftEdge = zMesh.position.x - zCanvas.canvas.width / 2;

    const compositeBounds = getCompositeLogoBounds({
      twinCanvas: twinCanvas.canvas,
      twinClipRight: badgeLeftEdge,
      twinX: twinMesh.position.x,
      twinY: twinMesh.position.y,
      zCanvas: zCanvas.canvas,
      zX: zMesh.position.x,
      zY: zMesh.position.y,
    });
    const centerX = compositeBounds.centroid.x;
    const centerY = compositeBounds.centroid.y;

    twinMesh.position.x -= centerX;
    twinMesh.position.y -= centerY;
    zMesh.position.x -= centerX;
    zMesh.position.y -= centerY;

    const finalCompositeBounds = {
      bottom: compositeBounds.bottom - centerY,
      centroid: {
        x: compositeBounds.centroid.x - centerX,
        y: compositeBounds.centroid.y - centerY,
      },
      left: compositeBounds.left - centerX,
      right: compositeBounds.right - centerX,
      top: compositeBounds.top - centerY,
    };

    this.logoGroup.add(twinMesh);
    this.logoGroup.add(zMesh);

    this.logoAssets = {
      animatedText,
      gap,
      twinStartX: twinMesh.position.x,
      twinMesh,
      twinMaterial,
      twinTexture: twinCanvas.texture,
      twinWidth: twinCanvas.canvas.width,
      zStartX: zMesh.position.x,
      zUsesSvgAsset: Boolean(zCanvas.isSvgAsset),
      zMesh,
      zMaterial,
      zTexture: zCanvas.texture,
      zWidth: zCanvas.canvas.width,
    };
    this.syncZDomImage();

    this.logLogoScreenPosition({
      compositeBounds: finalCompositeBounds,
      twinMesh,
      viewport: this.getViewport(),
      zMesh,
    });
  }

  logLogoScreenPosition({ viewport, twinMesh, zMesh, compositeBounds }) {
    const twinCenter = worldToScreenPoint(viewport, twinMesh.position.x, twinMesh.position.y);
    const zCenter = worldToScreenPoint(viewport, zMesh.position.x, zMesh.position.y);
    const compositeBoundsCenterWorld = {
      x: (compositeBounds.left + compositeBounds.right) / 2,
      y: (compositeBounds.top + compositeBounds.bottom) / 2,
    };
    const compositeBoundsCenter = worldToScreenPoint(
      viewport,
      compositeBoundsCenterWorld.x,
      compositeBoundsCenterWorld.y,
    );
    const compositeCentroid = worldToScreenPoint(
      viewport,
      compositeBounds.centroid.x,
      compositeBounds.centroid.y,
    );
    const compositeBoundsScreen = {
      bottom: viewport.height / 2 - compositeBounds.bottom,
      left: compositeBounds.left + viewport.width / 2,
      right: compositeBounds.right + viewport.width / 2,
      top: viewport.height / 2 - compositeBounds.top,
    };
    const configSnapshot = {
      logoGap: this.activeConfig.logoGap,
      twinLogoSize: this.activeConfig.twinLogoSize ?? this.activeConfig.logoSize,
      zLogoSize: this.activeConfig.zLogoSize ?? this.activeConfig.logoSize,
      zOffsetY: this.activeConfig.zOffsetY,
    };

    console.groupCollapsed("[ThreeLoadingOverlay] Logo screen position");
    console.log("viewport", viewport);
    console.log("visualViewport", viewport.visualViewport);
    console.table({
      compositeBoundsCenter,
      compositeCentroid,
      twinCenter,
      zCenter,
    });
    console.log("compositeBounds", compositeBounds);
    console.log("compositeBoundsScreen", compositeBoundsScreen);
    console.log("configSnapshot", configSnapshot);
    console.groupEnd();
  }

  syncZDomImage() {
    if (!this.zDomImage)
      return;

    if (!this.logoAssets?.zUsesSvgAsset) {
      this.zDomImage.style.opacity = "0";
      return;
    }

    const viewport = this.getViewport();
    const { zMesh, zWidth } = this.logoAssets;
    const zHeight = zMesh.geometry.parameters.height;
    const left = viewport.width / 2 + zMesh.position.x - zWidth / 2;
    const top = viewport.height / 2 - zMesh.position.y - zHeight / 2;

    this.zDomImage.style.width = `${zWidth}px`;
    this.zDomImage.style.height = `${zHeight}px`;
    this.zDomImage.style.transform = `translate3d(${left}px, ${top}px, 0)`;

    if (!this.isExiting && this.zDomImage.style.opacity === "0") {
      this.zDomImage.style.opacity = "1";
    }
  }

  finish() {
    if (this.isDisposed || this.isExiting)
      return;

    this.isExiting = true;
    this.container.style.backgroundColor = "transparent";
    if (!this.logoAssets) {
      this.dispose();
      this.onFinish();
      return;
    }

    const singleSliceDuration = Math.max(
      0.18,
      this.activeConfig.transitionDuration - this.activeConfig.sliceStagger * (this.slices.length - 1),
    );
    const logoDisappearDuration = Math.max(0.12, this.activeConfig.logoDisappearDuration);
    const zPhaseDuration = Math.max(0.08, this.activeConfig.zFadeDuration ?? 0.16);
    const twinPhaseDuration = logoDisappearDuration;
    const targetCenterX = 0;
    const slicesStartAt = 0;
    const slicesEndAt =
      slicesStartAt
      + this.activeConfig.sliceStagger * Math.max(0, this.slices.length - 1)
      + singleSliceDuration;

    this.exitTimeline = gsap.timeline({
      onComplete: () => {
        this.dispose();
        this.onFinish();
      },
    });

    this.slices.forEach((slice, index) => {
      const rotationTarget = THREE.MathUtils.randFloatSpread(0.18);
      const startAt = slicesStartAt + index * this.activeConfig.sliceStagger;

      this.exitTimeline.to(
        slice.position,
        {
          duration: singleSliceDuration,
          ease: this.activeConfig.easing,
          y: -this.activeConfig.sliceFallDistance,
        },
        startAt,
      );

      this.exitTimeline.to(
        slice.rotation,
        {
          duration: singleSliceDuration,
          ease: "power2.in",
          z: rotationTarget,
        },
        startAt,
      );
    });

    this.exitTimeline.set(
      this.slices,
      {
        visible: false,
      },
      slicesEndAt + 0.02,
    );

    this.exitTimeline.to(
      this.logoAssets.twinMesh.position,
      {
        duration: twinPhaseDuration,
        ease: "power2.inOut",
        x: targetCenterX,
      },
      slicesEndAt,
    );

    this.exitTimeline.to(
      this.logoAssets.zMesh.position,
      {
        duration: twinPhaseDuration,
        ease: "power2.inOut",
        x: targetCenterX,
      },
      slicesEndAt,
    );

    this.exitTimeline.to(
      this.logoAssets.twinMaterial,
      {
        duration: twinPhaseDuration * 0.6,
        ease: "power2.in",
        opacity: 0,
      },
      slicesEndAt + twinPhaseDuration * 0.34,
    );

    this.exitTimeline.to(
      this.logoAssets.twinMesh.scale,
      {
        duration: twinPhaseDuration * 0.68,
        ease: "power2.in",
        x: 0.12,
        y: 0.92,
      },
      slicesEndAt + twinPhaseDuration * 0.1,
    );

    this.exitTimeline.to(
      this.logoAssets.zMaterial,
      {
        duration: zPhaseDuration,
        ease: "power2.out",
        opacity: 0,
      },
      slicesEndAt + twinPhaseDuration,
    );

    if (this.zDomImage && this.logoAssets.zUsesSvgAsset) {
      this.exitTimeline.to(
        this.zDomImage,
        {
          duration: zPhaseDuration,
          ease: "power2.out",
          opacity: 0,
        },
        slicesEndAt + twinPhaseDuration,
      );
    }
  }

  handleResize() {
    const viewport = this.getViewport();
    this.activeConfig = this.config;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(viewport.width, viewport.height, false);
    this.camera.left = -viewport.width / 2;
    this.camera.right = viewport.width / 2;
    this.camera.top = viewport.height / 2;
    this.camera.bottom = -viewport.height / 2;
    this.camera.near = -100;
    this.camera.far = 100;
    this.camera.position.z = 10;
    this.camera.updateProjectionMatrix();

    this.rebuildSlices();
    this.rebuildLogo();
  }

  render() {
    if (this.isDisposed)
      return;

    if (this.logoAssets) {
      const badgeLeftEdge = this.logoAssets.zMesh.position.x - this.logoAssets.zWidth / 2;
      this.twinClipPlane.constant = badgeLeftEdge;
      if (this.logoAssets.zUsesSvgAsset) {
        this.syncZDomImage();
      }
    }

    this.rafId = window.requestAnimationFrame(this.render);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.isDisposed)
      return;

    this.isDisposed = true;
    window.cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this.handleResize);
    this.exitTimeline?.kill();

    this.clearSlices();

    if (this.logoAssets) {
      this.logoGroup.remove(this.logoAssets.twinMesh);
      this.logoGroup.remove(this.logoAssets.zMesh);
      this.logoAssets.twinMesh.geometry.dispose();
      this.logoAssets.zMesh.geometry.dispose();
      this.logoAssets.twinMaterial.dispose();
      this.logoAssets.zMaterial.dispose();
      this.logoAssets.twinTexture.dispose();
      this.logoAssets.zTexture.dispose();
      this.logoAssets = null;
    }

    this.zDomImage?.remove();
    this.zDomImage = null;

    this.scene.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

export default function ThreeLoadingOverlay({
  config = LOADING_OVERLAY_CONFIG,
  isReady,
  onMounted,
  onExited,
}) {
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  const mergedConfig = useMemo(
    () => ({
      ...LOADING_OVERLAY_CONFIG,
      ...config,
    }),
    [config],
  );

  useEffect(() => {
    if (!containerRef.current)
      return undefined;

    overlayRef.current = new LoadingOverlayScene({
      config: mergedConfig,
      container: containerRef.current,
      onFinish: () => {
        setIsVisible(false);
        onExited?.();
      },
    });
    onMounted?.();

    return () => {
      overlayRef.current?.dispose();
      overlayRef.current = null;
    };
  }, [mergedConfig, onExited, onMounted]);

  useEffect(() => {
    if (!isReady)
      return;
    overlayRef.current?.finish();
  }, [isReady]);

  if (!isVisible)
    return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      data-initial-loading-overlay="true"
      ref={containerRef}
    />
  );
}

function makeLayoutBoundsCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  const context = canvas.getContext("2d");
  context.fillStyle = "#000000";
  context.fillRect(0, 0, canvas.width, canvas.height);

  return canvas;
}
