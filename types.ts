
export interface UserChoices {
  mode: 'fridge' | 'seasonal' | 'convenience';
  ingredients: string;
  sauces: string[];
  cuisine: string;
  partner: string;
  theme: string;
  tools: string[];
  level: string;
}

export interface SimilarRecipe {
  title: string;
  reason: string;
}

export interface ReferenceLink {
  title: string;
  url: string;
}

export interface RecipeResult {
  id?: number; // Supabase DB ID (Optional)
  dishName: string;
  comment: string;
  ingredientsList: string; // HTML format <ul><li>
  easyRecipe: string;
  gourmetRecipe: string;
  similarRecipes: SimilarRecipe[];
  referenceLinks: ReferenceLink[];
  imageUrl?: string;
}

export enum Step {
  Welcome = 0,
  ModeSelection = 1,
  Ingredients = 2,
  SeasonalSelection = 3,
  ConvenienceSelection = 4, // New Step
  CuisineSelection = 5,
  Suggestions = 6,
  Preferences = 7,
  Environment = 8,
  Loading = 9,
  Result = 10
}
