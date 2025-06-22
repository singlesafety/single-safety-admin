import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Bell, Shield, Users, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">설정</h2>
        <p className="text-muted-foreground">
          싱글 세이프티 애플리케이션의 설정을 관리하세요.
        </p>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input id="session-timeout" defaultValue="30" type="number" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="require-2fa" defaultChecked />
              <Label htmlFor="require-2fa">Require two-factor authentication</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="password-complexity" defaultChecked />
              <Label htmlFor="password-complexity">Enforce strong password requirements</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="login-alerts" defaultChecked />
              <Label htmlFor="login-alerts">Send email alerts for failed login attempts</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}