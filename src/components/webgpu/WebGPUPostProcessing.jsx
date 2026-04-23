import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { pass } from "three/tsl";
import * as THREE from "three/webgpu";

export default function WebGPUPostProcessing({ strength = 1, threshold = 1 }) {
  const { gl, scene, camera } = useThree();

  const renderer = useMemo(() => {
    const postProcessing = new THREE.PostProcessing(gl);
    const scenePass = pass(scene, camera);
    const scenePassColor = scenePass.getTextureNode("output");
    const bloomPass = bloom(scenePassColor, strength, 0.5, threshold);

    postProcessing.outputNode = scenePassColor.add(bloomPass);
    return postProcessing;
  }, [camera, gl, scene, strength, threshold]);

  useFrame(() => {
    if (typeof renderer.renderAsync === "function") {
      renderer.renderAsync();
      return;
    }

    if (typeof renderer.render === "function") {
      renderer.render();
    }
  }, 1);

  return null;
}
