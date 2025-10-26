import { useEffect, useRef } from "react";
import { iniciar } from "./game";

export default function FlappyBird() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finalizar = iniciar(containerRef!);

    return () => finalizar();
  }, [containerRef]);

  return (
    <div className="flex mb-8 flex-row text-black border rounded border-black p-4 bg-white">
      <div>
        <p className="text-lg font-semibold">Distância do Cano: <label id="distanciaCano" className="font-normal"></label></p>
        <p className="text-lg font-semibold">Y do Cano: <label id="canoY" className="font-normal"></label></p>
        <p className="text-lg font-semibold">Velocidade do Pássaro: <label id="velocidadePassaro" className="font-normal"></label></p>
        <p className="text-lg font-semibold">Y do Pássaro: <label id="passaroY" className="font-normal"></label></p>
        <p className="text-lg font-semibold">Tempo: <label id="tempo" className="font-normal"></label></p>
        <p className="text-lg font-semibold">Pontos: <label id="pontos" className="font-bold text-green-600"></label></p>
        <div className="flex items-center space-x-2">
          <label htmlFor="escalaTempo" className="text-lg font-semibold">Escala de Tempo:</label>
          <input type="range" id="escalaTempo" className="w-64" />
        </div>
      </div>
      <div ref={containerRef} />
    </div>
  );
}