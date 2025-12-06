import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Wand2, Download, Save, Loader2, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ImagineLab() {
  const [userInput, setUserInput] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [editMode, setEditMode] = useState(""); // inpaint, outpaint, style
  const [editPrompt, setEditPrompt] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const enhancePromptMutation = useMutation({
    mutationFn: async (input) => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert at crafting detailed, vivid image generation prompts. Take this brief concept and expand it into a highly detailed, descriptive prompt suitable for AI image generation. Focus on visual elements, colors, lighting, atmosphere, and composition. Keep it under 150 words.

User's concept: "${input}"

Enhanced prompt:`,
        response_json_schema: null
      });
      return response;
    },
    onSuccess: (data) => {
      setEnhancedPrompt(data);
      toast.success("Prompt enhanced! Generating image...");
    },
    onError: (error) => {
      toast.error(`Failed to enhance prompt: ${error.message}`);
    }
  });

  const generateImageMutation = useMutation({
    mutationFn: async (prompt) => {
      const response = await base44.integrations.Core.GenerateImage({
        prompt: prompt
      });
      return response;
    },
    onSuccess: (data) => {
      setGeneratedImage(data.url);
      setOriginalPrompt(enhancedPrompt);
      toast.success("Vision created! ✨");
    },
    onError: (error) => {
      toast.error(`Failed to generate image: ${error.message}`);
    }
  });

  const editImageMutation = useMutation({
    mutationFn: async ({ mode, editDescription }) => {
      let editInstructions = "";
      
      if (mode === "inpaint") {
        editInstructions = `Take the following image concept and modify it by filling in or replacing parts: ${editDescription}. Base image concept: ${originalPrompt}`;
      } else if (mode === "outpaint") {
        editInstructions = `Expand and extend the following image concept beyond its boundaries: ${editDescription}. Original concept: ${originalPrompt}`;
      } else if (mode === "style") {
        editInstructions = `Transform the following image concept with this new style: ${editDescription}. Original concept: ${originalPrompt}`;
      }

      const enhancedEdit = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert at crafting detailed image editing prompts. Create a comprehensive prompt for AI image generation that applies the requested edit. Keep it under 150 words and be very specific about what should change.

Edit request: "${editInstructions}"

Enhanced editing prompt:`,
        response_json_schema: null
      });

      const response = await base44.integrations.Core.GenerateImage({
        prompt: enhancedEdit
      });

      return response;
    },
    onSuccess: (data) => {
      setGeneratedImage(data.url);
      toast.success("Image edited successfully! ✨");
      setEditMode("");
      setEditPrompt("");
    },
    onError: (error) => {
      toast.error(`Failed to edit image: ${error.message}`);
    }
  });

  const saveToMediaMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.MediaBranding.create({
        partner_email: user.email,
        file_type: "media_kit",
        file_url: generatedImage,
        file_name: `vision_${Date.now()}.png`,
        description: `AI-Generated Vision: ${userInput}`,
        uploaded_by: user.email,
        upload_date: new Date().toISOString(),
        is_admin_uploaded: false
      });
    },
    onSuccess: () => {
      toast.success("Saved to your Media Branding! 🎨");
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    }
  });

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      toast.error("Please describe your vision first!");
      return;
    }

    const enhanced = await enhancePromptMutation.mutateAsync(userInput);
    await generateImageMutation.mutateAsync(enhanced);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `vision_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditImage = async () => {
    if (!editPrompt.trim() || !editMode) {
      toast.error("Please describe the edit you want!");
      return;
    }
    await editImageMutation.mutateAsync({ mode: editMode, editDescription: editPrompt });
  };

  const isGenerating = enhancePromptMutation.isPending || generateImageMutation.isPending;
  const isEditing = editImageMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-3">
            Imagine Lab
          </h1>
          <p className="text-xl text-gray-600">
            Transform your ideas into stunning visuals with AI magic ✨
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-2 border-purple-100 shadow-xl h-full">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  Describe Your Vision
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label className="text-lg font-semibold mb-3 block">
                    What do you want to create?
                  </Label>
                  <Textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Describe your booth design, marketing concept, or any creative vision...&#10;&#10;Examples:&#10;• A modern exhibition booth with holographic displays&#10;• A vibrant social media banner with startup energy&#10;• An elegant lounge area with Arabian-inspired decor"
                    rows={10}
                    className="text-base"
                  />
                </div>

                {enhancedPrompt && (
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                    <p className="text-sm font-semibold text-purple-900 mb-2">
                      Enhanced Prompt:
                    </p>
                    <p className="text-sm text-purple-800 italic">
                      {enhancedPrompt}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !userInput.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Magic...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Vision
                    </>
                  )}
                </Button>

                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-4 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>💡 Pro Tips:</strong> Be specific about colors, mood, and style. 
                    Mention any branding elements or themes you want to include.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Output Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-pink-100 shadow-xl h-full">
              <CardHeader className="bg-gradient-to-r from-pink-500 to-orange-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Your Vision
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {generatedImage ? (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-white">
                      <img
                        src={generatedImage}
                        alt="Generated vision"
                        className="w-full h-auto"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        onClick={() => saveToMediaMutation.mutate()}
                        disabled={saveToMediaMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        {saveToMediaMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save to Media
                      </Button>
                    </div>

                    {/* AI Edit Tools */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 p-4 rounded-lg space-y-4 mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Wand2 className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-semibold text-indigo-900">AI Edit Tools</h3>
                      </div>

                      {!editMode ? (
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            onClick={() => setEditMode("inpaint")}
                            variant="outline"
                            className="flex-col h-auto py-3 border-indigo-300 hover:bg-indigo-100"
                          >
                            <Sparkles className="w-4 h-4 mb-1 text-indigo-600" />
                            <span className="text-xs font-semibold">Inpaint</span>
                            <span className="text-xs text-gray-500">Fill/Replace</span>
                          </Button>
                          <Button
                            onClick={() => setEditMode("outpaint")}
                            variant="outline"
                            className="flex-col h-auto py-3 border-purple-300 hover:bg-purple-100"
                          >
                            <ImageIcon className="w-4 h-4 mb-1 text-purple-600" />
                            <span className="text-xs font-semibold">Outpaint</span>
                            <span className="text-xs text-gray-500">Expand</span>
                          </Button>
                          <Button
                            onClick={() => setEditMode("style")}
                            variant="outline"
                            className="flex-col h-auto py-3 border-pink-300 hover:bg-pink-100"
                          >
                            <Wand2 className="w-4 h-4 mb-1 text-pink-600" />
                            <span className="text-xs font-semibold">Style</span>
                            <span className="text-xs text-gray-500">Transfer</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge className={
                              editMode === "inpaint" ? "bg-indigo-500" :
                              editMode === "outpaint" ? "bg-purple-500" :
                              "bg-pink-500"
                            }>
                              {editMode === "inpaint" && "Inpainting Mode"}
                              {editMode === "outpaint" && "Outpainting Mode"}
                              {editMode === "style" && "Style Transfer Mode"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setEditMode(""); setEditPrompt(""); }}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                          
                          <Textarea
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            placeholder={
                              editMode === "inpaint" ? "Describe what to fill in or replace (e.g., 'replace the background with a sunset')" :
                              editMode === "outpaint" ? "Describe how to expand (e.g., 'extend to the right with mountains and trees')" :
                              "Describe the new style (e.g., 'make it look like a watercolor painting')"
                            }
                            rows={3}
                            className="text-sm"
                          />
                          
                          <Button
                            onClick={handleEditImage}
                            disabled={isEditing || !editPrompt.trim()}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                          >
                            {isEditing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Applying Edit...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Apply Edit
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✨ Love it? Save it to your Media Branding collection or download for immediate use!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mb-6">
                      <ImageIcon className="w-16 h-16 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Your vision will appear here
                    </h3>
                    <p className="text-gray-600 max-w-sm">
                      Describe what you want to create, and watch AI bring your ideas to life
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Examples Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card className="border-2 border-orange-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-600" />
                Need Inspiration?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => setUserInput("A sleek, modern exhibition booth with interactive LED screens, minimalist white furniture, and a vibrant brand color scheme")}
                  className="text-left p-4 rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all"
                >
                  <p className="font-semibold text-purple-700 mb-1">Exhibition Booth</p>
                  <p className="text-sm text-gray-600">Modern interactive design</p>
                </button>

                <button
                  onClick={() => setUserInput("A dynamic social media banner featuring startup energy, with geometric shapes, gradient colors from blue to purple, and space for text overlay")}
                  className="text-left p-4 rounded-lg border-2 border-gray-200 hover:border-pink-500 hover:bg-pink-50 transition-all"
                >
                  <p className="font-semibold text-pink-700 mb-1">Social Media Banner</p>
                  <p className="text-sm text-gray-600">Eye-catching gradient design</p>
                </button>

                <button
                  onClick={() => setUserInput("An elegant VIP lounge area with Arabian-inspired architecture, luxurious seating, warm lighting, and traditional patterns mixed with modern elements")}
                  className="text-left p-4 rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <p className="font-semibold text-orange-700 mb-1">VIP Lounge</p>
                  <p className="text-sm text-gray-600">Arabian modern fusion</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}