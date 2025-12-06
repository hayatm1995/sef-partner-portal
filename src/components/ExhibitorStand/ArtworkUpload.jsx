import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { boothArtworkService } from '@/services/supabaseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileImage, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function ArtworkUpload({ boothId }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch existing artwork
  const { data: artwork = [], isLoading } = useQuery({
    queryKey: ['boothArtwork', boothId],
    queryFn: () => boothArtworkService.getByBoothId(boothId),
    enabled: !!boothId,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (fileToUpload) => {
      if (!boothId) throw new Error('Booth ID is required');
      
      // Generate file path: booths/{boothId}/{timestamp_originalFileName}
      const timestamp = Date.now();
      const fileName = `${timestamp}_${fileToUpload.name}`;
      const filePath = `booths/${boothId}/${fileName}`;

      // Upload to Supabase Storage (deliverables bucket)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('deliverables')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('deliverables')
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      // Insert metadata into booth_artwork table
      const artworkData = await boothArtworkService.create({
        booth_id: boothId,
        file_url: fileUrl,
      });

      return artworkData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boothArtwork', boothId] });
      setFile(null);
      toast.success('Artwork uploaded successfully!');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Failed to upload artwork: ' + (error.message || 'Unknown error'));
    },
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      await uploadMutation.mutateAsync(file);
    } catch (error) {
      // Error handled in mutation
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (artworkId) => {
    if (!confirm('Are you sure you want to delete this artwork?')) return;

    try {
      await boothArtworkService.delete(artworkId);
      queryClient.invalidateQueries({ queryKey: ['boothArtwork', boothId] });
      toast.success('Artwork deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete artwork');
    }
  };

  return (
    <Card className="border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileImage className="w-5 h-5 text-orange-600" />
          Artwork Files
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Upload Form */}
        <form onSubmit={handleUpload} className="space-y-3 border-2 border-dashed border-orange-200 rounded-lg p-4 bg-orange-50">
          <div>
            <Input
              type="file"
              accept="image/*,.pdf,.ai,.eps,.svg"
              onChange={handleFileChange}
              disabled={uploading}
              className="cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">PNG, SVG, AI, EPS, PDF preferred</p>
          </div>
          {file && (
            <div className="flex items-center justify-between bg-white p-2 rounded border">
              <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          <Button
            type="submit"
            disabled={!file || uploading}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {uploading ? (
              'Uploading...'
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Artwork
              </>
            )}
          </Button>
        </form>

        {/* Artwork List */}
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">Loading artwork...</div>
        ) : artwork.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            No artwork uploaded yet
          </div>
        ) : (
          <div className="space-y-2">
            {artwork.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileImage className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.file_url.split('/').pop()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploaded {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(item.file_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


