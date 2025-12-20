
import React, { useState } from 'react';
import { RecipeResult } from '../types';

interface Props {
  result: RecipeResult;
  onReset: () => void;
  onRegenerate: () => void;
  onViewAlternative: (dishName: string) => void;
}

const ResultView: React.FC<Props> = ({ result, onReset, onRegenerate, onViewAlternative }) => {
  const [tab, setTab] = useState<'easy' | 'gourmet'>('easy');

  return (
    <div className="animate-fadeIn space-y-8 pb-20 pt-10">
      <div className="text-center space-y-6">
        <div className="inline-block px-4 py-1.5 bg-orange-50 text-[#ff5d01] text-xs font-black rounded-full uppercase tracking-widest">
          Fusion Master Recipe
        </div>
        <h2 className="text-3xl font-black text-slate-900 leading-tight">
          {result.dishName}
        </h2>
        <div className="relative px-6">
          <p className="text-slate-500 italic text-lg font-medium leading-relaxed">
            "{result.comment}"
          </p>
        </div>
      </div>

      <div className="bg-[#F2F4F6] p-1.5 rounded-2xl flex sticky top-4 z-30">
        <button
          onClick={() => setTab('easy')}
          className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${
            tab === 'easy' ? 'bg-white text-[#ff5d01] shadow-sm' : 'text-slate-500'
          }`}
        >
          ⚡ 간편 레시피
        </button>
        <button
          onClick={() => setTab('gourmet')}
          className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${
            tab === 'gourmet' ? 'bg-white text-[#ff5d01] shadow-sm' : 'text-slate-500'
          }`}
        >
          ✨ 셰프의 킥
        </button>
      </div>

      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-50">
        <h3 className="text-xl font-black text-slate-900 mb-8 brand-orange-text">요리 순서</h3>
        <div 
          className="recipe-content prose prose-slate max-w-none text-slate-800 font-medium"
          dangerouslySetInnerHTML={{ __html: tab === 'easy' ? result.easyRecipe : result.gourmetRecipe }}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-900">다른 퓨전 아이디어</h3>
        <div className="grid gap-3">
          {result.similarRecipes.map((recipe, idx) => (
            <div key={idx} className="bg-orange-50/30 p-6 rounded-3xl border border-orange-100 flex flex-col gap-3">
              <div>
                <h4 className="text-lg font-black text-orange-900">{recipe.title}</h4>
                <p className="text-sm text-orange-700/70 font-medium leading-relaxed">{recipe.reason}</p>
              </div>
              <button 
                onClick={() => onViewAlternative(recipe.title)}
                className="w-fit px-5 py-2.5 bg-white text-[#ff5d01] text-sm font-bold rounded-full border border-orange-200 hover:bg-[#ff5d01] hover:text-white transition-all shadow-sm"
              >
                레시피 보기 ➔
              </button>
            </div>
          ))}
        </div>
      </div>

      {result.referenceLinks && result.referenceLinks.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-black text-slate-900">유사한 음식 레시피 링크</h3>
          <div className="flex flex-col gap-2">
            {result.referenceLinks.map((link, idx) => (
              <a 
                key={idx} 
                href={link.url} 
                target="_blank" 
                rel="noreferrer"
                className="w-full p-4 bg-slate-50 border border-slate-100 text-slate-600 text-sm font-bold rounded-2xl hover:bg-slate-100 transition-all flex justify-between items-center"
              >
                <span>🔗 {link.title}</span>
                <span className="text-slate-300">➔</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-10">
        <button
          onClick={onRegenerate}
          className="w-full py-6 bg-white border-2 border-[#ff5d01] text-[#ff5d01] font-bold text-xl rounded-[24px] shadow-sm active:scale-95 transition-all"
        >
          🔄 다른 레시피 추천받기
        </button>
        <button
          onClick={onReset}
          className="w-full py-6 bg-[#ff5d01] text-white font-bold text-xl rounded-[24px] shadow-xl shadow-orange-200 active:scale-95 transition-all"
        >
          🏠 처음부터 다시하기
        </button>
      </div>

      <style>{`
        .recipe-content ol { list-style: none; counter-reset: r-step; padding: 0; display: flex; flex-direction: column; gap: 1.5rem; }
        .recipe-content ol li { counter-increment: r-step; position: relative; padding-left: 3.5rem; font-size: 1.1rem; line-height: 1.6; }
        .recipe-content ol li::before {
          content: counter(r-step);
          position: absolute; left: 0; top: 0;
          width: 2.2rem; height: 2.2rem;
          background: #FFF3ED; color: #ff5d01;
          display: flex; align-items: center; justify-content: center;
          border-radius: 12px; font-weight: 900; font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default ResultView;
