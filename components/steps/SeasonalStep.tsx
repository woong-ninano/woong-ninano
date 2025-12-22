
import React from 'react';
import { UserChoices } from '../../types';
import TagButton from '../TagButton';

interface Props {
  choices: UserChoices;
  setChoices: React.Dispatch<React.SetStateAction<UserChoices>>;
  items: {name: string, desc: string}[];
  onNext: () => void;
  onBack: () => void;
  onMore: () => void;
}

const SeasonalStep: React.FC<Props> = ({ choices, setChoices, items, onNext, onBack, onMore }) => {
  const toggleItem = (name: string) => {
    const currentItems = choices.ingredients.split(',').map(s => s.trim()).filter(s => s !== "");
    if (currentItems.includes(name)) {
      setChoices(prev => ({
        ...prev,
        ingredients: currentItems.filter(s => s !== name).join(', ')
      }));
    } else {
      setChoices(prev => ({
        ...prev,
        ingredients: choices.ingredients ? `${choices.ingredients}, ${name}` : name
      }));
    }
  };

  return (
    <div className="space-y-8 pt-12 px-6 step-transition">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-900 leading-tight">
          장바구니에<br/><span className="brand-orange-text">담아볼까요?</span>
        </h2>
        <p className="text-slate-600 font-bold text-lg">지금 시즌에 가장 좋은 재료들이에요.</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {items.map(item => (
          <TagButton
            key={item.name}
            label={item.name}
            subLabel={item.desc}
            selected={choices.ingredients.includes(item.name)}
            onClick={() => toggleItem(item.name)}
          />
        ))}
      </div>

      <div className="pt-6 space-y-4">
        <button
          onClick={onMore}
          className="w-full py-5 bg-white border-2 border-[#ff5d01] text-[#ff5d01] text-lg font-bold rounded-2xl shadow-sm hover:bg-orange-50 transition-all"
        >
          🔍 다른 재료 더 보기
        </button>
        <button
          onClick={onNext}
          disabled={!choices.ingredients.trim()}
          className="w-full py-5 bg-[#ff5d01] text-white text-lg font-bold rounded-2xl shadow-lg shadow-orange-100 disabled:opacity-30 transition-all active:scale-95"
        >
          재료 선택 완료
        </button>
        <button onClick={onBack} className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors">이전으로</button>
      </div>
    </div>
  );
};

export default SeasonalStep;
