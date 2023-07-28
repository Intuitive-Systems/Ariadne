import * as dotenv from 'dotenv';
import { Configuration, OpenAIApi } from "openai"; 

dotenv.config();

const openAiApiKey = process.env.OPENAI_API_KEY
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
* Config file
*/
export const config: { 
  openai_api_key: string;
} = {
  openai_api_key: openAiApiKey,
}