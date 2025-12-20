
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

export const fetchConvenienceTopics = async () => {
  const ai = getAI();
  const prompt = `
    한국 편의점(GS25, CU, 세븐일레븐)에서 구할 수 있는 재료로 만들 수 있는 
    '자취생 꿀조합 레시피' 또는 '편의점 꿀조합' 메뉴 6가지를 추천해줘.
    유명한 조합(마크정식 등)이나 창의적인 신메뉴 조합을 섞어서 제안해줘.
    JSON 포맷으로 { items: [{ name: "메뉴명", desc: "간단 설명" }] } 형태로 반환해.
  `;
  
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
    return JSON.parse(response.text || '{"items":[]}').items;
  } catch (e) {
    return [
      { name: "불닭 콘치즈 리조또", desc: "매콤함과 고소함의 완벽 조화" },
      { name: "곰탕 만두 라면죽", desc: "뜨끈하고 든든한 한 끼" }
    ];
  }
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
  
  let contextPrompt = "";
  if (choices.mode === 'convenience') {
    contextPrompt = `
      - 모드: 자취생/편의점 꿀조합 요리
      - 선택 메뉴: ${choices.ingredients} (이 메뉴를 베이스로 하되, 더 맛있게 업그레이드 해주세요)
      - 상황: 편의점에서 쉽게 구할 수 있는 재료만 사용해야 함. 전자레인지나 커피포트 등 간단한 도구 위주 사용.
    `;
  } else {
    contextPrompt = `
      - 모드: ${choices.mode === 'fridge' ? '냉장고 털기' : '제철 식재료 특화'}
      - 재료: ${choices.ingredients}
      - 양념: ${choices.sauces.join(', ')}
      - 식종 스타일: ${choices.cuisine}
      - 상황: ${choices.partner}를 위한 ${choices.theme}
      - 난이도: ${choices.level}
    `;
  }

  const prompt = `
    [Role] ${choices.mode === 'convenience' ? '편의점 꿀조합 마스터이자 자취 요리 전문가' : '전 세계의 식재료를 자유자재로 다루는 퓨전 미슐랭 3스타 셰프'}.
    [Context] 
    ${contextPrompt}
    ${isRegenerate ? "- [Special Note] 이전에 추천한 것과는 다른 새로운 접근이나 구성을 보여주세요." : ""}

    [Mission] 사용자가 당장 만들어 먹고 싶어지는 매력적인 레시피를 제안하세요.

    [IMPORTANT LANGUAGE RULE] 
    ALL OUTPUT MUST BE IN KOREAN (한국어). 

    [Output Specification]
    1. dishName: 요리 이름 (한국어)
    2. comment: 메뉴 선정 이유 및 기대평 (한국어)
    3. ingredientsList: 필요한 재료 목록 (HTML <ul><li>...</li> 형식). 자취생/편의점 모드라면 '구매 리스트' 느낌으로 작성. (한국어)
    4. easyRecipe: 조리법 (HTML <ol><li>...</li>). ${choices.mode === 'convenience' ? '전자레인지 시간 등 구체적으로' : '누구나 따라할 수 있게'}. (한국어)
    5. gourmetRecipe: ${choices.mode === 'convenience' ? '더 맛있게 먹는 꿀팁(토핑 추가 등)' : '셰프의 킥이 들어간 고차원 조리법'} (HTML <ol><li>...</li>) (한국어)
    6. similarRecipes: 2가지 다른 추천 메뉴 (한국어)
    7. referenceLinks: 관련 정보나 레시피를 볼 수 있는 웹사이트 링크 2개 (JSON 필드: title, url)
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
          ingredientsList: { type: Type.STRING },
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
        required: ["dishName", "comment", "ingredientsList", "easyRecipe", "gourmetRecipe", "similarRecipes", "referenceLinks"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateDishImage = async (dishName: string): Promise<string | undefined> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // nano banana
      contents: { 
        parts: [{ 
          text: `A delicious, high-quality food photography of ${dishName}. Top-down view or 45-degree angle. Appetizing, vibrant colors. Studio lighting. No text overlay.` 
        }] 
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  } catch (error) {
    console.error("Image generation failed", error);
    return undefined;
  }
};
