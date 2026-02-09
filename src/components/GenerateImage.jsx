// GenerateImage.jsx
import React, { useState } from 'react';
import { ImageIcon, Loader2, Download, Sparkles } from 'lucide-react';
import { generateMnemonicImage } from '../services/llmService';

const GenerateImage = ({ sentence, isRunning, generation, maxGenerations }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  // Logic: Only active if NOT running AND generations are finished
  const isReady = !isRunning && generation >= maxGenerations && sentence;

  const handleGenerate = async () => {
    setLoading(true);
    const url = await generateMnemonicImage(sentence);
    setImageUrl(url);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 border border-purple-100 h-full flex flex-col">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-purple-600" />
        Visual Mnemonic
      </h2>

      <div className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
        {imageUrl ? (
          <div className="relative w-full h-full">
            <img src={imageUrl} alt="AI Generated" className="rounded-lg shadow-md w-full object-cover" />
            <a 
              href={imageUrl} 
              download="mnemonic-image.png"
              className="absolute bottom-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white text-purple-600"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="text-center">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">
              {isRunning ? "Evolution in progress..." : "Select a mnemonic to visualize"}
            </p>
          </div>
        )}
      </div>

      <button
        onClick={handleGenerate}
        disabled={!isReady || loading}
        className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all shadow-md ${
          isReady 
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90' 
          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        {isRunning ? "Waiting for Finish..." : "Generate AI Illustration"}
      </button>
      
      {sentence && !isRunning && (
        <p className="mt-2 text-[10px] text-gray-400 italic text-center">
          Ready for: "{sentence.substring(0, 40)}..."
        </p>
      )}
    </div>
  );
};

export default GenerateImage;