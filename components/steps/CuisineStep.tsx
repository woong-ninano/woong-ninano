
import React from 'react';
import { UserChoices } from '../../types';

interface Props {
  choices: UserChoices;
  setChoices: React.Dispatch<React.SetStateAction<UserChoices>>;
  onNext: () => void;
  onBack: () => void;
}

const CUISINES = [
  { id: '한식', icon: '🍚', label: '한식' },
  { id: '일식', icon: '🍣', label: '일식' },
  { id: '중식', icon: '🥢', label: '중식' },
  { id: '양식', icon: '🍝', label: '양식' },
  { id: '아시안 퓨전', icon: '🌶️', label: '아시안 퓨전' },
  { id: '유럽 퓨전', icon: '🧀', label: '유럽 퓨전' },
  { id: '남미/동남아', icon: '🥑', label: '남미/동남아' },
  { id: '자유 퓨전', icon: '🌈', label: '자유 퓨전' },
];

const CuisineStep: React.FC<Props> = ({ choices, setChoices, onNext, onBack }) => {
  return (
    <div className="space-y-8 pt-12 px-6 step-transition">
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900">어떤 스타일을 선호하세요?</h2>
        <p className="text-slate-500 font-medium">좋아하는 요리 스타일을 알려주세요.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CUISINES.map(c => (
          <button
            key={c.id}
            onClick={() => setChoices(prev => ({ ...prev, cuisine: c.id }))}
            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
              choices.cuisine === c.id
                ? 'border-[#ff5d01] bg-orange-50 text-[#ff5d01] font-bold'
                : 'border-slate-50 bg-white text-slate-500'
            }`}
          >
            <span className="text-3xl">{c.icon}</span>
            <span className="text-sm">{c.label}</span>
          </button>
        ))}
      </div>

      <div className="pt-6 space-y-4">
        <button
          onClick={onNext}
          className="w-full py-5 bg-[#ff5d01] text-white text-lg font-bold rounded-2xl shadow-lg"
        >
          다음으로
        </button>
        <button onClick={onBack} className="w-full py-2 text-slate-400 font-bold">이전으로</button>
      </div>
    </div>
  );
};

export default CuisineStep;
