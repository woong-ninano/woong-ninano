
import React from 'react';

interface Props {
  onFridge: () => void;
  onSeasonal: () => void;
  onConvenience: () => void;
  onBack: () => void;
}

const ModeSelectionStep: React.FC<Props> = ({ onFridge, onSeasonal, onConvenience, onBack }) => {
  return (
    <div className="space-y-6 pt-10 px-6 step-transition overflow-y-auto pb-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900">어떻게 시작할까요?</h2>
        <p className="text-slate-600 font-bold">원하시는 추천 방식을 선택해 주세요.</p>
      </div>
      
      <div className="grid gap-4">
        <button
          onClick={onFridge}
          className="w-full p-6 text-left toss-card border border-slate-50 hover:border-orange-500 group transition-all"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-3xl">🧊</span>
            <span className="text-slate-300 group-hover:text-orange-500 transition-colors">➔</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800">냉장고 뒤지기</h3>
          <p className="text-slate-500 text-sm font-medium mt-1">남은 재료로 만드는 기적의 레시피</p>
        </button>

        <button
          onClick={onSeasonal}
          className="w-full p-6 text-left toss-card border border-slate-50 hover:border-orange-500 group transition-all"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-3xl">🌿</span>
            <span className="text-slate-300 group-hover:text-orange-500 transition-colors">➔</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800">제철 재료로 요리</h3>
          <p className="text-slate-500 text-sm font-medium mt-1">지금 가장 맛있는 재료 추천받기</p>
        </button>

        <button
          onClick={onConvenience}
          className="w-full p-6 text-left toss-card border border-slate-50 hover:border-orange-500 group transition-all"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-3xl">🏪</span>
            <span className="text-slate-300 group-hover:text-orange-500 transition-colors">➔</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800">자취생 편의점 꿀조합</h3>
          <p className="text-slate-500 text-sm font-medium mt-1">편의점 재료로 만드는 초간단 맛도리</p>
        </button>
      </div>

      <button onClick={onBack} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors">뒤로 가기</button>
    </div>
  );
};

export default ModeSelectionStep;
