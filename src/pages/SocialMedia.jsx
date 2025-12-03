import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Hash, Copy, Download, Facebook, Instagram, Linkedin, Twitter, Sparkles, Upload, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function SocialMedia() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [personalizedImageUrl, setPersonalizedImageUrl] = useState(null);
  const [attendeeName, setAttendeeName] = useState("");
  const [generatedCaptions, setGeneratedCaptions] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState("crimson");
  const [selectedAccent, setSelectedAccent] = useState("gold");
  const [nameSize, setNameSize] = useState("medium");
  const canvasRef = useRef(null);

  const backgroundOptions = [
    { id: "crimson", name: "Dark Crimson", gradient: ['#1a1a1a', '#2d1f1f', '#3d2020', '#4a1c1c', '#2a1515'] },
    { id: "black", name: "Matte Black", gradient: ['#0a0a0a', '#1a1a1a', '#252525', '#1f1f1f', '#0f0f0f'] },
    { id: "teal", name: "SEF Teal", gradient: ['#0a3d3d', '#0d4f4f', '#106060', '#0d4a4a', '#083535'] },
    { id: "navy", name: "Deep Navy", gradient: ['#0a0a1a', '#1a1a3d', '#252550', '#1f1f40', '#0f0f25'] },
  ];

  const accentOptions = [
    { id: "gold", name: "SEF Gold", color: '#FFB347', glow: 'rgba(255, 179, 71, 0.4)' },
    { id: "white", name: "Clean White", color: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.3)' },
    { id: "teal", name: "Teal", color: '#40E0D0', glow: 'rgba(64, 224, 208, 0.4)' },
    { id: "coral", name: "Coral", color: '#FF6B6B', glow: 'rgba(255, 107, 107, 0.4)' },
  ];

  const nameSizeOptions = [
    { id: "small", name: "Small", size: 42 },
    { id: "medium", name: "Medium", size: 52 },
    { id: "large", name: "Large", size: 62 },
  ];

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profile } = useQuery({
    queryKey: ['partnerProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.PartnerProfile.filter({ partner_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  const hashtags = "#SEF2026 #WhereWeBelong #SharjahEntrepreneurship";
  const officialAccounts = [
    { name: "Facebook", handle: "@SharjahEF", url: "https://facebook.com/SharjahEF", icon: Facebook, color: "from-blue-600 to-blue-700" },
    { name: "Instagram", handle: "@SharjahEF", url: "https://instagram.com/SharjahEF", icon: Instagram, color: "from-pink-600 to-purple-700" },
    { name: "LinkedIn", handle: "@SharjahEF", url: "https://linkedin.com/company/SharjahEF", icon: Linkedin, color: "from-blue-700 to-blue-800" },
    { name: "Twitter", handle: "@SharjahEF", url: "https://twitter.com/SharjahEF", icon: Twitter, color: "from-sky-500 to-sky-600" },
  ];

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target.result);
      setPersonalizedImageUrl(null);
      setGeneratedCaptions(null);
    };
    reader.readAsDataURL(file);
  };

  const generateCaptions = async (displayName) => {
    const companyName = user?.company_name || user?.full_name || "Your Company";
    const packageTier = profile?.package_tier || "Partner";

    const prompt = `You are a social media expert creating content for SEF 2026 (Sharjah Entrepreneurship Festival).

Company: ${companyName}
Attendee Name: ${displayName}
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

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          instagram: { type: "string" },
          linkedin: { type: "string" },
          twitter: { type: "string" },
          facebook: { type: "string" }
        }
      }
    });

    return result;
  };

  const createBadgeAndCaptions = async () => {
    if (!uploadedImage) {
      toast.error("Please upload an image first");
      return;
    }

    setProcessing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const displayName = attendeeName.trim() || user?.full_name || "Your Name";

    // Start caption generation in parallel
    const captionPromise = generateCaptions(displayName);

    img.onload = async () => {
      // Instagram Story dimensions
      canvas.width = 1080;
      canvas.height = 1920;

      // Get selected options
      const bgOption = backgroundOptions.find(b => b.id === selectedBackground) || backgroundOptions[0];
      const accentOption = accentOptions.find(a => a.id === selectedAccent) || accentOptions[0];
      const nameSizeOption = nameSizeOptions.find(n => n.id === nameSize) || nameSizeOptions[1];

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, bgOption.gradient[0]);
      gradient.addColorStop(0.3, bgOption.gradient[1]);
      gradient.addColorStop(0.5, bgOption.gradient[2]);
      gradient.addColorStop(0.7, bgOption.gradient[3]);
      gradient.addColorStop(1, bgOption.gradient[4]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add dynamic "BELONG" collage pattern
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const belongConfigs = [
        { x: 150, y: 200, size: 220, angle: -20, opacity: 0.06, color: '60, 20, 20' },
        { x: 900, y: 350, size: 200, angle: 15, opacity: 0.05, color: '40, 40, 40' },
        { x: 540, y: 600, size: 180, angle: -10, opacity: 0.07, color: '80, 30, 30' },
        { x: 100, y: 800, size: 240, angle: 25, opacity: 0.05, color: '50, 50, 50' },
        { x: 950, y: 900, size: 190, angle: -25, opacity: 0.06, color: '70, 25, 25' },
        { x: 300, y: 1100, size: 210, angle: 10, opacity: 0.05, color: '45, 45, 45' },
        { x: 800, y: 1250, size: 170, angle: -15, opacity: 0.07, color: '85, 35, 35' },
        { x: 150, y: 1400, size: 230, angle: 20, opacity: 0.04, color: '55, 55, 55' },
        { x: 900, y: 1550, size: 200, angle: -30, opacity: 0.06, color: '65, 20, 20' },
        { x: 540, y: 1750, size: 185, angle: 5, opacity: 0.05, color: '50, 50, 50' },
        { x: 400, y: 150, size: 140, angle: 30, opacity: 0.08, color: '75, 30, 30' },
        { x: 700, y: 500, size: 130, angle: -35, opacity: 0.06, color: '55, 55, 55' },
        { x: 200, y: 650, size: 150, angle: 12, opacity: 0.07, color: '90, 40, 40' },
        { x: 850, y: 750, size: 120, angle: -8, opacity: 0.05, color: '40, 40, 40' },
        { x: 450, y: 950, size: 160, angle: 22, opacity: 0.06, color: '70, 25, 25' },
        { x: 650, y: 1150, size: 135, angle: -18, opacity: 0.08, color: '60, 60, 60' },
        { x: 250, y: 1300, size: 145, angle: 28, opacity: 0.05, color: '80, 35, 35' },
        { x: 780, y: 1450, size: 155, angle: -22, opacity: 0.07, color: '45, 45, 45' },
        { x: 350, y: 1650, size: 125, angle: 15, opacity: 0.06, color: '95, 45, 45' },
        { x: 720, y: 1850, size: 140, angle: -12, opacity: 0.05, color: '50, 50, 50' },
        { x: 50, y: 450, size: 100, angle: -40, opacity: 0.09, color: '85, 40, 40' },
        { x: 1030, y: 600, size: 110, angle: 35, opacity: 0.07, color: '35, 35, 35' },
        { x: 540, y: 1500, size: 115, angle: -5, opacity: 0.08, color: '75, 30, 30' },
      ];
      
      belongConfigs.forEach(config => {
        ctx.save();
        ctx.translate(config.x, config.y);
        ctx.rotate(config.angle * Math.PI / 180);
        ctx.font = `900 ${config.size}px Arial`;
        ctx.fillStyle = `rgba(${config.color}, ${config.opacity})`;
        ctx.fillText('BELONG', 0, 0);
        ctx.restore();
      });
      ctx.restore();

      // Vignette
      const vignetteGradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.9);
      vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignetteGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
      vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header text
      ctx.textAlign = 'center';
      ctx.font = 'bold 65px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText("I'M ATTENDING", canvas.width / 2, 280);

      // Profile photo
      const photoSize = 420;
      const photoX = canvas.width / 2;
      const photoY = 580;

      // Glow
      const glowGradient = ctx.createRadialGradient(photoX, photoY, photoSize / 2, photoX, photoY, photoSize / 2 + 60);
      glowGradient.addColorStop(0, accentOption.glow);
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(photoX, photoY, photoSize / 2 + 60, 0, Math.PI * 2);
      ctx.fill();

      // Rings
      ctx.beginPath();
      ctx.arc(photoX, photoY, photoSize / 2 + 28, 0, Math.PI * 2);
      ctx.strokeStyle = accentOption.color;
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(photoX, photoY, photoSize / 2 + 16, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 20;
      ctx.stroke();

      // Photo
      ctx.save();
      ctx.beginPath();
      ctx.arc(photoX, photoY, photoSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      const aspectRatio = img.width / img.height;
      let drawWidth, drawHeight;
      if (aspectRatio > 1) {
        drawHeight = photoSize;
        drawWidth = photoSize * aspectRatio;
      } else {
        drawWidth = photoSize;
        drawHeight = photoSize / aspectRatio;
      }
      
      ctx.drawImage(img, photoX - drawWidth / 2, photoY - drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      // Event text
      ctx.font = 'bold 130px Arial';
      ctx.fillStyle = accentOption.color;
      ctx.fillText('SEF 2026', canvas.width / 2, 960);

      ctx.font = 'bold 42px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('SHARJAH ENTREPRENEURSHIP', canvas.width / 2, 1040);
      ctx.fillText('FESTIVAL', canvas.width / 2, 1090);

      ctx.font = 'bold 68px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('JAN 31 – FEB 1', canvas.width / 2, 1210);

      ctx.font = '48px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillText('SRTI PARK, SHARJAH', canvas.width / 2, 1280);

      // Name box
      const nameBoxWidth = 800;
      const nameBoxHeight = 90;
      const nameBoxX = canvas.width / 2 - nameBoxWidth / 2;
      const nameBoxY = 1620;
      
      // Parse accent color for rgba
      const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };
      
      ctx.fillStyle = hexToRgba(accentOption.color, 0.12);
      ctx.beginPath();
      ctx.roundRect(nameBoxX, nameBoxY, nameBoxWidth, nameBoxHeight, 20);
      ctx.fill();
      
      ctx.strokeStyle = hexToRgba(accentOption.color, 0.4);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(nameBoxX, nameBoxY, nameBoxWidth, nameBoxHeight, 20);
      ctx.stroke();

      ctx.font = `bold ${nameSizeOption.size}px Arial`;
      ctx.fillStyle = accentOption.color;
      ctx.fillText(displayName, canvas.width / 2, nameBoxY + 60);

      const companyName = user?.company_name || "";
      if (companyName && companyName !== displayName) {
        ctx.font = '36px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(companyName, canvas.width / 2, 1750);
      }

      ctx.font = '38px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('#WhereWeBelong', canvas.width / 2, 1830);

      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = accentOption.color;
      ctx.fillText('sharjahef.com', canvas.width / 2, 1880);

      const dataUrl = canvas.toDataURL('image/png');
      setPersonalizedImageUrl(dataUrl);

      // Wait for captions
      try {
        const captions = await captionPromise;
        setGeneratedCaptions(captions);
        toast.success("Badge & captions ready!");
      } catch (error) {
        toast.error("Badge created, but caption generation failed");
      }
      
      setProcessing(false);
    };

    img.onerror = () => {
      toast.error("Failed to load image");
      setProcessing(false);
    };

    img.src = uploadedImage;
  };

  const downloadImage = () => {
    if (!personalizedImageUrl) return;
    const link = document.createElement('a');
    link.download = 'SEF2026-Badge.png';
    link.href = personalizedImageUrl;
    link.click();
    toast.success("Image downloaded!");
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Media Kit</h1>
          <p className="text-gray-600">Create your personalized SEF 2026 badge with AI-generated captions</p>
        </div>

        {/* Main Card - Badge Generator */}
        <Card className="mb-8 border-orange-200/50 shadow-2xl overflow-hidden">
          <div className="relative bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Create Your "I'm Attending" Badge</h2>
                <p className="text-white/90">Upload your photo → Get badge + ready-to-post captions</p>
              </div>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Upload & Name Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base font-semibold mb-2 block">Your Photo</Label>
                <div className="border-2 border-dashed border-orange-300 rounded-xl p-6 text-center hover:border-orange-500 transition-colors bg-orange-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {uploadedImage ? (
                      <img src={uploadedImage} alt="Preview" className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-orange-300 shadow-lg" />
                    ) : (
                      <>
                        <Upload className="w-10 h-10 mx-auto text-orange-400 mb-2" />
                        <p className="text-gray-700 font-medium">Click to upload</p>
                        <p className="text-sm text-gray-500">PNG or JPG</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-2 block">Your Name</Label>
                <Input
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder={user?.full_name || "Enter your name"}
                  className="text-lg py-5 border-orange-200 focus:border-orange-500"
                />
                <p className="text-sm text-gray-500 mt-2">Will appear on your badge</p>
              </div>
            </div>

            {/* Customization Options */}
            <div className="grid md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border">
              {/* Background */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Background Style</Label>
                <div className="grid grid-cols-2 gap-2">
                  {backgroundOptions.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setSelectedBackground(bg.id)}
                      className={`p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                        selectedBackground === bg.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div 
                        className="w-full h-6 rounded mb-1"
                        style={{ background: `linear-gradient(135deg, ${bg.gradient[0]}, ${bg.gradient[2]}, ${bg.gradient[4]})` }}
                      />
                      {bg.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Accent Color</Label>
                <div className="grid grid-cols-2 gap-2">
                  {accentOptions.map((accent) => (
                    <button
                      key={accent.id}
                      onClick={() => setSelectedAccent(accent.id)}
                      className={`p-2 rounded-lg border-2 transition-all text-xs font-medium flex items-center gap-2 ${
                        selectedAccent === accent.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div 
                        className="w-5 h-5 rounded-full border border-gray-300"
                        style={{ backgroundColor: accent.color }}
                      />
                      {accent.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Size */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Name Size</Label>
                <div className="flex flex-col gap-2">
                  {nameSizeOptions.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setNameSize(size.id)}
                      className={`p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                        nameSize === size.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={createBadgeAndCaptions}
              disabled={processing || !uploadedImage}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-lg py-6 shadow-lg"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Badge & Generating Captions...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Badge + Captions
                </>
              )}
            </Button>

            {/* Results */}
            {personalizedImageUrl && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 pt-4 border-t"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Badge Preview */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-600" />
                      Your Badge
                    </h3>
                    <div className="relative mx-auto" style={{ maxWidth: '280px' }}>
                      <img 
                        src={personalizedImageUrl} 
                        alt="SEF Badge" 
                        className="w-full rounded-2xl border-4 border-orange-200 shadow-xl"
                      />
                      <Badge className="absolute top-2 right-2 bg-green-500 text-white">Ready!</Badge>
                    </div>
                    <Button onClick={downloadImage} className="w-full mt-4 bg-gray-900 hover:bg-gray-800">
                      <Download className="w-4 h-4 mr-2" />
                      Download Badge
                    </Button>
                  </div>

                  {/* Captions */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Copy className="w-5 h-5 text-purple-600" />
                      Ready-to-Post Captions
                    </h3>
                    
                    {generatedCaptions ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Instagram className="w-4 h-4 text-pink-600" />
                              <span className="font-medium text-sm">Instagram</span>
                            </div>
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleCopy(generatedCaptions.instagram)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed">{generatedCaptions.instagram}</p>
                        </div>
                        
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Linkedin className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-sm">LinkedIn</span>
                            </div>
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleCopy(generatedCaptions.linkedin)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed">{generatedCaptions.linkedin}</p>
                        </div>
                        
                        <div className="p-3 bg-sky-50 rounded-lg border border-sky-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Twitter className="w-4 h-4 text-sky-600" />
                              <span className="font-medium text-sm">Twitter/X</span>
                            </div>
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleCopy(generatedCaptions.twitter)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed">{generatedCaptions.twitter}</p>
                        </div>
                        
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Facebook className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-sm">Facebook</span>
                            </div>
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleCopy(generatedCaptions.facebook)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed">{generatedCaptions.facebook}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Pro Tip */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                  <p className="text-sm text-green-900 font-medium">💡 Pro Tip: Tag <span className="font-bold">@SharjahEF</span> and use <span className="font-bold">#WhereWeBelong #SEF2026</span> to get featured!</p>
                </div>
              </motion.div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </CardContent>
        </Card>

        {/* Official Hashtags */}
        <Card className="mb-6 border-blue-200/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hash className="w-5 h-5 text-blue-600" />
              Official Hashtags
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              {hashtags.split(" ").map((tag, index) => (
                <Badge key={index} className="bg-blue-100 text-blue-800 py-1.5 px-3">
                  {tag}
                </Badge>
              ))}
              <Button size="sm" variant="outline" onClick={() => handleCopy(hashtags)}>
                <Copy className="w-3 h-3 mr-1" /> Copy All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connect with SEF */}
        <Card className="border-green-200/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Share2 className="w-5 h-5 text-green-600" />
              Connect with SEF
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {officialAccounts.map((account, index) => {
                const Icon = account.icon;
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => window.open(account.url, '_blank')}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border hover:shadow-md transition-all"
                  >
                    <div className={`p-2 bg-gradient-to-br ${account.color} rounded-lg`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{account.name}</p>
                      <p className="text-xs text-gray-500">{account.handle}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}