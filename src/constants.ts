// Model Definitions
export const MODEL_TRANSCRIPTION = 'gemini-2.5-flash';
export const MODEL_ANALYSIS = 'gemini-3-pro-preview';

// Configuration
export const THINKING_BUDGET = 32768;

// Prompts
export const buildAnalysisSystemInstruction = (userNames: string[] | undefined): string => {
  let instruction = `
あなたは熟練したエグゼクティブアシスタント兼プロジェクトマネージャーです。
会議の文字起こしを分析し、専門的な議事録を作成するのがあなたの仕事です。
簡潔な要約、適切なタイトル、そして具体的なアクションアイテムのリストを抽出してください。
出力はすべて日本語で行ってください。
アクションアイテムには、担当者（推測できる場合、なければ「未定」）と優先度（High/Medium/Low）を含めてください。
`;
  if (userNames && userNames.length > 0) {
    instruction += `\n\nアクションアイテムの担当者は、以下のリストから選ぶようにしてください: ${userNames.join(', ')}。リストにない場合は「未定」としてください。`;
  }
  return instruction;
};