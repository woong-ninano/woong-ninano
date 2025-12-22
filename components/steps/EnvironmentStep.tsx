
import React from 'react';
import { UserChoices } from '../../types';

interface Props {
  choices: UserChoices;
  setChoices: React.Dispatch<React.SetStateAction<UserChoices>>;
  onGenerate: () => void;
  onBack: () => void;
}

const LEVELS = ['Lv.1 요린이', 'Lv.2 평범한 주부', 'Lv.3 주방의 고수'];

const EnvironmentStep: React.FC<Props> = ({ choices, setChoices, onGenerate, onBack }) => {
  return (
    <div className="space-y-12 step-transition pt-12 pb-10 px-6">
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900">거의 다 됐어요!</h2>
          <p className="text-slate-400 font-bold text-lg">요리 실력에 맞춰 설명해 드릴게요.</p>
        </div>
        
        <div className="space-y-3">
          {LEVELS.map(lv => (
            <button
              key={lv}
              onClick={() => setChoices(prev => ({ ...prev, level: lv }))}
              className={`w-full p-6 rounded-3xl text-left font-bold transition-all border-2 ${
                choices.level === lv
                  ? 'border-[#ff5d01] bg-orange-50 text-[#ff5d01] shadow-md'
                  : 'border-slate-100 bg-white text-slate-500'
              }`}
            >
              {lv}
            </button>
          ))}
        </div>
      </section>

      <div className="pt-6 space-y-4">
        <button
          onClick={onGenerate}
          className="w-full py-7 bg-[#ff5d01] text-white text-2xl font-black rounded-3xl shadow-2xl shadow-orange-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
        >
          ✨ 레시피 완성하기
        </button>
        <button onClick={onBack} className="w-full py-2 text-slate-300 font-bold">
          이전으로
        </button>
      </div>
    </div>
  );
};

export default EnvironmentStep;
