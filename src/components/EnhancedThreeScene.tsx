import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Transform } from "@/types/question";

interface EnhancedThreeSceneProps {
  transforms: Transform[];
  shape?: string;
  width?: number;
  height?: number;
  showInitialState?: boolean;
  showMultipleInstances?: boolean;
  numInstances?: number;
  showAngles?: boolean;
  interactive?: boolean;
}

export const EnhancedThreeScene = ({ 
  transforms, 
  shape = "arrow", 
  width = 400, 
  height = 300, 
  showInitialState = false,
  showMultipleInstances = false,
  numInstances = 3,
  showAngles = true,
  interactive = true
}: EnhancedThreeSceneProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRotating, setIsRotating] = useState(false);
  const mouseDown = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const cameraRotation = useRef({ theta: Math.PI / 6, phi: Math.PI / 4 });

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? 0x1a1f2e : 0xf8f9fb;
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.Fog(bgColor, 15, 25);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const radius = 7;
    camera.position.set(
      radius * Math.sin(cameraRotation.current.phi) * Math.cos(cameraRotation.current.theta),
      radius * Math.cos(cameraRotation.current.phi),
      radius * Math.sin(cameraRotation.current.phi) * Math.sin(cameraRotation.current.theta)
    );
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true,
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Enhanced grid with subtle styling
    const gridSize = 6;
    const gridDivisions = 12;
    const gridColor1 = isDark ? 0x2a3f5f : 0xc8d5e8;
    const gridColor2 = isDark ? 0x1a2a3f : 0xe0e7f0;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, gridColor1, gridColor2);
    gridHelper.material.opacity = 0.4;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Enhanced axes with glow effect
    const createAxisLine = (start: THREE.Vector3, end: THREE.Vector3, color: number) => {
      const material = new THREE.LineBasicMaterial({ 
        color, 
        linewidth: 2,
        transparent: true,
        opacity: 0.9
      });
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const line = new THREE.Line(geometry, material);
      return line;
    };

    scene.add(createAxisLine(new THREE.Vector3(-3, 0, 0), new THREE.Vector3(3, 0, 0), 0xff4466));
    scene.add(createAxisLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 3.5, 0), 0x44ff88));
    scene.add(createAxisLine(new THREE.Vector3(0, 0, -3), new THREE.Vector3(0, 0, 3), 0x4488ff));

    // Enhanced text labels
    const createLabel = (text: string, position: THREE.Vector3, color: number, scale: number = 0.6) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 256;
      canvas.height = 128;
      
      context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      context.font = 'Bold 48px system-ui';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 128, 64);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0.9
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.scale.set(scale, scale / 2, 1);
      return sprite;
    };

    scene.add(createLabel('X', new THREE.Vector3(3.3, 0, 0), 0xff4466));
    scene.add(createLabel('Y', new THREE.Vector3(0, 3.8, 0), 0x44ff88));
    scene.add(createLabel('Z', new THREE.Vector3(0, 0, 3.3), 0x4488ff));

    // Unit markers
    for (let i = -2; i <= 3; i++) {
      if (i !== 0) {
        scene.add(createLabel(i.toString(), new THREE.Vector3(i, -0.25, 0), 0xff4466, 0.35));
        if (i > 0) scene.add(createLabel(i.toString(), new THREE.Vector3(-0.25, i, 0), 0x44ff88, 0.35));
        scene.add(createLabel(i.toString(), new THREE.Vector3(0, -0.25, i), 0x4488ff, 0.35));
      }
    }

    // Angle labels
    if (showAngles) {
      transforms.filter(t => t.type === "rotate").forEach((transform, idx) => {
        const angle = transform.params[0];
        const axisX = transform.params[1];
        const axisY = transform.params[2];
        const axisZ = transform.params[3];
        
        let position = new THREE.Vector3();
        let color = 0x000000;
        
        if (axisX !== 0) {
          position.set(2.5, 2 + idx * 0.6, 0);
          color = 0xff4466;
        } else if (axisY !== 0) {
          position.set(0, 3 + idx * 0.6, 0);
          color = 0x44ff88;
        } else if (axisZ !== 0) {
          position.set(0, 2 + idx * 0.6, 2.5);
          color = 0x4488ff;
        }
        
        scene.add(createLabel(`${angle}°`, position, color, 0.8));
      });
    }

    // Enhanced shape geometry
    const createShapeGeometry = (): THREE.BufferGeometry => {
      if (shape === "arrow") {
        const shapeArrow = new THREE.Shape();
        shapeArrow.moveTo(0.2, 0);
        shapeArrow.lineTo(0.5, 0);
        shapeArrow.lineTo(0.5, 1.0);
        shapeArrow.lineTo(0.9, 1.0);
        shapeArrow.lineTo(0.35, 1.6);
        shapeArrow.lineTo(-0.2, 1.0);
        shapeArrow.lineTo(0.2, 1.0);
        shapeArrow.lineTo(0.2, 0);
        return new THREE.ExtrudeGeometry(shapeArrow, { depth: 0.15, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 });
      } else if (shape === "wedge") {
        const shapeWedge = new THREE.Shape();
        shapeWedge.moveTo(0, 0);
        shapeWedge.lineTo(1.2, 0);
        shapeWedge.lineTo(1.2, 0.3);
        shapeWedge.lineTo(0.3, 1.5);
        shapeWedge.lineTo(0, 1.5);
        shapeWedge.lineTo(0, 0);
        return new THREE.ExtrudeGeometry(shapeWedge, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 });
      } else if (shape === "flag") {
        const shapeFlag = new THREE.Shape();
        shapeFlag.moveTo(0, 0);
        shapeFlag.lineTo(0.15, 0);
        shapeFlag.lineTo(0.15, 1.8);
        shapeFlag.lineTo(1.0, 1.5);
        shapeFlag.lineTo(1.0, 1.0);
        shapeFlag.lineTo(0.15, 1.2);
        shapeFlag.lineTo(0, 1.2);
        shapeFlag.lineTo(0, 0);
        return new THREE.ExtrudeGeometry(shapeFlag, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 });
      } else if (shape === "boot") {
        const shapeBoot = new THREE.Shape();
        shapeBoot.moveTo(0, 0);
        shapeBoot.lineTo(1.0, 0);
        shapeBoot.lineTo(1.0, 0.2);
        shapeBoot.lineTo(0.3, 0.2);
        shapeBoot.lineTo(0.3, 0.5);
        shapeBoot.lineTo(0.6, 0.5);
        shapeBoot.lineTo(0.6, 1.5);
        shapeBoot.lineTo(0.3, 1.5);
        shapeBoot.lineTo(0.3, 0.5);
        shapeBoot.lineTo(0, 0.5);
        shapeBoot.lineTo(0, 0);
        return new THREE.ExtrudeGeometry(shapeBoot, { depth: 0.15, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 });
      }
      // Default to arrow
      const shapeArrow = new THREE.Shape();
      shapeArrow.moveTo(0.2, 0);
      shapeArrow.lineTo(0.5, 0);
      shapeArrow.lineTo(0.5, 1.0);
      shapeArrow.lineTo(0.9, 1.0);
      shapeArrow.lineTo(0.35, 1.6);
      shapeArrow.lineTo(-0.2, 1.0);
      shapeArrow.lineTo(0.2, 1.0);
      shapeArrow.lineTo(0.2, 0);
      return new THREE.ExtrudeGeometry(shapeArrow, { depth: 0.15, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 });
    };

    // Enhanced materials with better lighting response
    const createMaterial = (color: number, opacity: number = 1) => {
      return new THREE.MeshStandardMaterial({ 
        color,
        metalness: 0.2,
        roughness: 0.4,
        transparent: opacity < 1,
        opacity,
        side: THREE.DoubleSide,
        flatShading: false,
        emissive: color,
        emissiveIntensity: 0.1
      });
    };

    // Initial state (semi-transparent)
    if (showInitialState && !showMultipleInstances) {
      const initialGeometry = createShapeGeometry();
      const initialMaterial = createMaterial(0x888888, 0.3);
      const initialMesh = new THREE.Mesh(initialGeometry, initialMaterial);
      initialMesh.castShadow = true;
      initialMesh.receiveShadow = true;
      scene.add(initialMesh);
    }

    // Multiple instances
    if (showMultipleInstances) {
      const colors = [0xff4466, 0x4488ff, 0x44ff88, 0xff9944, 0xff44ff];
      
      for (let i = 0; i < numInstances; i++) {
        const instanceGeometry = createShapeGeometry();
        const instanceMaterial = createMaterial(colors[i % colors.length]);
        const instanceMesh = new THREE.Mesh(instanceGeometry, instanceMaterial);
        instanceMesh.castShadow = true;
        instanceMesh.receiveShadow = true;
        
        transforms.forEach((transform, tIndex) => {
          if (tIndex < i * 2) {
            if (transform.type === "translate") {
              instanceMesh.position.x += transform.params[0] || 0;
              instanceMesh.position.y += transform.params[1] || 0;
              instanceMesh.position.z += transform.params[2] || 0;
            } else if (transform.type === "rotate") {
              const angle = (transform.params[0] || 0) * Math.PI / 180;
              const axisX = transform.params[1] || 0;
              const axisY = transform.params[2] || 0;
              const axisZ = transform.params[3] || 0;
              
              if (axisX !== 0) instanceMesh.rotation.x += angle * axisX;
              if (axisY !== 0) instanceMesh.rotation.y += angle * axisY;
              if (axisZ !== 0) instanceMesh.rotation.z += angle * axisZ;
            }
          }
        });
        
        scene.add(instanceMesh);
      }
    } else {
      // Single transformed shape
      const geometry = createShapeGeometry();
      const material = createMaterial(0x2776e6);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

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
          
          if (axisX !== 0) mesh.rotation.x += angle * axisX;
          if (axisY !== 0) mesh.rotation.y += angle * axisY;
          if (axisZ !== 0) mesh.rotation.z += angle * axisZ;
        }
      });

      scene.add(mesh);
    }

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x88ccff, 0.4);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffaa88, 0.3);
    rimLight.position.set(0, 2, -8);
    scene.add(rimLight);

    // Mouse interaction
    const handleMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      mouseDown.current = true;
      previousMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive || !mouseDown.current) return;
      
      const deltaX = e.clientX - previousMouse.current.x;
      const deltaY = e.clientY - previousMouse.current.y;
      
      cameraRotation.current.theta += deltaX * 0.01;
      cameraRotation.current.phi += deltaY * 0.01;
      cameraRotation.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraRotation.current.phi));
      
      previousMouse.current = { x: e.clientX, y: e.clientY };
      setIsRotating(true);
    };

    const handleMouseUp = () => {
      mouseDown.current = false;
      setIsRotating(false);
    };

    const handleWheel = (e: WheelEvent) => {
      if (!interactive) return;
      e.preventDefault();
    };

    if (interactive && canvasRef.current) {
      canvasRef.current.addEventListener('mousedown', handleMouseDown);
      canvasRef.current.addEventListener('mousemove', handleMouseMove);
      canvasRef.current.addEventListener('mouseup', handleMouseUp);
      canvasRef.current.addEventListener('wheel', handleWheel);
    }

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      camera.position.set(
        radius * Math.sin(cameraRotation.current.phi) * Math.cos(cameraRotation.current.theta),
        radius * Math.cos(cameraRotation.current.phi),
        radius * Math.sin(cameraRotation.current.phi) * Math.sin(cameraRotation.current.theta)
      );
      camera.lookAt(0, 1, 0);
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
      
      if (interactive && canvasRef.current) {
        canvasRef.current.removeEventListener('mousedown', handleMouseDown);
        canvasRef.current.removeEventListener('mousemove', handleMouseMove);
        canvasRef.current.removeEventListener('mouseup', handleMouseUp);
        canvasRef.current.removeEventListener('wheel', handleWheel);
      }
    };
  }, [transforms, shape, width, height, showInitialState, showMultipleInstances, numInstances, showAngles, interactive]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`rounded-lg shadow-lg ${interactive ? 'cursor-grab active:cursor-grabbing' : ''} ${isRotating ? 'cursor-grabbing' : ''}`}
      style={{ boxShadow: 'var(--shadow-scene)' }}
    />
  );
};
