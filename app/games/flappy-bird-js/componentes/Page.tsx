"use client";
import Markdown from "marked-react";
import FlappyBird from "./Flappy";
import Lowlight from "react-lowlight";
//@ts-ignore
import typescript from 'highlight.js/lib/languages/typescript';
import 'highlight.js/styles/dark.css'
import content from "../readme.md?raw";

import logo from "../assets/logo.png"

Lowlight.registerLanguage('ts', typescript);

const renderer = {
  code(snippet: string, lang: string) {
    //@ts-ignore
    return <Lowlight key={this.elementId} language={lang} value={snippet} markers={[]} />;
  },
};

export default function Jogo() {
  return (
    <div className="bg-amber-50 min-h-screen py-8 mx-0">
      <div className="flex flex-row justify-center mb-8">
        <img src={logo} alt="logo" width={300} />
      </div>
      <div className="flex justify-center mb-8 px-4">
        <div className="w-full max-w-4xl">
          <FlappyBird />
        </div>
      </div>
      <div className="border rounded bg-white text-black mx-auto p-4 shadow prose mb-8 max-w-4xl px-4 prose-pre:bg-white">
        <Markdown value={content} renderer={renderer} gfm />
      </div>
    </div>
  );
}
