import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Transform } from "@/types/question";

interface ThreeSceneProps {
  transforms: Transform[];
  shape?: string;
  width?: number;
  height?: number;
  showInitialState?: boolean;  // Show both initial and transformed states
  showMultipleInstances?: boolean;  // For Q6: show multiple instances with cumulative transforms
  numInstances?: number;  // Number of instances to show for Q6
  showAngles?: boolean;  // Show angle labels for rotations
}

export const ThreeScene = ({ 
  transforms, 
  shape = "letterF", 
  width = 400, 
  height = 300, 
  showInitialState = false,
  showMultipleInstances = false,
  numInstances = 3,
  showAngles = true
}: ThreeSceneProps) => {
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

    // Add axis labels with unit markers
    const createAxisLabel = (text: string, position: THREE.Vector3, color: number) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 128;
      canvas.height = 64;
      context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      context.font = 'Bold 32px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 64, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.scale.set(0.8, 0.4, 1);
      return sprite;
    };

    const createUnitLabel = (text: string, position: THREE.Vector3, color: number) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 64;
      canvas.height = 64;
      context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      context.font = '28px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 32, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.scale.set(0.4, 0.4, 1);
      return sprite;
    };

    // Main axis labels
    scene.add(createAxisLabel('x (units)', new THREE.Vector3(3.5, 0, 0), 0xff0000));
    scene.add(createAxisLabel('y (units)', new THREE.Vector3(0, 3.5, 0), 0x00ff00));
    scene.add(createAxisLabel('z (units)', new THREE.Vector3(0, 0, 3.5), 0x0000ff));
    
    // Add unit number markers along axes
    // X-axis markers
    for (let i = -2; i <= 3; i++) {
      if (i !== 0) {
        scene.add(createUnitLabel(i.toString(), new THREE.Vector3(i, -0.3, 0), 0xff0000));
      }
    }
    // Y-axis markers
    for (let i = 1; i <= 3; i++) {
      scene.add(createUnitLabel(i.toString(), new THREE.Vector3(-0.3, i, 0), 0x00ff00));
    }
    // Z-axis markers
    for (let i = -2; i <= 3; i++) {
      if (i !== 0) {
        scene.add(createUnitLabel(i.toString(), new THREE.Vector3(0, -0.3, i), 0x0000ff));
      }
    }
    
    // Origin marker
    scene.add(createUnitLabel('0', new THREE.Vector3(-0.3, -0.3, 0), 0x666666));
    
    // Add angle labels if enabled
    if (showAngles) {
      const rotationTransforms = transforms.filter(t => t.type === "rotate");
      
      rotationTransforms.forEach((transform, idx) => {
        const angle = transform.params[0];
        const axisX = transform.params[1];
        const axisY = transform.params[2];
        const axisZ = transform.params[3];
        
        let axisName = '';
        let position = new THREE.Vector3();
        let color = 0x000000;
        
        if (axisX !== 0) {
          axisName = 'X';
          position.set(2.5, 1.5 + idx * 0.5, 0);
          color = 0xff0000;
        } else if (axisY !== 0) {
          axisName = 'Y';
          position.set(0, 2.5 + idx * 0.5, 0);
          color = 0x00ff00;
        } else if (axisZ !== 0) {
          axisName = 'Z';
          position.set(0, 1.5 + idx * 0.5, 2.5);
          color = 0x0000ff;
        }
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = 200;
        canvas.height = 80;
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.font = 'Bold 36px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(`${angle}°`, 100, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(1.2, 0.5, 1);
        scene.add(sprite);
      });
    }

    // Helper function to create geometry based on shape type
    const createShapeGeometry = (): THREE.BufferGeometry => {
      if (shape === "letterF") {
        // Create an asymmetric "F" shape - clearly shows orientation
        const shapeF = new THREE.Shape();
        shapeF.moveTo(0, 0);
        shapeF.lineTo(0.2, 0);
        shapeF.lineTo(0.2, 1.0);
        shapeF.lineTo(0.7, 1.0);
        shapeF.lineTo(0.7, 1.2);
        shapeF.lineTo(0.2, 1.2);
        shapeF.lineTo(0.2, 1.5);
        shapeF.lineTo(0.6, 1.5);
        shapeF.lineTo(0.6, 1.7);
        shapeF.lineTo(0, 1.7);
        shapeF.lineTo(0, 0);
        
        const extrudeSettings = { depth: 0.15, bevelEnabled: false };
        return new THREE.ExtrudeGeometry(shapeF, extrudeSettings);
      } else if (shape === "letterP") {
        // Create an asymmetric "P" shape - vertical stem + top loop
        const shapeP = new THREE.Shape();
        // Vertical stem
        shapeP.moveTo(0, 0);
        shapeP.lineTo(0.2, 0);
        shapeP.lineTo(0.2, 1.7);
        shapeP.lineTo(0.6, 1.7);
        shapeP.lineTo(0.6, 1.0);
        shapeP.lineTo(0.2, 1.0);
        shapeP.lineTo(0.2, 0.2);
        shapeP.lineTo(0, 0.2);
        shapeP.lineTo(0, 0);
        
        // Add the loop hole
        const hole = new THREE.Path();
        hole.moveTo(0.2, 1.2);
        hole.lineTo(0.45, 1.2);
        hole.lineTo(0.45, 1.5);
        hole.lineTo(0.2, 1.5);
        hole.lineTo(0.2, 1.2);
        shapeP.holes.push(hole);
        
        const extrudeSettings = { depth: 0.15, bevelEnabled: false };
        return new THREE.ExtrudeGeometry(shapeP, extrudeSettings);
      } else if (shape === "letterL") {
        // Create an asymmetric "L" shape 
        const shapeL = new THREE.Shape();
        shapeL.moveTo(0, 0);
        shapeL.lineTo(0.7, 0);
        shapeL.lineTo(0.7, 0.25);
        shapeL.lineTo(0.25, 0.25);
        shapeL.lineTo(0.25, 1.5);
        shapeL.lineTo(0, 1.5);
        shapeL.lineTo(0, 0);
        
        const extrudeSettings = { depth: 0.15, bevelEnabled: false };
        return new THREE.ExtrudeGeometry(shapeL, extrudeSettings);
      } else {
        // Fallback to letterF
        const shapeF = new THREE.Shape();
        shapeF.moveTo(0, 0);
        shapeF.lineTo(0.2, 0);
        shapeF.lineTo(0.2, 1.0);
        shapeF.lineTo(0.7, 1.0);
        shapeF.lineTo(0.7, 1.2);
        shapeF.lineTo(0.2, 1.2);
        shapeF.lineTo(0.2, 1.5);
        shapeF.lineTo(0.6, 1.5);
        shapeF.lineTo(0.6, 1.7);
        shapeF.lineTo(0, 1.7);
        shapeF.lineTo(0, 0);
        
        const extrudeSettings = { depth: 0.15, bevelEnabled: false };
        return new THREE.ExtrudeGeometry(shapeF, extrudeSettings);
      }
    };

    // Show initial state (untransformed) if requested
    if (showInitialState && !showMultipleInstances) {
      const initialGeometry = createShapeGeometry();
      const initialMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x888888,  // Gray color for initial state
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide 
      });
      const initialMesh = new THREE.Mesh(initialGeometry, initialMaterial);
      scene.add(initialMesh);
    }

    // For Q6: Show multiple instances with cumulative transformations
    if (showMultipleInstances) {
      const colors = [0xff3333, 0x3333ff, 0x33ff33, 0xff9933, 0xff33ff]; // Different colors for each instance
      
      // First instance - no transforms (at origin)
      const firstGeometry = createShapeGeometry();
      const firstMaterial = new THREE.MeshPhongMaterial({ 
        color: colors[0],
        side: THREE.DoubleSide 
      });
      const firstMesh = new THREE.Mesh(firstGeometry, firstMaterial);
      scene.add(firstMesh);
      
      // Subsequent instances with cumulative transforms
      for (let i = 1; i < numInstances; i++) {
        const instanceGeometry = createShapeGeometry();
        const instanceMaterial = new THREE.MeshPhongMaterial({ 
          color: colors[i % colors.length],
          side: THREE.DoubleSide 
        });
        const instanceMesh = new THREE.Mesh(instanceGeometry, instanceMaterial);
        
        // Apply all transforms cumulatively up to this instance
        transforms.forEach((transform, tIndex) => {
          // Each instance gets all previous transforms applied
          if (tIndex < i * 2) {  // Each instance has 2 transforms (translate + rotate)
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
      // Create and add the single transformed shape
      const geometry = createShapeGeometry();
      const material = new THREE.MeshPhongMaterial({ 
        color: 0xff3333,  // Red color for transformed state
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
    }

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    renderer.render(scene, camera);

    return () => {
      // Dispose all geometries and materials in the scene
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
    };
  }, [transforms, shape, width, height, showInitialState, showMultipleInstances, numInstances]);

  return <canvas ref={canvasRef} className="border border-border rounded" />;
};
