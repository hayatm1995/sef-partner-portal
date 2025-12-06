import React, { useState, useEffect } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Plus, Trash2, Save, Ruler, Zap, Copy, Archive, CheckCircle, FileText, History } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminStandConfig({ onClose }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("list");
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['standConfigs'],
    queryFn: () => base44.entities.StandConfiguration.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StandConfiguration.create(data),
    onSuccess: (newConfig) => {
      queryClient.invalidateQueries({ queryKey: ['standConfigs'] });
      toast.success("Configuration created!");
      setSelectedConfig(newConfig);
      setActiveTab("edit");
      setIsCreating(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StandConfiguration.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['standConfig'] });
      toast.success("Configuration saved!");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StandConfiguration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standConfigs'] });
      setSelectedConfig(null);
      setActiveTab("list");
      toast.success("Configuration deleted!");
    }
  });

  const handleCreateNew = () => {
    setIsCreating(true);
  };

  const handleCreateConfig = (name) => {
    createMutation.mutate({
      name,
      status: "draft",
      version: "1.0",
      artwork_requirements: [],
      available_voltages: ["110V", "220V", "380V", "415V"],
      guidelines: {
        file_formats: "PDF, PNG, JPEG, AI, EPS",
        min_resolution: "300 DPI",
        color_mode: "CMYK",
        bleed_area: "5mm minimum",
        review_time: "3-5 business days"
      },
      applicable_booth_types: ["sef_built", "partner_built"]
    });
  };

  const handleDuplicate = (config) => {
    createMutation.mutate({
      ...config,
      id: undefined,
      name: `${config.name} (Copy)`,
      status: "draft",
      is_default: false,
      version: "1.0",
      version_history: []
    });
  };

  const handleSetDefault = async (config) => {
    // Remove default from all others first
    const updates = configs
      .filter(c => c.is_default && c.id !== config.id)
      .map(c => base44.entities.StandConfiguration.update(c.id, { is_default: false }));
    
    await Promise.all(updates);
    await updateMutation.mutateAsync({ id: config.id, data: { is_default: true, status: "active" } });
    toast.success(`${config.name} is now the default configuration`);
  };

  const handleArchive = (config) => {
    updateMutation.mutate({ 
      id: config.id, 
      data: { status: "archived", is_default: false } 
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      active: "bg-green-100 text-green-800",
      archived: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-600" />
              Stand Configuration Manager
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b px-6 py-2 flex-shrink-0">
            <TabsList>
              <TabsTrigger value="list">All Configurations</TabsTrigger>
              {selectedConfig && <TabsTrigger value="edit">Edit: {selectedConfig.name}</TabsTrigger>}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="list" className="p-6 m-0">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-semibold text-lg">Configuration Templates</h3>
                  <p className="text-sm text-gray-600">Create and manage stand configuration templates</p>
                </div>
                <Button onClick={handleCreateNew} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Configuration
                </Button>
              </div>

              <AnimatePresence>
                {isCreating && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <Card className="border-2 border-indigo-200 bg-indigo-50">
                      <CardContent className="p-4">
                        <CreateConfigForm 
                          onSubmit={handleCreateConfig} 
                          onCancel={() => setIsCreating(false)}
                          isPending={createMutation.isPending}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid gap-4">
                {configs.map((config) => (
                  <Card key={config.id} className={`border-2 ${config.is_default ? 'border-green-300 bg-green-50/50' : 'border-gray-200'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">{config.name}</h4>
                            <Badge className={getStatusColor(config.status)}>{config.status}</Badge>
                            {config.is_default && (
                              <Badge className="bg-green-500 text-white">Default</Badge>
                            )}
                            <Badge variant="outline">v{config.version || "1.0"}</Badge>
                          </div>
                          {config.description && (
                            <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                          )}
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span>{config.artwork_requirements?.length || 0} artwork requirements</span>
                            <span>{config.available_voltages?.length || 0} voltage options</span>
                            {config.applicable_booth_types?.length > 0 && (
                              <span>For: {config.applicable_booth_types.join(", ")}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => { setSelectedConfig(config); setActiveTab("edit"); }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDuplicate(config)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {!config.is_default && config.status !== "archived" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSetDefault(config)}
                              className="text-green-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {config.status !== "archived" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleArchive(config)}
                              className="text-orange-600"
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {configs.length === 0 && !isCreating && (
                  <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                      <Settings className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <h3 className="font-semibold mb-2">No Configurations Yet</h3>
                      <p className="text-gray-600 mb-4">Create your first stand configuration template</p>
                      <Button onClick={handleCreateNew}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Configuration
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="edit" className="p-6 m-0">
              {selectedConfig && (
                <ConfigEditor 
                  config={selectedConfig} 
                  onSave={(data) => updateMutation.mutate({ id: selectedConfig.id, data })}
                  onDelete={() => deleteMutation.mutate(selectedConfig.id)}
                  isSaving={updateMutation.isPending}
                />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}

function CreateConfigForm({ onSubmit, onCancel, isPending }) {
  const [name, setName] = useState("");

  return (
    <div className="flex gap-3 items-end">
      <div className="flex-1">
        <Label>Configuration Name</Label>
        <Input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="e.g., Standard Booth 2026, Premium Package"
        />
      </div>
      <Button onClick={() => onSubmit(name)} disabled={!name || isPending}>
        {isPending ? "Creating..." : "Create"}
      </Button>
      <Button variant="outline" onClick={onCancel}>Cancel</Button>
    </div>
  );
}

function ConfigEditor({ config, onSave, onDelete, isSaving }) {
  const [formData, setFormData] = useState({
    name: config.name || "",
    description: config.description || "",
    version: config.version || "1.0",
    status: config.status || "draft",
    artwork_requirements: config.artwork_requirements || [],
    available_voltages: config.available_voltages || ["110V", "220V", "380V", "415V"],
    guidelines: config.guidelines || {},
    applicable_booth_types: config.applicable_booth_types || ["sef_built", "partner_built"]
  });

  const [newVoltage, setNewVoltage] = useState("");
  const [activeSection, setActiveSection] = useState("basic");

  const addArtworkReq = () => {
    setFormData(prev => ({
      ...prev,
      artwork_requirements: [...prev.artwork_requirements, {
        name: "",
        width: 0,
        height: 0,
        description: "",
        is_required: false,
        accepted_formats: ["PDF", "AI", "EPS", "PNG"],
        min_resolution_dpi: 300,
        color_mode: "CMYK",
        bleed_area_mm: 5,
        max_file_size_mb: 50,
        notes: ""
      }]
    }));
  };

  const updateArtworkReq = (index, field, value) => {
    const updated = [...formData.artwork_requirements];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, artwork_requirements: updated }));
  };

  const removeArtworkReq = (index) => {
    setFormData(prev => ({
      ...prev,
      artwork_requirements: prev.artwork_requirements.filter((_, i) => i !== index)
    }));
  };

  const addVoltage = () => {
    if (newVoltage && !formData.available_voltages.includes(newVoltage)) {
      setFormData(prev => ({
        ...prev,
        available_voltages: [...prev.available_voltages, newVoltage]
      }));
      setNewVoltage("");
    }
  };

  const removeVoltage = (voltage) => {
    setFormData(prev => ({
      ...prev,
      available_voltages: prev.available_voltages.filter(v => v !== voltage)
    }));
  };

  const handleSave = () => {
    const versionHistory = config.version_history || [];
    if (formData.version !== config.version) {
      versionHistory.push({
        version: config.version,
        changed_at: new Date().toISOString(),
        change_notes: `Updated to v${formData.version}`
      });
    }
    onSave({ ...formData, version_history: versionHistory });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b pb-4">
        {["basic", "artwork", "power", "guidelines"].map((section) => (
          <Button
            key={section}
            variant={activeSection === section ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection(section)}
            className="capitalize"
          >
            {section}
          </Button>
        ))}
      </div>

      {activeSection === "basic" && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Configuration Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Standard Booth 2026"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Version</Label>
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="1.0"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this configuration template..."
              rows={3}
            />
          </div>

          <div>
            <Label>Applicable Booth Types</Label>
            <div className="flex gap-4 mt-2">
              {["sef_built", "partner_built"].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.applicable_booth_types?.includes(type)}
                    onChange={(e) => {
                      const types = e.target.checked
                        ? [...(formData.applicable_booth_types || []), type]
                        : formData.applicable_booth_types.filter(t => t !== type);
                      setFormData(prev => ({ ...prev, applicable_booth_types: types }));
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{type === "sef_built" ? "SEF Built" : "Partner Built"}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === "artwork" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold">Artwork Requirements</h3>
            </div>
            <Button onClick={addArtworkReq} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Add Requirement
            </Button>
          </div>

          <div className="space-y-4">
            {formData.artwork_requirements.map((req, index) => (
              <Card key={index} className="bg-gray-50">
                <CardContent className="p-4 space-y-3">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Artwork Type *</Label>
                      <Input
                        value={req.name}
                        onChange={(e) => updateArtworkReq(index, 'name', e.target.value)}
                        placeholder="e.g., Main Banner"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Width (m) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={req.width}
                          onChange={(e) => updateArtworkReq(index, 'width', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Height (m) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={req.height}
                          onChange={(e) => updateArtworkReq(index, 'height', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Min DPI</Label>
                        <Input
                          type="number"
                          value={req.min_resolution_dpi || 300}
                          onChange={(e) => updateArtworkReq(index, 'min_resolution_dpi', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Bleed (mm)</Label>
                        <Input
                          type="number"
                          value={req.bleed_area_mm || 5}
                          onChange={(e) => updateArtworkReq(index, 'bleed_area_mm', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Accepted Formats</Label>
                      <Input
                        value={(req.accepted_formats || []).join(", ")}
                        onChange={(e) => updateArtworkReq(index, 'accepted_formats', e.target.value.split(",").map(s => s.trim()))}
                        placeholder="PDF, AI, EPS, PNG"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Color Mode</Label>
                      <Select
                        value={req.color_mode || "CMYK"}
                        onValueChange={(value) => updateArtworkReq(index, 'color_mode', value)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CMYK">CMYK</SelectItem>
                          <SelectItem value="RGB">RGB</SelectItem>
                          <SelectItem value="Any">Any</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Max File Size (MB)</Label>
                      <Input
                        type="number"
                        value={req.max_file_size_mb || 50}
                        onChange={(e) => updateArtworkReq(index, 'max_file_size_mb', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Description / Notes</Label>
                    <Textarea
                      value={req.description || ""}
                      onChange={(e) => updateArtworkReq(index, 'description', e.target.value)}
                      rows={2}
                      placeholder="Additional details..."
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={req.is_required}
                        onChange={(e) => updateArtworkReq(index, 'is_required', e.target.checked)}
                        className="w-4 h-4"
                      />
                      Required
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArtworkReq(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {formData.artwork_requirements.length === 0 && (
              <p className="text-center text-gray-500 py-8">No artwork requirements defined</p>
            )}
          </div>
        </div>
      )}

      {activeSection === "power" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold">Power Voltage Options</h3>
          </div>

          <div className="flex gap-2 mb-3">
            <Input
              value={newVoltage}
              onChange={(e) => setNewVoltage(e.target.value)}
              placeholder="e.g., 440V"
              className="max-w-xs"
            />
            <Button onClick={addVoltage} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.available_voltages.map((voltage, index) => (
              <Badge
                key={index}
                variant="outline"
                className="px-3 py-1.5 text-sm bg-yellow-50 border-yellow-300 text-yellow-900 flex items-center gap-2"
              >
                {voltage}
                <button
                  onClick={() => removeVoltage(voltage)}
                  className="text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {activeSection === "guidelines" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold">General Artwork Guidelines</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Accepted File Formats</Label>
              <Input
                value={formData.guidelines?.file_formats || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  guidelines: { ...prev.guidelines, file_formats: e.target.value } 
                }))}
                placeholder="PDF, PNG, JPEG, AI, EPS"
              />
            </div>
            <div>
              <Label className="text-xs">Minimum Resolution</Label>
              <Input
                value={formData.guidelines?.min_resolution || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  guidelines: { ...prev.guidelines, min_resolution: e.target.value } 
                }))}
                placeholder="300 DPI"
              />
            </div>
            <div>
              <Label className="text-xs">Color Mode</Label>
              <Input
                value={formData.guidelines?.color_mode || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  guidelines: { ...prev.guidelines, color_mode: e.target.value } 
                }))}
                placeholder="CMYK"
              />
            </div>
            <div>
              <Label className="text-xs">Bleed Area</Label>
              <Input
                value={formData.guidelines?.bleed_area || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  guidelines: { ...prev.guidelines, bleed_area: e.target.value } 
                }))}
                placeholder="5mm minimum"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Review Time</Label>
              <Input
                value={formData.guidelines?.review_time || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  guidelines: { ...prev.guidelines, review_time: e.target.value } 
                }))}
                placeholder="3-5 business days"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-between pt-4 border-t">
        <Button variant="destructive" onClick={onDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Configuration
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}