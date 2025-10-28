import { useEffect, useRef } from "react";
import { iniciar } from "../logicas/jogo";
import type { ControladorFlappy } from "../logicas/jogo";

export default function FlappyBird() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ControladorFlappy | null>(null);

  useEffect(() => {
    // inicia o jogo quando o componente monta
    controllerRef.current = iniciar(containerRef!);
    return () => {
      try { controllerRef.current && controllerRef.current.stop(); } catch { }
    };
  }, []);

  function handleRestart() {
    // reinicia o jogo: para e cria novamente
    try { controllerRef.current && controllerRef.current.stop(); } catch { }
    controllerRef.current = iniciar(containerRef!);
    // reseta o contador de gerações no novo controlador, se disponível
    controllerRef.current?.resetGeracao?.();
  }

  return (
    <div className="flex mb-8 flex-col md:flex-row text-black border rounded border-black p-4 bg-white">
      <div ref={containerRef} style={{ minWidth: 300, minHeight: 200 }} />
      <div className="mt-3 md:mt-0 md:ml-4 flex flex-col grow">
        <div>
          <p className="text-md font-semibold">Distância do cano: <label id="distanciaCano" className="font-normal"></label></p>
          <p className="text-md font-semibold">Altura da passagem: <label id="canoY" className="font-normal"></label></p>
          <p className="text-md font-semibold">Velocidade vertical do pássaro: <label id="velocidadePassaro" className="font-normal"></label></p>
          <p className="text-md font-semibold">Altura do pássaro: <label id="passaroY" className="font-normal"></label></p>
          <p className="text-md font-semibold">Tempo: <label id="tempo" className="font-normal"></label></p>
          <p className="text-md font-semibold">Geração: <label id="geracao" className="font-normal"></label></p>
          <p className="text-md font-semibold">Pontos: <label id="pontos" className="font-bold text-green-600"></label></p>
          <div className="flex flex-row justify-center">
            <button onClick={handleRestart} className="cursor-pointer px-3 py-1 bg-blue-600 text-white rounded">Reiniciar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
