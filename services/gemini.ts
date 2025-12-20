
import { GoogleGenAI, Type } from "@google/genai";
import { UserChoices, RecipeResult } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const fetchSeasonalIngredients = async (excluded: string[] = []) => {
  const currentMonth = new Date().getMonth() + 1;
  const ai = getAI();
  const prompt = `대한민국의 ${currentMonth}월에 가장 맛있는 제철 식재료 8개를 알려줘. 
  이미 추천한 재료들(${excluded.join(', ')})은 제외해줘. 
  만약 더 이상 제철 재료가 없다면, 요리에 필수적인 일반 장보기 재료(대중적인 채소, 고기 등)를 추천해줘.
  각 재료별로 한 줄 요약(맛이나 영양)을 포함해줘. JSON 형식으로 반환해.`;

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
  const jsonStr = response.text?.trim() || '{"items":[]}';
  return JSON.parse(jsonStr).items;
};

export const fetchSuggestions = async (ingredients: string) => {
  try {
    const ai = getAI();
    const prompt = `재료: "${ingredients}". 이 재료들과 어울리는 부재료 6개, 양념 6개를 추천해줘.`;
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
    return JSON.parse(response.text || '{"subIngredients":[], "sauces":[]}');
  } catch (error) {
    return { subIngredients: [], sauces: [] };
  }
};

export const generateRecipe = async (choices: UserChoices, isRegenerate: boolean = false): Promise<RecipeResult> => {
  const ai = getAI();
  const prompt = `
    [Role] 전 세계의 식재료를 자유자재로 다루는 퓨전 미슐랭 3스타 셰프.
    [Context] 
    - 모드: ${choices.mode === 'fridge' ? '냉장고 털기' : '제철 식재료 특화'}
    - 재료: ${choices.ingredients}
    - 양념: ${choices.sauces.join(', ')}
    - 식종 스타일: ${choices.cuisine}
    - 상황: ${choices.partner}를 위한 ${choices.theme}
    - 난이도: ${choices.level}
    ${isRegenerate ? "- [Special Note] 이전에 추천한 것과는 완전히 다른 창의적인 접근을 해주세요." : ""}

    [Mission] 인류 최고의 고민인 '오늘 뭐 먹지'를 해결할 획기적인 퓨전 레시피를 제안하세요. 
    동양과 서양의 조화, 뜻밖의 재료 궁합을 선보여야 합니다.

    [Output Specification]
    1. dishName: 창의적이고 감각적인 이름
    2. comment: 왜 이 퓨전 조합이 완벽한지 설명
    3. easyRecipe: 누구나 따라하는 법 (HTML <ol><li>)
    4. gourmetRecipe: 셰프의 킥이 들어간 고차원 조리법 (HTML <ol><li>)
    5. similarRecipes: 2가지 퓨전 대안
    6. referenceLinks: 요리 관련 유사한 음식이나 팁을 얻을 수 있는 유용한 웹사이트 링크 2개 (JSON 필드: title, url)
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dishName: { type: Type.STRING },
          comment: { type: Type.STRING },
          easyRecipe: { type: Type.STRING },
          gourmetRecipe: { type: Type.STRING },
          similarRecipes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { title: { type: Type.STRING }, reason: { type: Type.STRING } }
            }
          },
          referenceLinks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { title: { type: Type.STRING }, url: { type: Type.STRING } }
            }
          }
        },
        required: ["dishName", "comment", "easyRecipe", "gourmetRecipe", "similarRecipes", "referenceLinks"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};
