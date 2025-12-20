
import React from 'react';
import TagButton from '../TagButton';

interface Item {
  name: string;
  desc: string;
}

interface Props {
  items: Item[];
  onSelect: (itemName: string) => void;
  onBack: () => void;
}

const ConvenienceStep: React.FC<Props> = ({ items, onSelect, onBack }) => {
  return (
    <div className="space-y-8 pt-12 step-transition pb-20">
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

      <button onClick={onBack} className="w-full py-2 text-slate-400 font-bold">이전으로</button>
    </div>
  );
};

export default ConvenienceStep;
