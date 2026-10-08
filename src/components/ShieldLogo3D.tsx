import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { ExtrudeGeometry, Group, Shape } from "three";
import { ShieldCheck } from "lucide-react";

type LogoColors = [string, string, string];

function Shield({ reducedMotion, colors }: { reducedMotion: boolean; colors: LogoColors }) {
  const group = useRef<Group>(null);
  const geometry = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, 0.9);
    shape.bezierCurveTo(0.28, 0.73, 0.55, 0.68, 0.7, 0.65);
    shape.lineTo(0.7, 0.02);
    shape.bezierCurveTo(0.7, -0.47, 0.35, -0.76, 0, -0.94);
    shape.bezierCurveTo(-0.35, -0.76, -0.7, -0.47, -0.7, 0.02);
    shape.lineTo(-0.7, 0.65);
    shape.bezierCurveTo(-0.55, 0.68, -0.28, 0.73, 0, 0.9);
    const result = new ExtrudeGeometry(shape, {
      depth: 0.22, bevelEnabled: true, bevelThickness: 0.07,
      bevelSize: 0.06, bevelSegments: 3, steps: 1, curveSegments: 16,
    });
    result.translate(0, 0, -0.11);
    return result;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, delta) => {
    if (group.current && !reducedMotion) {
      group.current.rotation.y += Math.min(delta, 0.05) * (Math.PI * 2 / 60);
    }
  });
  return (
    <group ref={group} rotation={[0.08, -0.3, 0]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial attach="material-0" color={colors[0]} metalness={0.6} roughness={0.24} />
        <meshStandardMaterial attach="material-1" color={colors[1]} metalness={0.8} roughness={0.18} />
      </mesh>
      {[1, -1].map((side) => (
        <group key={side} position={[0, 0, side * 0.19]} rotation-y={side === -1 ? Math.PI : 0}>
          <mesh position={[-0.16, -0.04, 0]} rotation-z={Math.PI / 4}>
            <boxGeometry args={[0.14, 0.43, 0.04]} />
            <meshStandardMaterial color={colors[2]} metalness={0.25} roughness={0.25} />
          </mesh>
          <mesh position={[0.12, 0.07, 0]} rotation-z={-Math.PI / 4}>
            <boxGeometry args={[0.14, 0.69, 0.04]} />
            <meshStandardMaterial color={colors[2]} metalness={0.25} roughness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function ShieldLogo3D() {
  const [colors, setColors] = useState<LogoColors | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const readColors = () => {
      const css = getComputedStyle(document.documentElement);
      setColors([
        css.getPropertyValue("--logo-face").trim(),
        css.getPropertyValue("--logo-edge").trim(),
        css.getPropertyValue("--logo-check").trim(),
      ]);
    };
    readColors();
    const observer = new MutationObserver(readColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    updateMotion();
    media.addEventListener("change", updateMotion);
    return () => { observer.disconnect(); media.removeEventListener("change", updateMotion); };
  }, []);
  if (!colors) return <ShieldCheck className="size-4.5" />;
  return (
    <Canvas
      orthographic camera={{ position: [0, 0, 5], zoom: 14 }}
      dpr={[1, 2]} gl={{ alpha: true, antialias: true }}
      frameloop={reducedMotion ? "demand" : "always"}
      fallback={<ShieldCheck className="size-4.5" />}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 5]} intensity={2.5} />
      <Environment resolution={32}>
        <Lightformer intensity={3} position={[0, 4, 3]} scale={[5, 5, 1]} />
        <Lightformer intensity={2} color={colors[1]} position={[-3, 0, 2]} rotation-y={Math.PI / 3} scale={[3, 4, 1]} />
      </Environment>
      <Shield reducedMotion={reducedMotion} colors={colors} />
    </Canvas>
  );
}