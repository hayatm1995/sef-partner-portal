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

/**
 * Generate image using OpenAI DALL-E API
 * @param prompt - The image generation prompt
 * @param model - DALL-E model to use (default: 'dall-e-3')
 * @param size - Image size (default: '1024x1024')
 * @returns Promise with image URL
 */
const generateImage = async (
  prompt: string,
  model: 'dall-e-2' | 'dall-e-3' = 'dall-e-3',
  size: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024'
) => {
  ensureKey();
  
  const response = await fetch(`${openAIBaseUrl.replace('/v1', '')}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAIApiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      n: 1,
      quality: model === 'dall-e-3' ? 'standard' : undefined,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI image generation failed: ${text}`);
  }

  const data = await response.json();
  return {
    url: data?.data?.[0]?.url || '',
    revised_prompt: data?.data?.[0]?.revised_prompt || prompt,
  };
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

  /**
   * Enhance a prompt for image generation
   * Takes a brief concept and expands it into a detailed, vivid image generation prompt
   */
  async enhanceImagePrompt(userConcept: string): Promise<string> {
    return callOpenAI({
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at crafting detailed, vivid image generation prompts. Expand brief concepts into highly detailed, descriptive prompts suitable for AI image generation. Focus on visual elements, colors, lighting, atmosphere, and composition. Keep it under 150 words. Avoid any harmful, NSFW, or offensive content.',
        },
        {
          role: 'user',
          content: `User's concept: "${userConcept}"\n\nEnhanced prompt:`,
        },
      ],
      max_tokens: 300,
    });
  },

  /**
   * Generate an image using DALL-E
   * @param prompt - The image generation prompt
   * @param options - Optional parameters (model, size)
   */
  async generateImage(
    prompt: string,
    options?: {
      model?: 'dall-e-2' | 'dall-e-3';
      size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    }
  ) {
    return generateImage(
      prompt,
      options?.model || 'dall-e-3',
      options?.size || '1024x1024'
    );
  },

  /**
   * Generate social media captions for SEF 2026
   * Creates platform-specific captions optimized for Instagram, LinkedIn, Twitter, and Facebook
   */
  async generateSocialMediaCaptions(context: {
    companyName?: string;
    attendeeName?: string;
    packageTier?: string;
  }): Promise<{
    instagram: string;
    linkedin: string;
    twitter: string;
    facebook: string;
  }> {
    const { companyName = 'Your Company', attendeeName = 'Your Name', packageTier = 'Partner' } = context;

    const prompt = `You are a social media expert creating content for SEF 2026 (Sharjah Entrepreneurship Festival).

Company: ${companyName}
Attendee Name: ${attendeeName}
Partnership Level: ${packageTier}

Create engaging social media captions for someone sharing their "I'm Attending SEF 2026" badge. The captions should:
1. Express excitement about attending SEF 2026
2. Use the official hashtags: #SEF2026 #WhereWeBelong #SharjahEntrepreneurship
3. Be engaging, personal, and suitable for each platform
4. Include relevant emojis
5. Mention the event dates: January 31 - February 1, 2026, Sharjah, UAE

Return a JSON object with:
{
  "instagram": "caption optimized for Instagram (engaging, more emojis, story-like)",
  "linkedin": "caption optimized for LinkedIn (professional but excited tone)",
  "twitter": "caption optimized for Twitter/X (under 280 characters)",
  "facebook": "caption optimized for Facebook (conversational, inviting)"
}`;

    const response = await fetch(`${openAIBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a social media content expert. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI request failed: ${text}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || '{}';
    
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  },
};

export type AiService = typeof aiService;

