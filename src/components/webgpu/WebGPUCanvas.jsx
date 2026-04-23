import * as THREE from "three/webgpu";
import { Canvas, extend } from "@react-three/fiber";

extend(THREE);

export default function WebGPUCanvas(props) {
  return (
    <Canvas
      {...props}
      flat
      gl={async (canvasProps) => {
        const renderer = new THREE.WebGPURenderer(canvasProps);
        await renderer.init();

        // Some three/webgpu builds expose only render(), while the
        // PostProcessing helper expects renderAsync().
        if (typeof renderer.renderAsync !== "function" && typeof renderer.render === "function") {
          renderer.renderAsync = async (...args) => {
            renderer.render(...args);
          };
        }

        return renderer;
      }}
    >
      {props.children}
    </Canvas>
  );
}
