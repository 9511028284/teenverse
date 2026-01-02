import React from 'react';
import { Sparkles } from 'lucide-react';
import Button from '../ui/Button';

const Portfolio = ({ rawPortfolioText, setRawPortfolioText, handleAiGenerate, isAiLoading, portfolioItems }) => {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Sparkles/> Portfolio AI Builder</h2>
        <p className="text-purple-100 mt-2 max-w-2xl">Don't know how to write a case study? Just describe what you did roughly, and our AI will format it into a professional portfolio piece.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm h-fit">
          <h3 className="font-bold text-lg mb-4 dark:text-white">Generate New Item</h3>
          <textarea 
            className="w-full h-40 p-4 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:text-white mb-4 resize-none"
            placeholder="Example: I built a website for a local bakery using React..."
            value={rawPortfolioText}
            onChange={(e) => setRawPortfolioText(e.target.value)}
          ></textarea>
          <Button 
            onClick={handleAiGenerate} 
            disabled={isAiLoading || !rawPortfolioText} 
            className={`w-full ${isAiLoading ? 'opacity-70' : ''}`}
            icon={Sparkles}
          >
            {isAiLoading ? 'Generating...' : 'Generate with AI'}
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-lg dark:text-white">Your Portfolio</h3>
          {portfolioItems.length === 0 && (
            <div className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-center text-gray-400">
              No items yet. Use the AI to generate one!
            </div>
          )}
          {portfolioItems.map(item => (
            <div key={item.id} className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">{item.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;