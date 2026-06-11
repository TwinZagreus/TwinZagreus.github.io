import { gsap } from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import { PROJECT_COLOR_MAP, PROJECT_COLORS, PROJECT_COLOR_SEQUENCE } from "../lib/theme";
import * as THREE from "three";


const tintedSvgCache = new Map();
const DEBUG_LOGO_LAYOUT = false;

export const LOADING_OVERLAY_CONFIG = Object.freeze({
  backgroundColor: PROJECT_COLOR_MAP.coral100,
  logoText: "TwinZ",
  animatedLetterColor: PROJECT_COLOR_MAP.coral,
  zAssetUrl: "/img/final-single.svg",
  zAssetHeightScale: 1.12,
  logoSize: 104,
  zLogoSize: 90,
  zPaddingXScale: 0.34,
  zPaddingTopScale: 0.1,
  zPaddingBottomScale: 0.01,
  zCornerRadiusScale: 0.22,
  zOffsetY: 10,
  sliceCount: 10,
  sliceSkewAngle: 10,
  transitionDuration: 0.5,
  sliceStagger: 0.035,
  sliceFallDistance: 1200,
  zFadeDuration: 0.8,
  easing: "power3.in",
});

function makeSvgDataUrl(svgText) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
}

function tintSvgText(svgText, color) {
  return svgText
    .replaceAll("#000000", color)
    .replaceAll("#F2555A", color)
    .replaceAll("#FF6F61", color);
}

async function getTintedSvgDataUrl(url, color) {
  const cacheKey = `${url}::${color}`;
  if (tintedSvgCache.has(cacheKey)) {
    return tintedSvgCache.get(cacheKey);
  }

  const response = await fetch(url);
  const svgText = await response.text();
  const dataUrl = makeSvgDataUrl(tintSvgText(svgText, color));
  tintedSvgCache.set(cacheKey, dataUrl);
  return dataUrl;
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
    image.style.zIndex = "3";
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
    getTintedSvgDataUrl(url, this.activeConfig.animatedLetterColor)
      .then((dataUrl) => {
        if (this.isDisposed || this.zAssetUrl !== url)
          return;

        image.src = dataUrl;
      })
      .catch((error) => {
        console.warn("[ThreeLoadingOverlay] Failed to tint Z SVG asset", error);
      });
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
      this.logoGroup.remove(this.logoAssets.zMesh);
      this.logoAssets.zMesh.geometry.dispose();
      this.logoAssets.zMaterial.dispose();
      this.logoAssets.zTexture.dispose();
    }

    const zFontSize = this.activeConfig.zLogoSize ?? this.activeConfig.logoSize;
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
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const font = `400 ${zFontSize}px system-ui, -apple-system, sans-serif`;
      const paddingX = Math.ceil(zFontSize * (this.activeConfig.zPaddingXScale ?? 0.34));
      const paddingTop = Math.ceil(zFontSize * (this.activeConfig.zPaddingTopScale ?? 0.1));
      const paddingBottom = Math.ceil(zFontSize * (this.activeConfig.zPaddingBottomScale ?? 0.01));
      const radius = Math.ceil(zFontSize * (this.activeConfig.zCornerRadiusScale ?? 0.22));

      context.font = font;
      const metrics = context.measureText(this.activeConfig.logoText.slice(-1) || "Z");
      const width = Math.ceil(metrics.width + paddingX * 2);
      const innerHeight = Math.ceil(zFontSize * 0.94);
      const height = innerHeight + paddingTop + paddingBottom;

      canvas.width = width;
      canvas.height = height;

      const drawContext = canvas.getContext("2d");
      drawContext.clearRect(0, 0, width, height);
      drawContext.fillStyle = this.activeConfig.animatedLetterColor;

      // Draw rounded rect
      const r = Math.min(radius, width / 2, height / 2);
      drawContext.beginPath();
      drawContext.moveTo(r, 0);
      drawContext.lineTo(width - r, 0);
      drawContext.quadraticCurveTo(width, 0, width, r);
      drawContext.lineTo(width, height - r);
      drawContext.quadraticCurveTo(width, height, width - r, height);
      drawContext.lineTo(r, height);
      drawContext.quadraticCurveTo(0, height, 0, height - r);
      drawContext.lineTo(0, r);
      drawContext.quadraticCurveTo(0, 0, r, 0);
      drawContext.closePath();
      drawContext.fill();

      drawContext.globalCompositeOperation = "destination-out";
      drawContext.font = font;
      drawContext.textAlign = "left";
      drawContext.textBaseline = "middle";
      drawContext.fillStyle = "#000000";
      drawContext.fillText(this.activeConfig.logoText.slice(-1) || "Z", paddingX, paddingTop + innerHeight / 2);
      drawContext.globalCompositeOperation = "source-over";

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      zCanvas = {
        bounds: { bottom: height, left: 0, right: width, top: 0 },
        canvas,
        texture,
      };
    }

    const zMaterial = new THREE.MeshBasicMaterial({
      map: zCanvas.texture,
      transparent: true,
      opacity: zCanvas.isSvgAsset ? 0 : 1,
    });

    const zMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(zCanvas.canvas.width, zCanvas.canvas.height),
      zMaterial,
    );
    zMesh.position.set(0, this.activeConfig.zOffsetY ?? 0, 0);

    this.logoGroup.add(zMesh);

    this.logoAssets = {
      zUsesSvgAsset: Boolean(zCanvas.isSvgAsset),
      zMesh,
      zMaterial,
      zTexture: zCanvas.texture,
      zWidth: zCanvas.canvas.width,
      zHeight: zCanvas.canvas.height,
    };
    this.syncZDomImage();
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
    const zPhaseDuration = Math.max(0.08, this.activeConfig.zFadeDuration ?? 0.16);
    const slicesStartAt = zPhaseDuration;
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

    // Fade out Z
    this.exitTimeline.to(
      this.logoAssets.zMaterial,
      {
        duration: zPhaseDuration,
        ease: "power2.out",
        opacity: 0,
      },
      0,
    );

    if (this.zDomImage && this.logoAssets.zUsesSvgAsset) {
      this.exitTimeline.to(
        this.zDomImage,
        {
          duration: zPhaseDuration,
          ease: "power2.out",
          opacity: 0,
        },
        0,
      );
    }

    // Slices fall
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

    if (this.logoAssets?.zUsesSvgAsset) {
      this.syncZDomImage();
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
      this.logoGroup.remove(this.logoAssets.zMesh);
      this.logoAssets.zMesh.geometry.dispose();
      this.logoAssets.zMaterial.dispose();
      this.logoAssets.zTexture.dispose();
      this.logoAssets = null;
    }

    this.zDomImage?.remove();
    this.zDomImage = null;

    this.scene.remove(this.sliceGroup);
    this.scene.remove(this.logoGroup);
    this.renderer.domElement.remove();
    this.renderer.dispose();
  }
}

export default function ThreeLoadingOverlay({
  config,
  isReady = false,
  onExited,
  onMounted,
}) {
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);
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
    setIsExiting(true);
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
