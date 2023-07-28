export type TIKTOKEN_MODEL = "gpt-3.5-turbo" | "gpt-4" | "text-davinci-003";
declare function _numTokens(text: string, model: TIKTOKEN_MODEL): Promise<number>;
export declare const numTokens: typeof _numTokens;
export {};
