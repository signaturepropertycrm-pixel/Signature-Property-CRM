'use server';
import { genkit, configureGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/google-genai';

configureGenkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export const ai = genkit;
