
import React, { useState } from 'react';

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const updateHistory = [
    {
      version: "v1.2.4",
      tag: "NEW",
      changes: [
        "🔍 편의점 메뉴 목록 '더 보기' 기능 (누적)",
        "🛒 재료 목록 가독성 개선 (1열 변경)",
        "➡️ 레시피 '다음/이전 레시피 보기' 지원"
      ]
    },
    {
      version: "v1.2.3",
      changes: [
        "➡️ 레시피 '다음 레시피 보기' 기능 추가",
        "🔍 편의점 꿀조합 '더 보기' 기능 개선",
        "🛒 레시피 결과에 '필요 재료 목록' 표기"
      ]
    },
    {
      version: "v1.2.2",
      changes: [
        "🏪 자취생/편의점 꿀조합 요리 모드 추가",
        "🔄 편의점 꿀조합 '다른 요리 추천받기' 기능",
        "📸 고품질 요리 이미지 생성 지원"
      ]
    }
  ];

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
              v1.2.4
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
          <div className="bg-white w-full h-[80vh] rounded-t-[32px] p-8 pb-10 shadow-2xl relative z-10 animate-[slideUp_0.3s_ease-out_forwards] flex flex-col">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6 shrink-0"></div>
            
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-2xl font-black text-slate-900">
                업데이트 노트
              </h3>
              <button 
                onClick={() => setShowUpdateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-8 pr-2 custom-scrollbar">
              {updateHistory.map((update, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex items-center gap-3 sticky top-0 bg-white py-2 z-10">
                    <span className="text-lg font-black text-slate-800">{update.version}</span>
                    {update.tag && (
                      <span className="bg-orange-100 text-[#ff5d01] text-[10px] font-black px-2 py-1 rounded-md">
                        {update.tag}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-3 pl-1">
                    {update.changes.map((note, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-600 font-medium leading-relaxed text-sm">
                        <span className="text-[#ff5d01] mt-1.5 w-1.5 h-1.5 rounded-full bg-[#ff5d01] block flex-shrink-0"></span>
                        {note}
                      </li>
                    ))}
                  </ul>
                  {idx < updateHistory.length - 1 && (
                    <div className="h-px bg-slate-100 w-full mt-6"></div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowUpdateModal(false)}
              className="w-full py-4 bg-[#ff5d01] text-white font-bold rounded-2xl hover:bg-[#e04d01] transition-colors mt-6 shrink-0 shadow-lg shadow-orange-100"
            >
              확인
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #f1f5f9;
          border-radius: 20px;
        }
      `}</style>
    </>
  );
};

export default WelcomeStep;
