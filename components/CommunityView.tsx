
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
  const [sortBy, setSortBy] = useState<'latest' | 'rating' | 'success' | 'comments'>('latest');

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const data = await fetchCommunityRecipes(searchTerm, sortBy);
      setRecipes(data);
    } catch (err) {
      console.error("Failed to load community recipes:", err);
    } finally {
      setLoading(false);
    }
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
    <div className="pt-8 px-6 animate-fadeIn pb-10">
      {/* Header Area */}
      <div className="flex justify-between items-start mb-6 relative z-50">
        <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900">
            모두의 <span className="brand-orange-text">레시피</span>
            </h2>
            <p className="text-slate-600 font-bold text-sm">
            다른 사람들의 맛있는 식탁을 엿보세요.
            </p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
            {/* User Profile / Login */}
            <div className="relative z-50">
                {user ? (
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                            {user.email?.split('@')[0]}님
                        </span>
                        <button 
                            onClick={signOut}
                            className="text-[10px] text-slate-400 underline hover:text-slate-600 transition-colors p-2 -mr-2 cursor-pointer touch-manipulation"
                        >
                            로그아웃
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={signInWithGoogle}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm hover:border-[#ff5d01] hover:text-[#ff5d01] transition-all flex items-center gap-1 active:scale-95 cursor-pointer touch-manipulation"
                    >
                        🔑 로그인
                    </button>
                )}
            </div>
            
            {/* Manual Refresh Button */}
            <button 
                onClick={loadRecipes}
                disabled={loading}
                className={`p-2 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:rotate-180 ${loading ? 'animate-spin opacity-50' : ''}`}
                title="새로고침"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                    <polyline points="21 3 21 8 16 8"></polyline>
                </svg>
            </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-4 mb-6 relative z-10">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="요리 이름 검색..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#ff5d01] transition-colors font-medium shadow-sm"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
          <button 
            type="submit" 
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors"
          >
            검색
          </button>
        </form>

        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {[
              { id: 'latest', label: '최신순' },
              { id: 'rating', label: '별점순' },
              { id: 'success', label: '성공순' },
              { id: 'comments', label: '댓글순' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSortBy(tab.id as any)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                sortBy === tab.id ? 'bg-white text-[#ff5d01] shadow-sm' : 'text-slate-400 hover:text-slate-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List Content */}
      <div className="space-y-4 relative z-0">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-orange-50 border-t-[#ff5d01] rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-400 animate-pulse">새로운 소식을 불러오는 중...</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-24 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
            <p className="text-slate-300 text-3xl mb-3">🍳</p>
            <p className="text-slate-400 text-sm font-medium">
              아직 레시피가 없거나 검색 결과가 없습니다.<br/>첫 번째 주인공이 되어보세요!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => onSelectRecipe(recipe)}
                className="w-full bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 text-left hover:border-orange-200 transition-all active:scale-[0.98] group"
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-[18px] bg-slate-50 overflow-hidden shrink-0 border border-slate-100 relative">
                    {recipe.imageUrl ? (
                      <img src={recipe.imageUrl} alt={recipe.dishName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🥣</div>
                    )}
                  </div>

                  {/* Content Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 truncate pr-2 group-hover:text-[#ff5d01] transition-colors">
                        {recipe.dishName}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium leading-relaxed">
                        "{recipe.comment}"
                      </p>
                    </div>
                    
                    {/* Stats Footer */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-400 mt-2">
                      <span className="flex items-center gap-1 text-yellow-500">
                        ⭐ {getStarAverage(recipe.rating_sum, recipe.rating_count)}
                      </span>
                      <span className="flex items-center gap-1 text-green-600">
                        😋 {recipe.vote_success || 0}
                      </span>
                      <span className="flex items-center gap-1 text-blue-500">
                        💬 {recipe.comment_count || 0}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        💾 {recipe.download_count || 0}
                      </span>
                      <span className="ml-auto text-slate-300 font-medium">
                        {new Date(recipe.created_at || '').toLocaleDateString().slice(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityView;
