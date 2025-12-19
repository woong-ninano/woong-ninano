
import React, { useEffect, useState } from 'react';

interface Props {
  customMessage?: string;
}

const LoadingStep: React.FC<Props> = ({ customMessage }) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = [
    "재료의 신선함을 체크하고 있어요",
    "최고의 퓨전 조합을 찾는 중입니다",
    "미슐랭 셰프의 지능을 빌려오고 있어요",
    "플레이팅 아이디어까지 생성하고 있어요"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-12 animate-fadeIn">
      <div className="relative">
        <div className="w-32 h-32 border-8 border-orange-50 border-t-[#ff5d01] rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-5xl">🥕</div>
      </div>
      <div className="text-center space-y-4 px-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI 셰프가 요리 중...</h2>
        <p className="brand-orange-text font-bold text-lg h-8 transition-all">
          {customMessage || `"${messages[msgIdx]}"`}
        </p>
      </div>
    </div>
  );
};

export default LoadingStep;
