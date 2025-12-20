
import React, { useState } from 'react';
import { Step, UserChoices, RecipeResult } from './types.ts';
import WelcomeStep from './components/steps/WelcomeStep.tsx';
import ModeSelectionStep from './components/steps/ModeSelectionStep.tsx';
import IngredientsStep from './components/steps/IngredientsStep.tsx';
import SeasonalStep from './components/steps/SeasonalStep.tsx';
import ConvenienceStep from './components/steps/ConvenienceStep.tsx';
import CuisineStep from './components/steps/CuisineStep.tsx';
import SuggestionStep from './components/steps/SuggestionStep.tsx';
import PreferencesStep from './components/steps/PreferencesStep.tsx';
import EnvironmentStep from './components/steps/EnvironmentStep.tsx';
import LoadingStep from './components/steps/LoadingStep.tsx';
import ResultView from './components/ResultView.tsx';
import { generateRecipe, fetchSuggestions, fetchSeasonalIngredients, fetchConvenienceTopics, generateDishImage } from './services/gemini.ts';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.Welcome);
  const [choices, setChoices] = useState<UserChoices>({
    mode: 'fridge',
    ingredients: '',
    sauces: [],
    cuisine: '자유 퓨전',
    partner: '👤 혼밥',
    theme: '🍚 든든한 한끼',
    tools: [],
    level: 'Lv.2 평범한 주부'
  });
  const [suggestions, setSuggestions] = useState({ subIngredients: [], sauces: [] });
  const [seasonalItems, setSeasonalItems] = useState<{name: string, desc: string}[]>([]);
  const [convenienceItems, setConvenienceItems] = useState<{name: string, desc: string}[]>([]);
  const [result, setResult] = useState<RecipeResult | null>(null);
  const [recipeHistory, setRecipeHistory] = useState<RecipeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const startSeasonalFlow = async () => {
    setIsLoading(true);
    setChoices(prev => ({ ...prev, mode: 'seasonal', ingredients: '' }));
    const items = await fetchSeasonalIngredients([]);
    setSeasonalItems(items);
    setStep(Step.SeasonalSelection);
    setIsLoading(false);
  };

  const startConvenienceFlow = async () => {
    setIsLoading(true);
    setChoices(prev => ({ ...prev, mode: 'convenience', ingredients: '' }));
    const items = await fetchConvenienceTopics();
    setConvenienceItems(items);
    setStep(Step.ConvenienceSelection);
    setIsLoading(false);
  };

  const loadMoreSeasonal = async () => {
    setIsLoading(true);
    const excludedNames = seasonalItems.map(i => i.name);
    const moreItems = await fetchSeasonalIngredients(excludedNames);
    setSeasonalItems(prev => [...prev, ...moreItems]);
    setIsLoading(false);
  };

  const startFridgeFlow = () => {
    setChoices(prev => ({ ...prev, mode: 'fridge', ingredients: '' }));
    setStep(Step.Ingredients);
  };

  const handleIngredientsComplete = async () => {
    setIsLoading(true);
    const data = await fetchSuggestions(choices.ingredients);
    setSuggestions(data);
    setStep(Step.Suggestions);
    setIsLoading(false);
  };

  const handleConvenienceSelect = (itemName: string) => {
    setChoices(prev => ({ ...prev, ingredients: itemName }));
    // 편의점 모드는 재료 선택 후 바로 생성 로직으로 넘어갈 수도 있지만, 
    // 기존 플로우(환경설정 등)를 타는 것이 자연스러움.
    // 다만 간단함을 위해 바로 Loading -> Result로 갈 수도 있음. 
    // 여기서는 요청대로 '상세 레시피' 생성을 위해 바로 생성 함수 호출
    startGeneration(false, itemName);
  };

  const startGeneration = async (isRegen: boolean = false, overridePrompt?: string) => {
    if (result) {
      setRecipeHistory(prev => [...prev, result]);
    }

    setStep(Step.Loading);
    try {
      const finalChoices = overridePrompt 
        ? { ...choices, ingredients: overridePrompt, theme: choices.mode === 'convenience' ? '편의점 꿀조합' : choices.theme } 
        : choices;
      
      const recipe = await generateRecipe(finalChoices, isRegen);
      
      let imageUrl: string | undefined = undefined;
      if (recipe.dishName) {
        imageUrl = await generateDishImage(recipe.dishName);
      }

      setResult({ ...recipe, imageUrl });
      setStep(Step.Result);
    } catch (err) {
      console.error(err);
      alert("AI 셰프가 고민에 빠졌습니다. 다시 시도해 주세요!");
      setStep(Step.Welcome);
    }
  };

  const handleGoBackRecipe = () => {
    if (recipeHistory.length > 0) {
      const prevRecipe = recipeHistory[recipeHistory.length - 1];
      setRecipeHistory(prev => prev.slice(0, -1)); 
      setResult(prevRecipe);
    }
  };

  const handleReset = () => {
    setRecipeHistory([]);
    setResult(null);
    setStep(Step.Welcome);
  };

  const renderStep = () => {
    if (isLoading) return <LoadingStep customMessage="데이터를 불러오고 있어요..." />;

    switch (step) {
      case Step.Welcome: return <WelcomeStep onNext={() => setStep(Step.ModeSelection)} />;
      case Step.ModeSelection: return (
        <ModeSelectionStep 
          onFridge={startFridgeFlow} 
          onSeasonal={startSeasonalFlow} 
          onConvenience={startConvenienceFlow} 
          onBack={() => setStep(Step.Welcome)} 
        />
      );
      case Step.Ingredients: return <IngredientsStep choices={choices} setChoices={setChoices} onNext={() => setStep(Step.CuisineSelection)} onBack={() => setStep(Step.ModeSelection)} />;
      case Step.SeasonalSelection: return <SeasonalStep choices={choices} setChoices={setChoices} items={seasonalItems} onNext={() => setStep(Step.CuisineSelection)} onBack={() => setStep(Step.ModeSelection)} onMore={loadMoreSeasonal} />;
      case Step.ConvenienceSelection: return <ConvenienceStep items={convenienceItems} onSelect={handleConvenienceSelect} onBack={() => setStep(Step.ModeSelection)} />;
      case Step.CuisineSelection: return <CuisineStep choices={choices} setChoices={setChoices} onNext={handleIngredientsComplete} onBack={() => choices.mode === 'fridge' ? setStep(Step.Ingredients) : setStep(Step.SeasonalSelection)} />;
      case Step.Suggestions: return <SuggestionStep choices={choices} setChoices={setChoices} suggestions={suggestions} onNext={() => setStep(Step.Preferences)} onBack={() => setStep(Step.CuisineSelection)} />;
      case Step.Preferences: return <PreferencesStep choices={choices} setChoices={setChoices} onNext={() => setStep(Step.Environment)} onBack={() => setStep(Step.Suggestions)} />;
      case Step.Environment: return <EnvironmentStep choices={choices} setChoices={setChoices} onGenerate={() => startGeneration()} onBack={() => setStep(Step.Preferences)} />;
      case Step.Loading: return <LoadingStep />;
      case Step.Result: return result ? (
        <ResultView 
          result={result} 
          canGoBack={recipeHistory.length > 0}
          onReset={handleReset} 
          onRegenerate={() => startGeneration(true)} 
          onViewAlternative={(title) => startGeneration(false, title)}
          onGoBack={handleGoBackRecipe}
        />
      ) : null;
      default: return <WelcomeStep onNext={() => setStep(Step.ModeSelection)} />;
    }
  };

  return (
    <div className="min-h-dvh bg-[#F2F4F6] flex justify-center overflow-x-hidden">
      <div className="w-full max-w-lg bg-white min-h-dvh flex flex-col relative toss-card overflow-hidden">
        <main className="flex-1 px-6 pb-12">
          {renderStep()}
        </main>
      </div>
    </div>
  );
};

export default App;
