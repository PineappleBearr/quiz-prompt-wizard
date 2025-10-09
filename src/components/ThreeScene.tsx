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
}

export const ThreeScene = ({ 
  transforms, 
  shape = "digit1", 
  width = 400, 
  height = 300, 
  showInitialState = false,
  showMultipleInstances = false,
  numInstances = 3
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
    
    // Add angle reference note
    const createRotationLabel = (text: string, position: THREE.Vector3) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 256;
      canvas.height = 64;
      context.fillStyle = '#888888';
      context.font = '20px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 128, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.scale.set(1.5, 0.35, 1);
      return sprite;
    };
    
    scene.add(createRotationLabel('Rotation: degrees (°)', new THREE.Vector3(0, -2.8, 0)));

    // Helper function to create geometry based on shape type
    const createShapeGeometry = (): THREE.BufferGeometry => {
      if (shape === "digit1") {
        // Create a "1" shape
        const shape1 = new THREE.Shape();
        shape1.moveTo(0.4, 0);
        shape1.lineTo(0.6, 0);
        shape1.lineTo(0.6, 1.5);
        shape1.lineTo(0.4, 1.5);
        shape1.lineTo(0.4, 0);
        
        const extrudeSettings = { depth: 0.1, bevelEnabled: false };
        return new THREE.ExtrudeGeometry(shape1, extrudeSettings);
      } else if (shape === "letterL") {
        // Create an "L" shape
        const shapeL = new THREE.Shape();
        shapeL.moveTo(0, 0);
        shapeL.lineTo(0.3, 0);
        shapeL.lineTo(0.3, 1.2);
        shapeL.lineTo(0.8, 1.2);
        shapeL.lineTo(0.8, 1.5);
        shapeL.lineTo(0, 1.5);
        shapeL.lineTo(0, 0);
        
        const extrudeSettings = { depth: 0.1, bevelEnabled: false };
        return new THREE.ExtrudeGeometry(shapeL, extrudeSettings);
      } else if (shape === "arrow") {
        // Create an arrow shape pointing up
        const shapeArrow = new THREE.Shape();
        shapeArrow.moveTo(0, 0.5);        // Tip
        shapeArrow.lineTo(0.3, 0);        // Right side
        shapeArrow.lineTo(0.15, 0);       // Right shaft top
        shapeArrow.lineTo(0.15, -0.5);    // Right shaft bottom
        shapeArrow.lineTo(-0.15, -0.5);   // Left shaft bottom
        shapeArrow.lineTo(-0.15, 0);      // Left shaft top
        shapeArrow.lineTo(-0.3, 0);       // Left side
        shapeArrow.lineTo(0, 0.5);        // Back to tip
        
        const extrudeSettings = { depth: 0.1, bevelEnabled: false };
        return new THREE.ExtrudeGeometry(shapeArrow, extrudeSettings);
      } else {
        // Fallback to box
        return new THREE.BoxGeometry(0.5, 0.5, 0.5);
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
      
      for (let i = 0; i < numInstances; i++) {
        const instanceGeometry = createShapeGeometry();
        const instanceMaterial = new THREE.MeshPhongMaterial({ 
          color: colors[i % colors.length],
          side: THREE.DoubleSide 
        });
        const instanceMesh = new THREE.Mesh(instanceGeometry, instanceMaterial);
        
        // Apply cumulative transforms up to this instance
        let cumulativeTranslation = new THREE.Vector3(0, 0, 0);
        let cumulativeRotation = new THREE.Euler(0, 0, 0);
        
        for (let j = 0; j < transforms.length && j <= i * 2; j++) {
          const transform = transforms[j];
          if (transform.type === "translate") {
            cumulativeTranslation.x += transform.params[0] || 0;
            cumulativeTranslation.y += transform.params[1] || 0;
            cumulativeTranslation.z += transform.params[2] || 0;
          } else if (transform.type === "rotate") {
            const angle = (transform.params[0] || 0) * Math.PI / 180;
            const axisX = transform.params[1] || 0;
            const axisY = transform.params[2] || 0;
            const axisZ = transform.params[3] || 0;
            
            if (axisX !== 0) cumulativeRotation.x += angle * axisX;
            if (axisY !== 0) cumulativeRotation.y += angle * axisY;
            if (axisZ !== 0) cumulativeRotation.z += angle * axisZ;
          }
        }
        
        instanceMesh.position.copy(cumulativeTranslation);
        instanceMesh.rotation.copy(cumulativeRotation);
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
