
import React, { useState } from 'react';

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center justify-between h-full py-12 animate-fadeIn relative z-10">
        <div className="flex-1 flex flex-col items-center justify-center space-y-10 w-full">
          <div className="relative">
            <div className="w-40 h-40 bg-[#FFF3ED] rounded-[40px] absolute -z-10 rotate-6 scale-110"></div>
            <div className="w-40 h-40 bg-white shadow-2xl rounded-[40px] flex items-center justify-center text-7xl">
              🥘
            </div>
          </div>
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-snug">
              웅아!<br/><span className="brand-orange-text">오늘 뭐 해먹지?</span>
            </h1>
            <p className="text-slate-500 text-lg font-medium leading-relaxed">
              세상의 모든 재료를 조합하여<br/>당신만을 위한 퓨전 미식을 제안합니다.
            </p>
          </div>
        </div>
        
        <div className="w-full space-y-6 flex flex-col items-center">
          <button
            onClick={onNext}
            className="w-full py-6 bg-[#ff5d01] text-white text-xl font-bold rounded-2xl shadow-xl hover:bg-[#e04d01] transition-all active:scale-95"
          >
            메뉴 추천 받기
          </button>
          <div className="text-center space-y-1">
            <p className="text-[11px] text-slate-300 font-bold tracking-[0.2em] uppercase">
              AI Global Fusion Recipe Service
            </p>
            <button 
              onClick={() => setShowUpdateModal(true)}
              className="text-[10px] text-slate-300 font-bold hover:text-[#ff5d01] transition-colors underline decoration-slate-200 underline-offset-2"
            >
              v1.2.1
            </button>
          </div>
        </div>
      </div>

      {/* Update History Modal */}
      {showUpdateModal && (
        <div className="absolute inset-0 z-50 flex items-end justify-center" style={{ margin: '-24px -24px -48px -24px' }}>
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fadeIn"
            onClick={() => setShowUpdateModal(false)}
          ></div>
          <div className="bg-white w-full rounded-t-[32px] p-8 pb-10 shadow-2xl relative z-10 animate-[slideUp_0.3s_ease-out_forwards]">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="bg-orange-100 text-[#ff5d01] text-xs font-black px-2 py-1 rounded-md">NEW</span>
                <h3 className="text-xl font-black text-slate-900">
                  v1.2.1 업데이트 노트
                </h3>
              </div>
              
              <ul className="space-y-4">
                {[
                  "🏪 자취생/편의점 꿀조합 요리 모드 추가!",
                  "🛒 레시피 결과에 '필요 재료 목록' 추가",
                  "📸 요리 이미지 생성 기능 고도화",
                  "🔄 같은 재료 다른 레시피 추천 기능",
                  "⬅️ 이전 레시피 다시보기 기능"
                ].map((note, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 font-medium leading-relaxed">
                    <span className="text-[#ff5d01] mt-1.5 w-1.5 h-1.5 rounded-full bg-[#ff5d01] block flex-shrink-0"></span>
                    {note}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowUpdateModal(false)}
                className="w-full py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-colors mt-4"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WelcomeStep;
