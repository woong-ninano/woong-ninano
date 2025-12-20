
import React from 'react';
import TagButton from '../TagButton';

interface Item {
  name: string;
  desc: string;
}

interface Props {
  items: Item[];
  onSelect: (itemName: string) => void;
  onLoadMore: () => void;
  onBack: () => void;
}

const ConvenienceStep: React.FC<Props> = ({ items, onSelect, onLoadMore, onBack }) => {
  return (
    <div className="space-y-6 pt-12 step-transition pb-20">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-900 leading-tight">
          오늘은 편의점을<br/><span className="brand-orange-text">털어볼까요?</span>
        </h2>
        <p className="text-slate-500 font-medium">원하는 메뉴를 선택하면 조리법을 알려드려요.</p>
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
        <button
          onClick={onLoadMore}
          className="w-full py-5 bg-white border-2 border-[#ff5d01] text-[#ff5d01] text-lg font-bold rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          🔍 다른 요리 더 보기
        </button>
        
        <button onClick={onBack} className="w-full py-2 text-slate-400 font-bold mt-2">이전 화면으로</button>
      </div>
    </div>
  );
};

export default ConvenienceStep;
