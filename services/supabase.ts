
import { createClient, User } from '@supabase/supabase-js';
import { RecipeResult, Comment } from '../types';

// 환경 변수 가져오기
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

/**
 * AUTHENTICATION
 */
export const signInWithGoogle = async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin, // 로그인 후 현재 페이지로 복귀
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) console.error('Login failed:', error);
};

export const signOut = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
};

/**
 * DATABASE - RECIPES
 */
export const saveRecipeToDB = async (recipe: RecipeResult) => {
  if (!supabase) {
    console.error("Supabase client is not initialized.");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('recipes')
      .insert([
        {
          dish_name: recipe.dishName,
          full_json: recipe,
          download_count: 0,
          rating_sum: 0,
          rating_count: 0,
          vote_success: 0,
          vote_fail: 0
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving recipe to Supabase:', error.message, error.details);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Unexpected exception while saving recipe:', err);
    return null;
  }
};

export const fetchCommunityRecipes = async (
  search: string, 
  sortBy: 'latest' | 'rating' | 'success' | 'comments'
): Promise<RecipeResult[]> => {
  if (!supabase) return [];

  // 댓글 수(count)를 함께 가져오기 위해 select 수정
  let query = supabase
    .from('recipes')
    .select('*, comments(count)');

  // 검색 필터
  if (search) {
    query = query.ilike('dish_name', `%${search}%`);
  }

  // 정렬 조건 (DB Fetch 전략)
  if (sortBy === 'rating') {
    query = query.order('rating_sum', { ascending: false });
  } else if (sortBy === 'success') {
    query = query.order('vote_success', { ascending: false });
  } else {
    // 'latest' 또는 'comments'일 경우 기본적으로 최신순으로 가져온 뒤 처리
    // ID를 보조 정렬로 추가하여 동일 시간대 생성물 정렬 보장
    query = query.order('created_at', { ascending: false }).order('id', { ascending: false });
  }

  // 최대 50개 제한
  query = query.limit(50);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching community recipes:', error);
    return [];
  }

  // DB 데이터를 RecipeResult 형태로 매핑
  const formattedData = data.map((row: any) => ({
    ...row.full_json,
    id: row.id,
    created_at: row.created_at,
    rating_sum: row.rating_sum,
    rating_count: row.rating_count,
    download_count: row.download_count,
    vote_success: row.vote_success || 0,
    vote_fail: row.vote_fail || 0,
    comment_count: row.comments?.[0]?.count || 0
  }));

  // 클라이언트 사이드 정렬 수행
  if (sortBy === 'comments') {
    formattedData.sort((a: RecipeResult, b: RecipeResult) => (b.comment_count || 0) - (a.comment_count || 0));
  } else if (sortBy === 'rating') {
    formattedData.sort((a: RecipeResult, b: RecipeResult) => {
      const avgA = (a.rating_count && a.rating_count > 0) ? (a.rating_sum || 0) / a.rating_count : 0;
      const avgB = (b.rating_count && b.rating_count > 0) ? (b.rating_sum || 0) / b.rating_count : 0;
      if (avgB !== avgA) return avgB - avgA;
      return (b.rating_count || 0) - (a.rating_count || 0);
    });
  }

  return formattedData;
};

export const incrementDownloadCount = async (id: number) => {
  if (!id || !supabase) return;
  try {
    const { data: current } = await supabase
      .from('recipes')
      .select('download_count')
      .eq('id', id)
      .single();
    if (current) {
      await supabase
        .from('recipes')
        .update({ download_count: current.download_count + 1 })
        .eq('id', id);
    }
  } catch (err) {
    console.error('Error updating download count:', err);
  }
};

export const updateRating = async (id: number, score: number) => {
  if (!id || !supabase) return;
  try {
    const { data: current } = await supabase
      .from('recipes')
      .select('rating_sum, rating_count')
      .eq('id', id)
      .single();
    if (current) {
      await supabase
        .from('recipes')
        .update({ 
          rating_sum: current.rating_sum + score,
          rating_count: current.rating_count + 1
        })
        .eq('id', id);
    }
  } catch (err) {
    console.error('Error updating rating:', err);
  }
};

export const updateVoteCounts = async (id: number, successDelta: number, failDelta: number) => {
  if (!id || !supabase) return;
  try {
    const { data: current } = await supabase
      .from('recipes')
      .select('vote_success, vote_fail')
      .eq('id', id)
      .single();
    if (current) {
      const newSuccess = Math.max(0, current.vote_success + successDelta);
      const newFail = Math.max(0, current.vote_fail + failDelta);
      await supabase
        .from('recipes')
        .update({ 
          vote_success: newSuccess,
          vote_fail: newFail
        })
        .eq('id', id);
    }
  } catch (err) {
    console.error('Error updating vote:', err);
  }
};

export const fetchComments = async (recipeId: number): Promise<Comment[]> => {
  if (!supabase || !recipeId) return [];
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
  return data as Comment[];
};

export const addComment = async (recipeId: number, userId: string, userEmail: string, content: string): Promise<Comment | null> => {
  if (!supabase || !recipeId || !userId) return null;
  const { data, error } = await supabase
    .from('comments')
    .insert([{ recipe_id: recipeId, user_id: userId, user_email: userEmail, content: content }])
    .select()
    .single();
  if (error) {
    console.error('Error adding comment:', error);
    return null;
  }
  return data as Comment;
};
