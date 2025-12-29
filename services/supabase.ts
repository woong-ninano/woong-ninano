
import { createClient, User } from '@supabase/supabase-js';
import { RecipeResult, Comment } from '../types';

// 환경 변수 가져오기
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

/**
 * UTILS
 */
// Base64 문자열을 Blob으로 변환하는 헬퍼 함수
const base64ToBlob = (base64: string): Blob => {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
};

// 이미지를 Supabase Storage에 업로드하고 Public URL을 반환하는 함수
const uploadImageToStorage = async (base64Image: string): Promise<string | null> => {
  if (!supabase) return null;

  try {
    const blob = base64ToBlob(base64Image);
    // 파일명 생성 (Timestamp + Random)
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.png`;
    
    // 'recipe-images' 버킷에 업로드 (버킷이 미리 생성되어 있어야 함)
    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Image upload failed:', uploadError);
      return null;
    }

    // Public URL 가져오기
    const { data } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (err) {
    console.error('Error processing image:', err);
    return null;
  }
};

/**
 * AUTHENTICATION
 */
export const signInWithGoogle = async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
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
    let finalImageUrl = recipe.imageUrl;

    // Base64 이미지라면 Storage에 업로드 후 URL로 교체
    if (recipe.imageUrl && recipe.imageUrl.startsWith('data:image')) {
      const uploadedUrl = await uploadImageToStorage(recipe.imageUrl);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    }

    // DB에 저장할 객체 (full_json 내의 이미지 URL도 업데이트)
    const recipeToSave = { ...recipe, imageUrl: finalImageUrl };

    const { data, error } = await supabase
      .from('recipes')
      .insert([
        {
          dish_name: recipe.dishName,
          image_url: finalImageUrl, // 별도 컬럼 저장 (Select 최적화)
          comment: recipe.comment,  // 별도 컬럼 저장 (Select 최적화)
          full_json: recipeToSave,
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

// Pagination 및 경량화된 Select 적용
export const fetchCommunityRecipes = async (
  search: string, 
  sortBy: 'latest' | 'rating' | 'success' | 'comments',
  page: number = 0,
  pageSize: number = 5 // Changed default from 10 to 5
): Promise<RecipeResult[]> => {
  if (!supabase) return [];

  // [Optimization #2] full_json을 제외하고 필요한 컬럼만 명시적으로 선택
  // 중요: full_json을 가져오지 않으므로, 데이터가 가벼워져 속도가 대폭 향상됨.
  // 단, dish_name, image_url 컬럼이 DB에 채워져 있어야 함 (마이그레이션 필수)
  let query = supabase
    .from('recipes')
    .select(`
      id, 
      dish_name, 
      image_url, 
      comment, 
      created_at, 
      rating_sum, 
      rating_count, 
      vote_success, 
      vote_fail, 
      download_count,
      comments(count)
    `);

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
    query = query.order('created_at', { ascending: false }).order('id', { ascending: false });
  }

  // [Optimization #4] Pagination (Range)
  const from = page * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching community recipes:', error);
    return [];
  }

  // DB 데이터를 RecipeResult 형태로 매핑
  const formattedData = data.map((row: any) => {
    return {
      // full_json을 가져오지 않으므로 필요한 필드는 DB 컬럼에서 직접 매핑
      // fallback을 사용하여 기존 데이터가 마이그레이션 되지 않았을 때 깨짐 방지 (완벽하진 않음)
      id: row.id,
      dishName: row.dish_name || '이름 없는 레시피',
      imageUrl: row.image_url, 
      comment: row.comment || '설명이 없습니다.',
      ingredientsList: '', // 리스트 뷰에서는 불필요
      easyRecipe: '', // 리스트 뷰에서는 불필요
      gourmetRecipe: '', // 리스트 뷰에서는 불필요
      similarRecipes: [],
      referenceLinks: [],
      
      created_at: row.created_at,
      rating_sum: row.rating_sum,
      rating_count: row.rating_count,
      download_count: row.download_count,
      vote_success: row.vote_success || 0,
      vote_fail: row.vote_fail || 0,
      comment_count: row.comments?.[0]?.count || 0
    };
  });

  // 클라이언트 사이드 정렬 (DB에서 해결하기 어려운 복합 정렬 보완)
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
