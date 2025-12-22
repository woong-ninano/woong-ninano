
import React from 'react';
import { UserChoices } from '../../types';
import TagButton from '../TagButton';

interface Props {
  choices: UserChoices;
  setChoices: React.Dispatch<React.SetStateAction<UserChoices>>;
  suggestions: { subIngredients: string[], sauces: string[] };
  onNext: () => void;
  onBack: () => void;
}

const SuggestionStep: React.FC<Props> = ({ choices, setChoices, suggestions, onNext, onBack }) => {
  const toggleSauce = (sauce: string) => {
    setChoices(prev => ({
      ...prev,
      sauces: prev.sauces.includes(sauce)
        ? prev.sauces.filter(s => s !== sauce)
        : [...prev.sauces, sauce]
    }));
  };

  const toggleSubIngredient = (item: string) => {
    const current = choices.ingredients;
    if (current.includes(item)) {
      setChoices(prev => ({
        ...prev,
        ingredients: current.split(',').map(s => s.trim()).filter(s => s !== item).join(', ')
      }));
    } else {
      setChoices(prev => ({
        ...prev,
        ingredients: current ? `${current}, ${item}` : item
      }));
    }
  };

  return (
    <div className="space-y-10 step-transition pb-10 pt-12 px-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-900 leading-tight">
          맛을 더해줄<br/><span className="brand-orange-text">마법의 한 끗</span>
        </h2>
        <p className="text-slate-500 font-medium">추천 재료를 클릭해 추가해보세요.</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-[#ff5d01] rounded-full"></span> 어울리는 부재료
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {suggestions.subIngredients.map(item => (
            <TagButton
              key={item}
              label={item}
              selected={choices.ingredients.includes(item)}
              onClick={() => toggleSubIngredient(item)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-orange-300 rounded-full"></span> 찰떡궁합 양념
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {suggestions.sauces.map(sauce => (
            <TagButton
              key={sauce}
              label={sauce}
              selected={choices.sauces.includes(sauce)}
              onClick={() => toggleSauce(sauce)}
            />
          ))}
        </div>
      </section>

      <div className="pt-6 space-y-3">
        <button
          onClick={onNext}
          className="w-full py-6 bg-[#ff5d01] text-white text-xl font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98]"
        >
          선택 완료
        </button>
        <button onClick={onBack} className="w-full py-3 text-slate-400 font-bold">
          이전 단계로
        </button>
      </div>
    </div>
  );
};

export default SuggestionStep;
