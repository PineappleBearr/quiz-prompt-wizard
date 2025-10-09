import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Transform } from "@/types/question";

interface ThreeSceneProps {
  transforms: Transform[];
  shape?: string;
  width?: number;
  height?: number;
}

export const ThreeScene = ({ transforms, shape = "digit1", width = 400, height = 300 }: ThreeSceneProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(5, 4, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true 
    });
    renderer.setSize(width, height);

    // Add grid
    const gridSize = 4;
    const gridDivisions = 8;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x888888, 0xcccccc);
    scene.add(gridHelper);

    // Add axes
    const axesHelper = new THREE.AxesHelper(3);
    scene.add(axesHelper);

    // Add axis labels (simplified)
    const createAxisLabel = (text: string, position: THREE.Vector3, color: number) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 64;
      canvas.height = 64;
      context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      context.font = 'Bold 48px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 32, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.scale.set(0.5, 0.5, 1);
      return sprite;
    };

    scene.add(createAxisLabel('x', new THREE.Vector3(3.2, 0, 0), 0xff0000));
    scene.add(createAxisLabel('y', new THREE.Vector3(0, 3.2, 0), 0x00ff00));
    scene.add(createAxisLabel('z', new THREE.Vector3(0, 0, 3.2), 0x0000ff));

    // Create shape geometry
    let geometry: THREE.BufferGeometry;
    if (shape === "digit1") {
      // Create a "1" shape
      const shape1 = new THREE.Shape();
      shape1.moveTo(0.4, 0);
      shape1.lineTo(0.6, 0);
      shape1.lineTo(0.6, 1.5);
      shape1.lineTo(0.4, 1.5);
      shape1.lineTo(0.4, 0);
      
      const extrudeSettings = { depth: 0.1, bevelEnabled: false };
      geometry = new THREE.ExtrudeGeometry(shape1, extrudeSettings);
    } else {
      // Fallback to box
      geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    }

    const material = new THREE.MeshPhongMaterial({ 
      color: 0xff3333,
      side: THREE.DoubleSide 
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Apply transforms (OpenGL format: glRotatef(angle, x, y, z))
    transforms.forEach(transform => {
      if (transform.type === "translate") {
        mesh.position.x += transform.params[0] || 0;
        mesh.position.y += transform.params[1] || 0;
        mesh.position.z += transform.params[2] || 0;
      } else if (transform.type === "rotate") {
        const angle = (transform.params[0] || 0) * Math.PI / 180;
        const axisX = transform.params[1] || 0;
        const axisY = transform.params[2] || 0;
        const axisZ = transform.params[3] || 0;
        
        // Rotate around the specified axis
        if (axisX !== 0) mesh.rotation.x += angle * axisX;
        if (axisY !== 0) mesh.rotation.y += angle * axisY;
        if (axisZ !== 0) mesh.rotation.z += angle * axisZ;
      }
    });

    scene.add(mesh);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    renderer.render(scene, camera);

    return () => {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [transforms, shape, width, height]);

  return <canvas ref={canvasRef} className="border border-border rounded" />;
};
