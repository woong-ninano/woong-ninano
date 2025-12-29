
import React, { useState } from 'react';

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const updateHistory = [
    {
      version: "v1.5.4",
      tag: "Speed",
      date: "2025.12.27",
      changes: [
        "⚡️ 커뮤니티 로딩 속도 획기적 개선 (무한 스크롤 적용)",
        "🖼️ 이미지 처리 방식 최적화 (Base64 → Storage URL)",
        "📉 데이터 조회 쿼리 경량화 및 DB 인덱싱 적용",
        "📱 모바일 데이터 절약 및 스크롤 경험 개선"
      ]
    },
    {
      version: "v1.5.3",
      tag: "Patch",
      date: "2025.12.26",
      changes: [
        "🔄 커뮤니티: 실시간 데이터 동기화를 위한 '수동 새로고침' 버튼 추가",
        "🚀 최신순 정렬 로직 보강 (동시간대 생성 데이터 정렬 정확도 개선)",
        "🛠️ 서버 저장 안정성 강화 및 상세 에러 로깅 시스템 구축",
        "🎨 커뮤니티 리스트 카드 레이아웃 및 로딩 애니메이션 개선"
      ]
    },
    {
      version: "v1.5.2",
      tag: "Patch",
      date: "2025.12.26",
      changes: [
        "🔄 편의점 모드: '식사' ↔ '간식' 목록 간편 전환 버튼 추가",
        "🍱 식사 추천 목록으로 돌아가기 기능 지원"
      ]
    },
    {
      version: "v1.5.1",
      tag: "Patch",
      date: "2025.12.26",
      changes: [
        "📱 모바일 크롬 브라우저 터치 인식 및 버튼 사용성 개선",
        "🔑 레시피 결과 화면 상단에 '로그인' 버튼 추가",
        "🎨 커뮤니티 카드 UI 개선 (별점순/성공순/댓글순/다운순 정렬, 아이콘 변경)"
      ]
    },
    {
      version: "v1.5.0",
      tag: "System",
      date: "2025.12.25",
      changes: [
        "☁️ Vercel 배포 환경 완벽 대응 (환경변수 로직 개선)",
        "🗄️ Supabase 데이터베이스 테이블 스키마 최신화",
        "🔧 로그인 및 DB 연결 안정성 강화",
        "🐛 기타 버그 수정 및 성능 최적화"
      ]
    },
    {
      version: "v1.4.0",
      tag: "Feature",
      date: "2025.12.24",
      changes: [
        "👥 커뮤니티 기능 오픈! 다른 사람들의 레시피를 구경하세요.",
        "🔍 요리 검색 및 필터(최신/인기/별점순) 기능 추가",
        "💾 레시피 생성 시 DB 자동 저장 시스템 강화",
        "📱 하단 네비게이션 바로 홈/커뮤니티 간편 이동"
      ]
    },
    {
      version: "v1.3.0",
      tag: "Major",
      date: "2025.12.23",
      changes: [
        "🔐 구글 로그인 연동 및 사용자 인증 시스템 적용",
        "💬 레시피별 댓글 작성 및 커뮤니티 기능 오픈",
        "🛡️ 인증된 사용자만 참여 가능한 클린 리뷰(별점/투표) 시스템",
        "💾 로그인 리다이렉트 시 진행 중인 레시피 자동 복구 기능"
      ]
    },
    {
      version: "v1.2.8",
      tag: "Speed",
      date: "2025.12.22",
      changes: [
        "⚡️ 레시피 생성 속도 대폭 개선 (Gemini 3 Flash 모델 적용)",
        "🚀 편의점/제철 요리 추천 반응 속도 최적화"
      ]
    },
    {
      version: "v1.2.7",
      tag: "NEW",
      date: "2025.12.21",
      changes: [
        "🏪 편의점 모드: '간식/디저트' 전용 추천 옵션 추가",
        "🔄 결과 화면: '다른 추천 메뉴' 클릭 시 해당 레시피 바로 생성",
        "🔗 참고 링크 클릭 이동 지원 및 중복 UI 제거",
        "🦶 하단 푸터 'Powered by 퓨전요리연구소' 브랜딩 적용"
      ]
    },
    {
      version: "v1.0.0",
      tag: "Launch",
      date: "2025.12.18",
      changes: [
        "🎉 '오늘 뭐 해먹지?' 서비스 정식 런칭",
        "🧊 냉장고 파먹기(재료 기반 추천) 핵심 기능 탑재",
        "👨‍🍳 AI 셰프의 맞춤형 레시피 생성 엔진 적용"
      ]
    }
  ];

  return (
    <>
      <div className="flex flex-col items-center justify-between h-full py-12 px-6 animate-fadeIn relative z-10">
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
            <p className="text-slate-600 font-bold text-lg leading-relaxed">
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
          <div className="text-center space-y-2">
            <p className="text-[11px] text-slate-400 font-bold tracking-[0.2em] uppercase">
              AI Global Fusion Recipe Service
            </p>
            <button 
              onClick={() => setShowUpdateModal(true)}
              className="text-xs text-slate-500 font-bold hover:text-[#ff5d01] transition-colors underline decoration-slate-300 underline-offset-4 decoration-2"
            >
              v1.5.4 Update Note
            </button>
          </div>
        </div>
      </div>

      {/* Update History Modal */}
      {showUpdateModal && (
        <div className="absolute inset-0 z-50 flex items-end justify-center" style={{ margin: '-24px -24px -90px -24px' }}>
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fadeIn"
            onClick={() => setShowUpdateModal(false)}
          ></div>
          <div className="bg-white w-full h-[85vh] rounded-t-[32px] p-8 pb-20 shadow-2xl relative z-10 animate-[slideUp_0.3s_ease-out_forwards] flex flex-col">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6 shrink-0"></div>
            
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-2xl font-black text-slate-900">
                히스토리
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
                <div key={idx} className="space-y-4 relative">
                  {/* Timeline Connector */}
                  {idx < updateHistory.length - 1 && (
                    <div className="absolute left-[11px] top-10 bottom-[-24px] w-0.5 bg-slate-100 -z-10"></div>
                  )}

                  <div className="flex items-center justify-between sticky top-0 bg-white py-2 z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-20 ${idx === 0 ? 'bg-[#ff5d01] text-white shadow-md shadow-orange-200' : 'bg-slate-100 text-slate-400'}`}>
                        {idx === 0 ? '★' : 'v'}
                      </div>
                      <span className={`text-lg font-black ${idx === 0 ? 'text-slate-900' : 'text-slate-600'}`}>
                        {update.version}
                      </span>
                      {update.tag && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          update.tag === 'NEW' || update.tag === 'Speed' ? 'bg-orange-100 text-[#ff5d01]' : 
                          update.tag === 'Major' ? 'bg-purple-100 text-purple-600' :
                          update.tag === 'Feature' ? 'bg-blue-100 text-blue-600' :
                          update.tag === 'System' ? 'bg-slate-200 text-slate-700' :
                          update.tag === 'Patch' ? 'bg-emerald-100 text-emerald-600' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {update.tag}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-300 font-medium font-mono">{update.date}</span>
                  </div>
                  
                  <ul className="space-y-3 pl-9">
                    {update.changes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-600 font-medium leading-relaxed text-[13px]">
                        <span className="text-slate-300 mt-1.5 w-1 h-1 rounded-full bg-current block flex-shrink-0"></span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowUpdateModal(false)}
              className="w-full py-4 bg-[#ff5d01] text-white font-bold rounded-2xl hover:bg-[#e04d01] transition-colors mt-6 shrink-0 shadow-lg shadow-orange-100 active:scale-95"
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
