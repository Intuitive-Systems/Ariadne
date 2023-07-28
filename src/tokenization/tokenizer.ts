import { encoding_for_model } from "tiktoken";
import {traceFunction} from "../trace";

export type TIKTOKEN_MODEL = "gpt-3.5-turbo" | "gpt-4" | "text-davinci-003";

async function _numTokens(text: string, model: TIKTOKEN_MODEL) {
    const enc = encoding_for_model(model);
    const encoding = enc.encode(text);
    return encoding.length;
}
export const numTokens = traceFunction(_numTokens);