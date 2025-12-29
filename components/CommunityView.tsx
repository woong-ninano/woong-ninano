
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchCommunityRecipes, signInWithGoogle, signOut, supabase } from '../services/supabase';
import { RecipeResult } from '../types';

interface Props {
  onSelectRecipe: (recipe: RecipeResult) => void;
  user: any | null;
}

const PAGE_SIZE = 8;

const CommunityView: React.FC<Props> = ({ onSelectRecipe, user }) => {
  const [recipes, setRecipes] = useState<RecipeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'rating' | 'success' | 'comments'>('latest');
  const [hasMore, setHasMore] = useState(true);
  
  // 페이지 상태를 Ref로 관리하여 loadRecipes 함수가 재생성되는 것을 방지
  const pageRef = useRef(0);
  const fetchingRef = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // 레시피를 가져오는 핵심 로직
  const loadRecipes = useCallback(async (isReset: boolean = false) => {
    if (fetchingRef.current || !supabase) return;
    
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      if (isReset) {
        pageRef.current = 0;
      }

      const targetPage = pageRef.current;
      const newRecipes = await fetchCommunityRecipes(searchTerm, sortBy, targetPage, PAGE_SIZE);
      
      setHasMore(newRecipes.length >= PAGE_SIZE);
      
      if (isReset) {
        setRecipes(newRecipes);
      } else {
        setRecipes(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const filtered = newRecipes.filter(r => !existingIds.has(r.id));
          return [...prev, ...filtered];
        });
      }
      
      // 다음 페이지 준비
      pageRef.current += 1;
    } catch (err) {
      console.error("Community Load Error:", err);
      setError("레시피를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [searchTerm, sortBy]); // pageRef는 의존성에 넣지 않음

  // 검색어 또는 정렬 기준 변경 시 초기화 및 로드
  useEffect(() => {
    if (!supabase) return;

    // 즉시 로딩 상태로 만들어 이전 데이터가 잠깐 보이는 현상 방지
    setRecipes([]);
    setHasMore(true);
    
    const timeoutId = setTimeout(() => {
      loadRecipes(true);
    }, 300); // 디바운싱

    return () => clearTimeout(timeoutId);
  }, [searchTerm, sortBy, loadRecipes]);

  // 무한 스크롤 관찰자 설정
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !supabase || loading || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !fetchingRef.current && hasMore) {
        loadRecipes(false);
      }
    }, { threshold: 0.1, rootMargin: '100px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadRecipes, hasMore, loading]);

  const getStarLabel = (sum?: number, count?: number) => {
    if (!sum || !count) return "0.0";
    return (sum / count).toFixed(1);
  };

  return (
    <div className="pt-8 px-6 animate-fadeIn pb-10 min-h-full max-w-full">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2 flex-1 min-w-0">
          <h2 className="text-3xl font-black text-slate-900 truncate">모두의 <span className="brand-orange-text">레시피</span></h2>
          <p className="text-slate-600 font-bold text-sm">요리 고수들의 조합을 훔쳐보세요.</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {user ? (
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200 truncate max-w-[80px]">
                {user.email?.split('@')[0]}
              </span>
              <button onClick={signOut} className="text-[9px] text-slate-400 underline mt-1">로그아웃</button>
            </div>
          ) : (
            <button onClick={signInWithGoogle} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 shadow-sm active:scale-95 transition-all">로그인</button>
          )}
          <button 
            onClick={() => loadRecipes(true)} 
            className="p-2 bg-slate-50 rounded-full hover:rotate-180 transition-transform active:bg-slate-100 disabled:opacity-50"
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
              <polyline points="21 3 21 8 16 8"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-4 mb-6 sticky top-0 bg-white/90 backdrop-blur-sm z-10 py-2">
        <div className="relative">
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="요리 이름 검색..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#ff5d01] shadow-sm"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 text-lg">🔍</span>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {[
            { id: 'latest', label: '최신' },
            { id: 'rating', label: '별점' },
            { id: 'success', label: '성공' },
            { id: 'comments', label: '댓글' }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setSortBy(tab.id as any)} 
              className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${sortBy === tab.id ? 'bg-white text-[#ff5d01] shadow-sm' : 'text-slate-400'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {recipes.map((recipe, idx) => (
          <button 
            key={`${recipe.id}-${idx}`} 
            onClick={() => onSelectRecipe(recipe)} 
            className="w-full bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex gap-4 text-left active:scale-[0.98] transition-all hover:border-orange-100 group"
          >
            <div className="w-20 h-20 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-50">
              <img src={recipe.thumbnailUrl || recipe.imageUrl || 'https://via.placeholder.com/150?text=No+Image'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
              <div>
                <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-[#ff5d01]">{recipe.dishName}</h3>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-1 font-medium">{recipe.comment}</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 mt-2">
                <span className="text-yellow-500">⭐ {getStarLabel(recipe.rating_sum, recipe.rating_count)}</span>
                <span className="text-green-500">😋 {recipe.vote_success}</span>
                <span className="ml-auto text-[9px] text-slate-300">
                  {recipe.created_at ? new Date(recipe.created_at).toLocaleDateString().slice(2) : ''}
                </span>
              </div>
            </div>
          </button>
        ))}
        
        {recipes.length === 0 && !loading && (
          <div className="text-center py-20 text-slate-300">
            <p className="text-4xl mb-3">🍳</p>
            <p className="text-sm font-bold">검색 결과가 없거나 레시피가 없어요.</p>
          </div>
        )}

        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-orange-100 border-t-[#ff5d01] rounded-full animate-spin"></div>
              <span className="text-xs text-slate-400 font-bold">로딩 중...</span>
            </div>
          )}
          {!hasMore && recipes.length > 0 && <span className="text-[10px] text-slate-300">마지막 레시피입니다.</span>}
        </div>
      </div>
    </div>
  );
};

export default CommunityView;
