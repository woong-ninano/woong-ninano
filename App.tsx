
import React, { useState } from 'react';
import { Step, UserChoices, RecipeResult } from './types.ts';
import Header from './components/Header.tsx';
import WelcomeStep from './components/steps/WelcomeStep.tsx';
import IngredientsStep from './components/steps/IngredientsStep.tsx';
import SuggestionStep from './components/steps/SuggestionStep.tsx';
import PreferencesStep from './components/steps/PreferencesStep.tsx';
import EnvironmentStep from './components/steps/EnvironmentStep.tsx';
import LoadingStep from './components/steps/LoadingStep.tsx';
import ResultView from './components/ResultView.tsx';
import { generateRecipe, fetchSuggestions } from './services/gemini.ts';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.Welcome);
  const [choices, setChoices] = useState<UserChoices>({
    ingredients: '',
    sauces: [],
    partner: '👤 혼밥',
    theme: '🍚 든든한 한끼',
    tools: [],
    level: 'Lv.2 평범한 주부'
  });
  const [suggestions, setSuggestions] = useState({ subIngredients: [], sauces: [] });
  const [result, setResult] = useState<RecipeResult | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleNext = () => setStep(prev => (prev + 1) as Step);
  const handleBack = () => setStep(prev => (prev - 1) as Step);

  const handleIngredientsSubmit = async () => {
    setIsSuggesting(true);
    try {
      const data = await fetchSuggestions(choices.ingredients);
      setSuggestions(data);
      setStep(Step.Suggestions);
    } catch (err) {
      console.error("추천 로드 실패:", err);
      setStep(Step.Suggestions);
    } finally {
      setIsSuggesting(false);
    }
  };

  const startGeneration = async () => {
    setStep(Step.Loading);
    try {
      const recipe = await generateRecipe(choices);
      setResult(recipe);
      setStep(Step.Result);
    } catch (err) {
      alert("셰프가 고민에 빠졌습니다. 잠시 후 다시 시도해주세요!");
      setStep(Step.Welcome);
    }
  };

  const renderStep = () => {
    if (isSuggesting) return <LoadingStep customMessage="재료의 조화를 생각하고 있어요..." />;

    switch (step) {
      case Step.Welcome: return <WelcomeStep onNext={handleNext} />;
      case Step.Ingredients: return <IngredientsStep choices={choices} setChoices={setChoices} onNext={handleIngredientsSubmit} onBack={handleBack} />;
      case Step.Suggestions: return <SuggestionStep choices={choices} setChoices={setChoices} suggestions={suggestions} onNext={handleNext} onBack={handleBack} />;
      case Step.Preferences: return <PreferencesStep choices={choices} setChoices={setChoices} onNext={handleNext} onBack={handleBack} />;
      case Step.Environment: return <EnvironmentStep choices={choices} setChoices={setChoices} onGenerate={startGeneration} onBack={handleBack} />;
      case Step.Loading: return <LoadingStep />;
      case Step.Result: return result ? <ResultView result={result} onReset={() => setStep(Step.Welcome)} /> : null;
      default: return <WelcomeStep onNext={handleNext} />;
    }
  };

  return (
    <div className="min-h-dvh bg-[#FDFDFD] flex justify-center">
      <div className="w-full max-w-lg bg-white min-h-dvh flex flex-col shadow-2xl shadow-slate-200/50 relative overflow-hidden">
        {step !== Step.Welcome && step !== Step.Loading && <Header />}
        <main className="flex-1 px-8 pb-12">
          {renderStep()}
        </main>
      </div>
    </div>
  );
};

export default App;
