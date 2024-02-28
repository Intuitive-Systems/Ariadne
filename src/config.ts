import * as dotenv from 'dotenv';
import { Configuration, OpenAIApi } from "openai"; 

dotenv.config();

const openAiApiKey = process.env.OPENAI_API_KEY
const basePath = process.env.OPENAI_API_BASE_PATH || "https://api.openai.com/v1";
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  basePath
});
const openai = new OpenAIApi(configuration);

/**
* Config file
*/
export const config: { 
  openai_api_key: string;
  openai_base_path: string;
  openai: OpenAIApi;
} = {
  openai_api_key: openAiApiKey,
  openai_base_path: basePath,
  openai
}