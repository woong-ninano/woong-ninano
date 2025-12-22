
import React, { useState, useEffect } from 'react';
import { fetchCommunityRecipes, signInWithGoogle, signOut } from '../services/supabase';
import { RecipeResult } from '../types';
import { User } from '@supabase/supabase-js';

interface Props {
  onSelectRecipe: (recipe: RecipeResult) => void;
  user: User | null;
}

const CommunityView: React.FC<Props> = ({ onSelectRecipe, user }) => {
  const [recipes, setRecipes] = useState<RecipeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'rating'>('latest');

  const loadRecipes = async () => {
    setLoading(true);
    const data = await fetchCommunityRecipes(searchTerm, sortBy);
    setRecipes(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRecipes();
  }, [sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadRecipes();
  };

  const getStarAverage = (sum?: number, count?: number) => {
    if (!sum || !count || count === 0) return "0.0";
    return (sum / count).toFixed(1);
  };

  return (
    <div className="pt-8 px-6 animate-fadeIn">
      {/* Header Area with Login */}
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900">
            모두의 <span className="brand-orange-text">레시피</span>
            </h2>
            <p className="text-slate-600 font-bold text-sm">
            다른 사람들의 맛있는 식탁을 엿보세요.
            </p>
        </div>
        {/* User Profile / Login */}
        <div className="pt-1">
            {user ? (
                <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                        {user.email?.split('@')[0]}님
                    </span>
                    <button 
                        onClick={signOut}
                        className="text-[10px] text-slate-400 underline hover:text-slate-600 transition-colors"
                    >
                        로그아웃
                    </button>
                </div>
            ) : (
                <button
                    onClick={signInWithGoogle}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm hover:border-[#ff5d01] hover:text-[#ff5d01] transition-all flex items-center gap-1 active:scale-95"
                >
                    <span className="text-xs">🔑</span> 로그인
                </button>
            )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-4 mb-6">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="요리 이름 검색..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#ff5d01] transition-colors font-medium"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
          <button 
            type="submit" 
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors"
          >
            검색
          </button>
        </form>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSortBy('latest')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              sortBy === 'latest' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-500'
            }`}
          >
            최신순
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              sortBy === 'popular' ? 'bg-white text-[#ff5d01] shadow-sm' : 'text-slate-400 hover:text-slate-500'
            }`}
          >
            인기순 (저장)
          </button>
          <button
            onClick={() => setSortBy('rating')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              sortBy === 'rating' ? 'bg-white text-yellow-500 shadow-sm' : 'text-slate-400 hover:text-slate-500'
            }`}
          >
            별점순
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4 pb-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-orange-100 border-t-[#ff5d01] rounded-full animate-spin"></div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm font-medium">
            검색 결과가 없습니다.<br/>직접 첫 번째 레시피를 만들어보세요!
          </div>
        ) : (
          recipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => onSelectRecipe(recipe)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-left hover:border-orange-200 transition-all active:scale-[0.98] group"
            >
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 relative">
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt={recipe.dishName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🍳</div>
                  )}
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 truncate pr-2">
                      {recipe.dishName}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium">
                      "{recipe.comment}"
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1 text-yellow-500">
                      ⭐ {getStarAverage(recipe.rating_sum, recipe.rating_count)}
                    </span>
                    <span className="flex items-center gap-1">
                      📄 {recipe.download_count || 0} 저장
                    </span>
                    <span className="ml-auto text-[10px] bg-slate-50 px-1.5 py-0.5 rounded text-slate-300 font-medium">
                      {new Date(recipe.created_at || '').toLocaleDateString().slice(2)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityView;
