
import React from 'react';
import TagButton from '../TagButton';

interface Item {
  name: string;
  desc: string;
}

interface Props {
  type: 'meal' | 'snack';
  items: Item[];
  onSelect: (itemName: string) => void;
  onLoadMore: () => void;
  onLoadSnack: () => void;
  onLoadMeal: () => void;
  onBack: () => void;
}

const ConvenienceStep: React.FC<Props> = ({ type, items, onSelect, onLoadMore, onLoadSnack, onLoadMeal, onBack }) => {
  return (
    <div className="space-y-6 pt-12 px-6 step-transition pb-20">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-900 leading-tight">
          오늘은 편의점을<br/><span className="brand-orange-text">털어볼까요?</span>
        </h2>
        <p className="text-slate-600 font-bold text-lg">
          {type === 'meal' ? '든든한 한 끼 식사 메뉴를 추천해드려요.' : '달콤 짭짤한 간식 조합을 추천해드려요.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {items.map((item, idx) => (
          <TagButton
            key={idx}
            label={item.name}
            subLabel={item.desc}
            selected={false}
            onClick={() => onSelect(item.name)}
          />
        ))}
      </div>

      <div className="space-y-3 pt-4">
        <div className="flex gap-2">
            <button
            onClick={onLoadMore}
            className="flex-1 py-4 bg-white border-2 border-[#ff5d01] text-[#ff5d01] text-base font-bold rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
            🔍 더 보기
            </button>
            <button
            onClick={type === 'meal' ? onLoadSnack : onLoadMeal}
            className={`flex-1 py-4 border-2 text-base font-bold rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 ${
              type === 'meal' 
                ? 'bg-orange-50 border-orange-200 text-orange-600' 
                : 'bg-green-50 border-green-200 text-green-600'
            }`}
            >
            {type === 'meal' ? '🍪 간식 추천' : '🍱 식사 추천'}
            </button>
        </div>
        
        <button onClick={onBack} className="w-full py-2 text-slate-400 font-bold mt-2 hover:text-slate-600 transition-colors">이전 화면으로</button>
      </div>
    </div>
  );
};

export default ConvenienceStep;
