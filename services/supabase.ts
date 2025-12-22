
import { createClient } from '@supabase/supabase-js';
import { RecipeResult } from '../types';

// 환경 변수 가져오기 (설정되지 않았을 경우 undefined)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// URL과 Key가 유효한 경우에만 클라이언트 생성
// 환경 변수가 없으면 null을 할당하여 앱이 크래시되지 않고 로컬 모드로 동작하게 함
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// 1. 레시피 저장하기
export const saveRecipeToDB = async (recipe: RecipeResult) => {
  if (!supabase) return null; // Supabase가 연결되지 않았으면 저장하지 않음

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
      console.error('Error saving recipe:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Unexpected error saving recipe:', err);
    return null;
  }
};

// 2. 다운로드 수 증가
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

// 3. 별점 주기
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

// 4. 성공/실패 투표
export const updateVote = async (id: number, type: 'success' | 'fail') => {
  if (!id || !supabase) return;

  const field = type === 'success' ? 'vote_success' : 'vote_fail';
  
  try {
    const { data: current } = await supabase
      .from('recipes')
      .select(field)
      .eq('id', id)
      .single();

    if (current) {
      await supabase
        .from('recipes')
        .update({ [field]: current[field] + 1 })
        .eq('id', id);
    }
  } catch (err) {
    console.error('Error updating vote:', err);
  }
};
