"use client";
import Markdown from "marked-react";
import FlappyBird from "./Flappy";
import Lowlight from "react-lowlight";
//@ts-ignore
import javascript from 'highlight.js/lib/languages/javascript';
import 'highlight.js/styles/default.css'
import content from "./content.md?raw";

Lowlight.registerLanguage('js', javascript);

const renderer = {
  code(snippet: string, lang: string) {
    //@ts-ignore
    return <Lowlight key={this.elementId} language={lang} value={snippet} markers={[]} />;
  },
};

export default function Jogo() {
  return (
    <div className="bg-amber-50">
      <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight md:text-5xl lg:text-6xl text-black mx-auto text-center">Flappy Bird</h1>
      <div className="flex justify-center mb-8">
        <FlappyBird />
      </div>
      <div className="border rounded bg-white text-black mx-auto p-4 shadow prose mb-8">
        <Markdown value={content} renderer={renderer} gfm />
      </div>
    </div>
  );
}