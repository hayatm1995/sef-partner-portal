# OpenAI API Key Setup

## ✅ Configuration Complete

Your OpenAI API key has been configured for:
- **Imagine Lab**: AI image generation using DALL-E
- **Social Media Kit**: AI caption generation for social media posts

---

## 🔐 API Key Location

The API key has been added to `.env.local`:
```
VITE_OPENAI_API_KEY=your-api-key-here
```

**⚠️ Security Note:** The `.env.local` file is in `.gitignore` and will NOT be committed to git.

---

## 🚀 Features Enabled

### 1. Imagine Lab Image Generation
- **Function:** `aiService.generateImage(prompt, options)`
- **Model:** DALL-E 3 (default) or DALL-E 2
- **Size:** 1024x1024 (default), supports other sizes
- **Usage:** Enhanced prompts are generated automatically before image creation

### 2. Social Media Caption Generation
- **Function:** `aiService.generateSocialMediaCaptions(context)`
- **Returns:** Platform-specific captions for:
  - Instagram (engaging, emoji-rich)
  - LinkedIn (professional but excited)
  - Twitter/X (under 280 characters)
  - Facebook (conversational, inviting)
- **Context:** Uses company name, attendee name, and package tier

### 3. Prompt Enhancement
- **Function:** `aiService.enhanceImagePrompt(userConcept)`
- **Purpose:** Expands brief concepts into detailed image generation prompts
- **Used by:** Imagine Lab to improve user input before image generation

---

## 📝 Updated Files

1. **`.env.local`** - Added `VITE_OPENAI_API_KEY`
2. **`ENV_CONFIG.md`** - Documented the new environment variable
3. **`src/services/aiService.ts`** - Added:
   - `generateImage()` - DALL-E image generation
   - `generateSocialMediaCaptions()` - Social media caption generation
   - `enhanceImagePrompt()` - Prompt enhancement

---

## 🔄 Next Steps

### For Production Deployment

1. **Add to Vercel Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `VITE_OPENAI_API_KEY` = `sk-proj-...`
   - Deploy to apply changes

2. **Update Imagine Lab Page (Future):**
   - Currently uses Base44 integrations
   - Can be migrated to use `aiService.generateImage()` and `aiService.enhanceImagePrompt()`

3. **Update Social Media Page (Future):**
   - Currently uses Base44 integrations
   - Can be migrated to use `aiService.generateSocialMediaCaptions()`

---

## 🧪 Testing

To test the API key is working:

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Check browser console:**
   - Should NOT see "OpenAI API key missing" errors

3. **Test Imagine Lab:**
   - Navigate to Imagine Lab page
   - Enter a concept and generate an image
   - Should successfully call OpenAI DALL-E API

4. **Test Social Media Kit:**
   - Navigate to Social Media page
   - Upload an image and generate captions
   - Should successfully generate platform-specific captions

---

## 🔒 Security Best Practices

1. ✅ API key is in `.env.local` (not committed to git)
2. ✅ `.env.local` is in `.gitignore`
3. ⚠️ For production, add to Vercel environment variables (not in code)
4. ⚠️ Monitor API usage in OpenAI dashboard to prevent unexpected charges
5. ⚠️ Consider rate limiting for production use

---

## 📊 API Usage

The OpenAI API key will be used for:
- **DALL-E 3:** Image generation (pricing: ~$0.04 per image)
- **GPT-4o-mini:** Text generation for captions and prompt enhancement (pricing: ~$0.15/$0.60 per 1M tokens)

Monitor usage at: https://platform.openai.com/usage

---

## 🐛 Troubleshooting

### "OpenAI API key missing" error
- **Solution:** Ensure `.env.local` exists and contains `VITE_OPENAI_API_KEY`
- **Restart:** Restart dev server after adding the key

### Image generation fails
- **Check:** API key is valid and has credits
- **Check:** DALL-E API access is enabled in OpenAI account
- **Check:** Browser console for specific error messages

### Caption generation fails
- **Check:** API key is valid and has credits
- **Check:** GPT-4o-mini access is enabled in OpenAI account
- **Check:** Response format is valid JSON

---

## ✅ Status

- [x] API key added to `.env.local`
- [x] Environment variable documented
- [x] AI service functions added
- [x] Image generation function ready
- [x] Caption generation function ready
- [ ] Imagine Lab page migrated (uses Base44 currently)
- [ ] Social Media page migrated (uses Base44 currently)

---

**Last Updated:** $(date)

