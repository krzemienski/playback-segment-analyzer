import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, Bell, Video, Server, Shield, Palette } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [processingSettings, setProcessingSettings] = useState({
    sensitivity: 0.7,
    minDuration: 2,
    algorithm: "fast",
    autoProcess: true,
    generatePreviews: true,
    extractThumbnails: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    browserNotifications: false,
    jobComplete: true,
    jobFailed: true,
    storageAlerts: true,
  });

  const [apiSettings, setApiSettings] = useState({
    rateLimit: "100",
    maxUploadSize: "10",
    enableWebhooks: false,
    webhookUrl: "",
  });

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" data-testid="settings-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-card-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your application preferences and configuration</p>
      </div>

      <Tabs defaultValue="processing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="processing" data-testid="tab-processing">
            <Video className="h-4 w-4 mr-2" />
            Processing
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="api" data-testid="tab-api">
            <Server className="h-4 w-4 mr-2" />
            API
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance" data-testid="tab-appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scene Detection Settings</CardTitle>
              <CardDescription>Configure how videos are processed and analyzed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sensitivity">Detection Sensitivity</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    id="sensitivity"
                    min={0.1}
                    max={1}
                    step={0.1}
                    value={[processingSettings.sensitivity]}
                    onValueChange={(value) => setProcessingSettings({...processingSettings, sensitivity: value[0]})}
                    className="flex-1"
                    data-testid="sensitivity-slider"
                  />
                  <span className="w-12 text-sm font-medium">{processingSettings.sensitivity}</span>
                </div>
                <p className="text-xs text-muted-foreground">Higher values detect more subtle scene changes</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minDuration">Minimum Scene Duration (seconds)</Label>
                <Input
                  id="minDuration"
                  type="number"
                  value={processingSettings.minDuration}
                  onChange={(e) => setProcessingSettings({...processingSettings, minDuration: parseInt(e.target.value)})}
                  min="1"
                  max="30"
                  data-testid="min-duration-input"
                />
                <p className="text-xs text-muted-foreground">Scenes shorter than this will be merged</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="algorithm">Detection Algorithm</Label>
                <Select
                  value={processingSettings.algorithm}
                  onValueChange={(value) => setProcessingSettings({...processingSettings, algorithm: value})}
                >
                  <SelectTrigger id="algorithm" data-testid="algorithm-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">Fast (Lower accuracy)</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="accurate">Accurate (Slower)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoProcess">Auto-process on upload</Label>
                    <p className="text-xs text-muted-foreground">Start processing immediately after upload</p>
                  </div>
                  <Switch
                    id="autoProcess"
                    checked={processingSettings.autoProcess}
                    onCheckedChange={(checked) => setProcessingSettings({...processingSettings, autoProcess: checked})}
                    data-testid="auto-process-switch"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="generatePreviews">Generate preview videos</Label>
                    <p className="text-xs text-muted-foreground">Create low-resolution preview files</p>
                  </div>
                  <Switch
                    id="generatePreviews"
                    checked={processingSettings.generatePreviews}
                    onCheckedChange={(checked) => setProcessingSettings({...processingSettings, generatePreviews: checked})}
                    data-testid="generate-previews-switch"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="extractThumbnails">Extract thumbnails</Label>
                    <p className="text-xs text-muted-foreground">Generate thumbnail images for scenes</p>
                  </div>
                  <Switch
                    id="extractThumbnails"
                    checked={processingSettings.extractThumbnails}
                    onCheckedChange={(checked) => setProcessingSettings({...processingSettings, extractThumbnails: checked})}
                    data-testid="extract-thumbnails-switch"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified about events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                  data-testid="email-notifications-switch"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="browserNotifications">Browser notifications</Label>
                  <p className="text-xs text-muted-foreground">Show desktop notifications</p>
                </div>
                <Switch
                  id="browserNotifications"
                  checked={notificationSettings.browserNotifications}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, browserNotifications: checked})}
                  data-testid="browser-notifications-switch"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="jobComplete">Job completion</Label>
                  <p className="text-xs text-muted-foreground">Notify when processing completes</p>
                </div>
                <Switch
                  id="jobComplete"
                  checked={notificationSettings.jobComplete}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, jobComplete: checked})}
                  data-testid="job-complete-switch"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="jobFailed">Job failures</Label>
                  <p className="text-xs text-muted-foreground">Alert when processing fails</p>
                </div>
                <Switch
                  id="jobFailed"
                  checked={notificationSettings.jobFailed}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, jobFailed: checked})}
                  data-testid="job-failed-switch"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="storageAlerts">Storage alerts</Label>
                  <p className="text-xs text-muted-foreground">Warn when storage is running low</p>
                </div>
                <Switch
                  id="storageAlerts"
                  checked={notificationSettings.storageAlerts}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, storageAlerts: checked})}
                  data-testid="storage-alerts-switch"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Configure API settings and integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="rateLimit">Rate Limit (requests per minute)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={apiSettings.rateLimit}
                  onChange={(e) => setApiSettings({...apiSettings, rateLimit: e.target.value})}
                  data-testid="rate-limit-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUploadSize">Max Upload Size (GB)</Label>
                <Input
                  id="maxUploadSize"
                  type="number"
                  value={apiSettings.maxUploadSize}
                  onChange={(e) => setApiSettings({...apiSettings, maxUploadSize: e.target.value})}
                  data-testid="max-upload-size-input"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableWebhooks">Enable webhooks</Label>
                    <p className="text-xs text-muted-foreground">Send events to external endpoints</p>
                  </div>
                  <Switch
                    id="enableWebhooks"
                    checked={apiSettings.enableWebhooks}
                    onCheckedChange={(checked) => setApiSettings({...apiSettings, enableWebhooks: checked})}
                    data-testid="enable-webhooks-switch"
                  />
                </div>

                {apiSettings.enableWebhooks && (
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      type="url"
                      placeholder="https://your-webhook-endpoint.com"
                      value={apiSettings.webhookUrl}
                      onChange={(e) => setApiSettings({...apiSettings, webhookUrl: e.target.value})}
                      data-testid="webhook-url-input"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-factor authentication</Label>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" size="sm" data-testid="enable-2fa-button">Enable</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>API keys</Label>
                    <p className="text-xs text-muted-foreground">Manage API access tokens</p>
                  </div>
                  <Button variant="outline" size="sm" data-testid="manage-api-keys-button">Manage</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session timeout</Label>
                    <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-32" data-testid="session-timeout-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select defaultValue="system">
                  <SelectTrigger data-testid="theme-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Accent color</Label>
                <div className="flex space-x-2">
                  {["blue", "green", "purple", "orange", "red"].map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full bg-${color}-500 hover:ring-2 hover:ring-offset-2 hover:ring-${color}-500`}
                      data-testid={`color-${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Display density</Label>
                <Select defaultValue="normal">
                  <SelectTrigger data-testid="density-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} data-testid="save-settings-button">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}