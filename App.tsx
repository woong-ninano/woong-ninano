
import React, { useState, useEffect } from 'react';
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
import CommunityView from './components/CommunityView.tsx';
import { generateRecipe, fetchSuggestions, fetchSeasonalIngredients, fetchConvenienceTopics, generateDishImage } from './services/gemini.ts';
import { saveRecipeToDB, supabase } from './services/supabase.ts';
import { User } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.Welcome);
  // Navigation State: 'home' is standard flow, 'community' is community view
  const [activeTab, setActiveTab] = useState<'home' | 'community'>('home');
  
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
  
  // 편의점 모드 상태 관리
  const [convenienceItems, setConvenienceItems] = useState<{name: string, desc: string}[]>([]);
  const [convenienceType, setConvenienceType] = useState<'meal' | 'snack'>('meal');

  // 레시피 결과 및 히스토리 관리
  const [recipeHistory, setRecipeHistory] = useState<RecipeResult[]>([]);
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);

  // 사용자 인증 상태
  const [user, setUser] = useState<User | null>(null);

  // 초기 로드: 세션 체크 및 데이터 복구 (OAuth 리다이렉트 대응)
  useEffect(() => {
    if (!supabase) return;

    // 1. 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 2. Auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // 3. OAuth 리다이렉트 후 레시피 데이터 복구
    const savedHistory = sessionStorage.getItem('temp_recipe_history');
    const savedIndex = sessionStorage.getItem('temp_recipe_index');
    
    if (savedHistory && savedIndex) {
      try {
        setRecipeHistory(JSON.parse(savedHistory));
        setCurrentRecipeIndex(parseInt(savedIndex, 10));
        setStep(Step.Result); // 결과 화면으로 복귀
        setActiveTab('home');
        // 복구 후 삭제
        sessionStorage.removeItem('temp_recipe_history');
        sessionStorage.removeItem('temp_recipe_index');
      } catch (e) {
        console.error("Failed to restore recipe history", e);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  const result = currentRecipeIndex >= 0 ? recipeHistory[currentRecipeIndex] : null;

  // 로그인 전 현재 작업중인 레시피를 세션스토리지에 저장
  const saveContextForLogin = () => {
    if (recipeHistory.length > 0) {
      sessionStorage.setItem('temp_recipe_history', JSON.stringify(recipeHistory));
      sessionStorage.setItem('temp_recipe_index', currentRecipeIndex.toString());
    }
  };

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
    setConvenienceType('meal'); // 기본은 식사
    const items = await fetchConvenienceTopics([], 'meal');
    setConvenienceItems(items);
    setStep(Step.ConvenienceSelection);
    setIsLoading(false);
  };

  const loadMoreConvenienceItems = async () => {
    setIsLoading(true);
    const excludedNames = convenienceItems.map(i => i.name);
    const newItems = await fetchConvenienceTopics(excludedNames, convenienceType);
    setConvenienceItems(prev => [...prev, ...newItems]);
    setIsLoading(false);
  };

  const loadSnackItems = async () => {
    setIsLoading(true);
    setConvenienceType('snack');
    const items = await fetchConvenienceTopics([], 'snack');
    setConvenienceItems(items);
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
    startGeneration(false, itemName);
  };

  const startGeneration = async (isRegen: boolean = false, overridePrompt?: string) => {
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

      // Supabase DB에 저장
      let dbId: number | undefined = undefined;
      let createdAt: string | undefined = undefined;
      try {
        const savedData = await saveRecipeToDB({ ...recipe, imageUrl });
        if (savedData) {
          dbId = savedData.id;
          createdAt = savedData.created_at;
        }
      } catch (dbError) {
        console.error("Failed to save to DB:", dbError);
      }

      const newResult = { 
        ...recipe, 
        imageUrl, 
        id: dbId, 
        created_at: createdAt 
      };

      setRecipeHistory(prev => {
        const newHistory = prev.slice(0, currentRecipeIndex + 1);
        return [...newHistory, newResult];
      });
      setCurrentRecipeIndex(prev => prev + 1);
      
      setStep(Step.Result);
    } catch (err) {
      console.error(err);
      alert("AI 셰프가 고민에 빠졌습니다. 다시 시도해 주세요!");
      setStep(Step.Welcome);
    }
  };

  const handleGoBackRecipe = () => {
    if (currentRecipeIndex > 0) {
      setCurrentRecipeIndex(prev => prev - 1);
    }
  };

  const handleGoForwardRecipe = () => {
    if (currentRecipeIndex < recipeHistory.length - 1) {
      setCurrentRecipeIndex(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setRecipeHistory([]);
    setCurrentRecipeIndex(-1);
    setStep(Step.Welcome);
    setActiveTab('home');
  };

  const handleCommunityRecipeSelect = (recipe: RecipeResult) => {
    setRecipeHistory([recipe]);
    setCurrentRecipeIndex(0);
    setStep(Step.Result);
    setActiveTab('home');
  };

  const renderContent = () => {
    if (activeTab === 'community') {
      return <CommunityView onSelectRecipe={handleCommunityRecipeSelect} user={user} />;
    }

    // Home Tab Flow
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
      case Step.ConvenienceSelection: return (
        <ConvenienceStep 
          items={convenienceItems} 
          onSelect={handleConvenienceSelect} 
          onLoadMore={loadMoreConvenienceItems}
          onLoadSnack={loadSnackItems}
          onBack={() => setStep(Step.ModeSelection)} 
        />
      );
      case Step.CuisineSelection: return <CuisineStep choices={choices} setChoices={setChoices} onNext={handleIngredientsComplete} onBack={() => choices.mode === 'fridge' ? setStep(Step.Ingredients) : setStep(Step.SeasonalSelection)} />;
      case Step.Suggestions: return <SuggestionStep choices={choices} setChoices={setChoices} suggestions={suggestions} onNext={() => setStep(Step.Preferences)} onBack={() => setStep(Step.CuisineSelection)} />;
      case Step.Preferences: return <PreferencesStep choices={choices} setChoices={setChoices} onNext={() => setStep(Step.Environment)} onBack={() => setStep(Step.Suggestions)} />;
      case Step.Environment: return <EnvironmentStep choices={choices} setChoices={setChoices} onGenerate={() => startGeneration()} onBack={() => setStep(Step.Preferences)} />;
      case Step.Loading: return <LoadingStep />;
      case Step.Result: return result ? (
        <ResultView 
          result={result}
          user={user}
          onSaveContext={saveContextForLogin}
          canGoBack={currentRecipeIndex > 0}
          canGoForward={currentRecipeIndex < recipeHistory.length - 1}
          onReset={handleReset} 
          onRegenerate={() => startGeneration(true)} 
          onViewAlternative={(title) => startGeneration(false, title)}
          onGoBack={handleGoBackRecipe}
          onGoForward={handleGoForwardRecipe}
        />
      ) : null;
      default: return <WelcomeStep onNext={() => setStep(Step.ModeSelection)} />;
    }
  };

  return (
    <div className="min-h-dvh bg-[#F2F4F6] flex justify-center overflow-x-hidden">
      <div className="w-full max-w-lg bg-white min-h-dvh flex flex-col relative toss-card overflow-hidden">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-32 custom-scrollbar">
          {renderContent()}
        </main>

        {/* Bottom Navigation */}
        <nav className="h-[86px] bg-white border-t border-slate-100 flex items-center justify-around fixed bottom-0 w-full max-w-lg z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] pb-2 rounded-t-[20px]">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1.5 w-full h-full justify-center transition-all group ${activeTab === 'home' ? 'text-[#ff5d01]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {/* Minimal Chef Hat Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${activeTab === 'home' ? 'scale-110' : 'group-hover:scale-105'}`}>
              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
              <line x1="6" y1="17" x2="18" y2="17"/>
            </svg>
            <span className="text-[11px] font-bold tracking-tight">레시피 생성</span>
          </button>
          
          <button 
            onClick={() => {
              setActiveTab('community');
              setStep(Step.Community); 
            }}
            className={`flex flex-col items-center gap-1.5 w-full h-full justify-center transition-all group ${activeTab === 'community' ? 'text-[#ff5d01]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {/* Minimal Users Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${activeTab === 'community' ? 'scale-110' : 'group-hover:scale-105'}`}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span className="text-[11px] font-bold tracking-tight">커뮤니티</span>
          </button>
        </nav>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default App;
