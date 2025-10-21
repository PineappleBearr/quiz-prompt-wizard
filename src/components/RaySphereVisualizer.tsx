import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere as DreiSphere, Line, Grid, Html, Text } from "@react-three/drei";
import * as THREE from "three";
import { Ray, Sphere, Vec3 } from "../types/raySphereTypes";

function vec3ToArray(v: Vec3): [number, number, number] {
  return [v[0], v[1], v[2]];
}

export interface RaySphereVisualizerProps {
  ray: Ray;
  sphere: Sphere;
  intersectionT?: number;
  showIntersection?: boolean;
  style?: React.CSSProperties;
  className?: string;
  referenceIntersections?: Vec3[];
  showTLabels?: boolean;
  extraSpheres?: Sphere[]; // C题型的其他球
}

export const RaySphereVisualizer: React.FC<RaySphereVisualizerProps> = ({
  ray,
  sphere,
  intersectionT,
  showIntersection = true,
  style,
  className = "",
  referenceIntersections,
  showTLabels = true,
  extraSpheres = [],
}) => {
  const rayEnd = useMemo<Vec3>(() => {
    const L = 20;
    return [
      ray.origin[0] + ray.direction[0] * L,
      ray.origin[1] + ray.direction[1] * L,
      ray.origin[2] + ray.direction[2] * L,
    ];
  }, [ray]);

  const hitPoint = useMemo<Vec3 | null>(() => {
    if (intersectionT == null || !showIntersection) return null;
    return [
      ray.origin[0] + ray.direction[0] * intersectionT,
      ray.origin[1] + ray.direction[1] * intersectionT,
      ray.origin[2] + ray.direction[2] * intersectionT,
    ];
  }, [ray, intersectionT, showIntersection]);

  // ===== Smart side-offset for labels: a stable lateral direction
  const side = useMemo<Vec3>(() => {
    const d = new THREE.Vector3(...ray.direction).normalize();
    const up = Math.abs(d.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const s = new THREE.Vector3().crossVectors(d, up).normalize().multiplyScalar(0.18); // offset magnitude
    return [s.x, s.y, s.z];
  }, [ray.direction]);

  return (
    <div style={{ position: "relative", ...style }} className={className}>
      <div style={{ height: 400 }}>
        <Canvas camera={{ position: [6, 4, 8], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight intensity={0.8} position={[5, 5, 5]} />
          <Grid position={[0, -0.001, 0]} args={[20, 20]} cellColor="#eaeaea" sectionColor="#f5f5f5" />

          {/* 主球体 */}
          <mesh position={vec3ToArray(sphere.center)}>
            <sphereGeometry args={[sphere.radius, 48, 48]} />
            <meshStandardMaterial color="#1976d2" metalness={0.35} roughness={0.25} transparent opacity={0.45} />
          </mesh>

          {/* 额外球体（C题型） */}
          {extraSpheres.map((s, idx) =>
            DreiSphere ? (
              <DreiSphere key={`extra-${idx}`} args={[s.radius, 32, 32]} position={vec3ToArray(s.center)}>
                <meshStandardMaterial color="#9aa1a9" roughness={0.6} metalness={0.2} transparent opacity={0.25} />
              </DreiSphere>
            ) : (
              <mesh key={`extra-${idx}`} position={vec3ToArray(s.center)}>
                <sphereGeometry args={[s.radius, 32, 32]} />
                <meshStandardMaterial color="#9aa1a9" roughness={0.6} metalness={0.2} transparent opacity={0.25} />
              </mesh>
            )
          )}

          {/* 射线起点 */}
          <mesh position={vec3ToArray(ray.origin)}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#ff3b30" />
          </mesh>

          {/* 射线段 */}
          <Line points={[vec3ToArray(ray.origin), vec3ToArray(rayEnd)]} color="#f6c000" lineWidth={2} dashed={false} />

          {/* 交点 */}
          {hitPoint && showIntersection && (
            <mesh position={vec3ToArray(hitPoint)}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#00c853" />
              {showTLabels && (
                <Html
                  position={[
                    hitPoint[0] + side[0],
                    hitPoint[1] + side[1],
                    hitPoint[2] + side[2],
                  ]}
                  center
                  distanceFactor={10}
                >
                  <div
                    style={{
                      color: "#00c853",
                      fontWeight: 700,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                      background: "rgba(0,200,83,0.08)",
                      border: "1px solid rgba(0,200,83,0.35)",
                      borderRadius: 8,
                      padding: "2px 6px",
                      pointerEvents: "none",
                      backdropFilter: "blur(2px)",
                    }}
                  >
                    t = {intersectionT?.toFixed(3)}
                  </div>
                </Html>
              )}
            </mesh>
          )}

          {/* t=0 标签（偏移到原点旁） */}
          {showTLabels && (
            <Html
              position={[
                ray.origin[0] + side[0],
                ray.origin[1] + side[1],
                ray.origin[2] + side[2],
              ]}
              center
              distanceFactor={10}
            >
              <div
                style={{
                  color: "#ff3b30",
                  fontWeight: 700,
                  fontSize: 12,
                  whiteSpace: "nowrap",
                  background: "rgba(255,59,48,0.08)",
                  border: "1px solid rgba(255,59,48,0.35)",
                  borderRadius: 8,
                  padding: "2px 6px",
                  pointerEvents: "none",
                  backdropFilter: "blur(0px)",
                }}
              >
                t = 0
              </div>
            </Html>
          )}

          {/* 坐标轴 */}
          <AxesWithLabels length={3} />

          <OrbitControls makeDefault enablePan enableRotate enableZoom />
        </Canvas>
      </div>
    </div>
  );
};

const AxesWithLabels: React.FC<{ length?: number }> = ({ length = 3 }) => {
  const headLength = 0.35;
  const headWidth = 0.2;

  const arrows = useMemo(() => {
    const arr: { dir: THREE.Vector3; color: string; key: string }[] = [];
    arr.push({ dir: new THREE.Vector3(1, 0, 0), color: "#ff4d4f", key: "+x" });
    arr.push({ dir: new THREE.Vector3(-1, 0, 0), color: "#ff9a9c", key: "-x" });
    arr.push({ dir: new THREE.Vector3(0, 1, 0), color: "#52c41a", key: "+y" });
    arr.push({ dir: new THREE.Vector3(0, -1, 0), color: "#a0e28a", key: "-y" });
    arr.push({ dir: new THREE.Vector3(0, 0, 1), color: "#1890ff", key: "+z" });
    arr.push({ dir: new THREE.Vector3(0, 0, -1), color: "#7ec1ff", key: "-z" });
    return arr.map((a) => ({
      ...a,
      helper: new THREE.ArrowHelper(
        a.dir,
        new THREE.Vector3(0, 0, 0),
        length,
        new THREE.Color(a.color).getHex(),
        headLength,
        headWidth
      ),
    }));
  }, [length]);

  return (
    <group>
      {arrows.map((a) => (
        <primitive key={a.key} object={a.helper} />
      ))}
      <Text position={[length, 0, 0]} fontSize={0.3} color="#ff4d4f" anchorX="center" anchorY="middle">+X</Text>
      <Text position={[-length, 0, 0]} fontSize={0.3} color="#ff9a9c" anchorX="center" anchorY="middle">-X</Text>
      <Text position={[0, length, 0]} fontSize={0.3} color="#52c41a" anchorX="center" anchorY="middle">+Y</Text>
      <Text position={[0, -length, 0]} fontSize={0.3} color="#a0e28a" anchorX="center" anchorY="middle">-Y</Text>
      <Text position={[0, 0, length]} fontSize={0.3} color="#1890ff" anchorX="center" anchorY="middle">+Z</Text>
      <Text position={[0, 0, -length]} fontSize={0.3} color="#7ec1ff" anchorX="center" anchorY="middle">-Z</Text>
    </group>
  );
};
