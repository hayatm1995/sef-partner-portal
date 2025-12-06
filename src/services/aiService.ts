import { supabase } from '@/config/supabase';

const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
const openAIBaseUrl = import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';

const ensureKey = () => {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key missing. Set VITE_OPENAI_API_KEY.');
  }
};

const callOpenAI = async (body: Record<string, unknown>) => {
  ensureKey();
  const response = await fetch(`${openAIBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAIApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.35,
      max_tokens: 400,
      ...body,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI request failed: ${text}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || '';
};

export const aiService = {
  async generateBoothCopy(context: { company?: string; product?: string; tone?: string }) {
    const { company = 'your company', product = 'products', tone = 'concise and friendly' } = context || {};
    return callOpenAI({
      messages: [
        {
          role: 'system',
          content:
            'You are an assistant helping exhibitors craft short, safe booth copy. Avoid any harmful, NSFW, or offensive content.',
        },
        {
          role: 'user',
          content: `Write a ${tone} 60-80 word booth description for ${company} showcasing ${product}.`,
        },
      ],
    });
  },

  async generateReminder(context: { partnerName?: string; missingItems?: string[] }) {
    const missing = (context?.missingItems || []).join(', ') || 'outstanding items';
    return callOpenAI({
      messages: [
        {
          role: 'system',
          content:
            'You draft short reminder messages that are supportive and action-oriented. Avoid any harmful, NSFW, or aggressive language.',
        },
        {
          role: 'user',
          content: `Create a 2-3 sentence reminder to ${context?.partnerName || 'the partner'} to complete: ${missing}.`,
        },
      ],
    });
  },

  async suggestImageAltText(context: { assetName?: string }) {
    return callOpenAI({
      messages: [
        {
          role: 'system',
          content:
            'Generate safe, neutral alt-text for brand assets. Avoid NSFW content or assumptions about sensitive attributes.',
        },
        {
          role: 'user',
          content: `Provide accessible alt-text (<=20 words) for asset: ${context?.assetName || 'logo/branding image'}.`,
        },
      ],
    });
  },
};

export type AiService = typeof aiService;

