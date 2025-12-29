
import { GoogleGenAI, Type } from "@google/genai";
import { UserChoices, RecipeResult } from "../types";

// AI 인스턴스 생성
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * AI 응답 텍스트에서 순수 JSON 부분만 추출하는 헬퍼 함수
 */
const parseSafeJSON = (text: string | undefined): any => {
  if (!text) return null;
  try {
    // 마크다운 코드 블록 제거 및 순수 JSON 추출
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON Parsing Error. Original text:", text);
    return null;
  }
};

export const fetchSeasonalIngredients = async (excluded: string[] = []) => {
  const currentMonth = new Date().getMonth() + 1;
  const ai = getAI();
  const prompt = `대한민국의 ${currentMonth}월에 가장 맛있는 제철 식재료 8개를 알려줘. 
  이미 추천한 재료들(${excluded.join(', ')})은 제외해줘. 
  각 재료별로 한 줄 요약(맛이나 영양)을 포함해줘. JSON 형식으로만 응답해줘.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  desc: { type: Type.STRING }
                },
                required: ["name", "desc"]
              }
            }
          },
          required: ["items"]
        }
      }
    });
    const result = parseSafeJSON(response.text);
    return result?.items || [];
  } catch (e) {
    console.error("Seasonal items fetch failed", e);
    return [];
  }
};

export const fetchConvenienceTopics = async (excluded: string[] = [], category: 'meal' | 'snack' = 'meal') => {
  const ai = getAI();
  const now = new Date();
  const hour = now.getHours();
  let timeContext = hour >= 5 && hour < 11 ? "아침" : hour < 14 ? "점심" : hour < 17 ? "오후" : hour < 22 ? "저녁" : "야식";
  
  const prompt = `편의점 재료 꿀조합 레시피 6개를 추천해줘. 카테고리: ${category === 'meal' ? '식사' : '간식'}. 시간대: ${timeContext}. 제외할 재료: ${excluded.join(', ')}. JSON 형식 { items: [{ name, desc }] } 로 반환해.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  desc: { type: Type.STRING }
                },
                required: ["name", "desc"]
              }
            }
          },
          required: ["items"]
        }
      }
    });
    const result = parseSafeJSON(response.text);
    return result?.items || [];
  } catch (e) {
    console.error("Convenience topics fetch failed", e);
    return [];
  }
};

export const fetchSuggestions = async (ingredients: string) => {
  try {
    const ai = getAI();
    const prompt = `재료: "${ingredients}". 이 재료들과 어울리는 부재료 6개, 양념 6개를 한국어로 추천해줘. JSON 형식으로 반환해.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            sauces: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["subIngredients", "sauces"]
        }
      }
    });
    const result = parseSafeJSON(response.text);
    return result || { subIngredients: [], sauces: [] };
  } catch (error) {
    console.error("Suggestions fetch failed", error);
    return { subIngredients: [], sauces: [] };
  }
};

export const generateRecipe = async (choices: UserChoices, isRegenerate: boolean = false): Promise<RecipeResult> => {
  const ai = getAI();
  const prompt = `[Mission] ${choices.mode} 모드 레시피 생성. 
  - 재료: ${choices.ingredients}
  - 양념: ${choices.sauces.join(', ')}
  - 스타일: ${choices.cuisine}
  - 대상: ${choices.partner}
  - 테마: ${choices.theme}
  - 난이도: ${choices.level}
  ${isRegenerate ? "이전과 다른 새로운 레시피를 제안해줘." : ""} 
  모든 응답은 한국어로 하고, ingredientsList는 반드시 <ul><li> 태그를 사용한 HTML 형식으로 작성해줘. 
  easyRecipe와 gourmetRecipe는 상세한 단계별 조리법을 포함해줘.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dishName: { type: Type.STRING },
            comment: { type: Type.STRING },
            ingredientsList: { type: Type.STRING },
            easyRecipe: { type: Type.STRING },
            gourmetRecipe: { type: Type.STRING },
            similarRecipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { title: { type: Type.STRING }, reason: { type: Type.STRING } },
                required: ["title", "reason"]
              }
            },
            referenceLinks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { title: { type: Type.STRING }, url: { type: Type.STRING } },
                required: ["title", "url"]
              }
            }
          },
          required: ["dishName", "comment", "ingredientsList", "easyRecipe", "gourmetRecipe", "similarRecipes", "referenceLinks"]
        }
      }
    });

    const result = parseSafeJSON(response.text);
    if (!result) throw new Error("AI 응답 파싱 실패");
    return result;
  } catch (error) {
    console.error("Recipe generation failed", error);
    throw error;
  }
};

export const generateDishImage = async (dishName: string): Promise<string | undefined> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { 
        parts: [{ 
          text: `Professional food photography of ${dishName}. Top-down view, studio lighting, appetizing, high resolution, vibrant colors. No text.` 
        }] 
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error("Image generation failed", error);
    return undefined;
  }
};
