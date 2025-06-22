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
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your application settings and preferences.
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="email-reports" defaultChecked />
              <Label htmlFor="email-reports">Email notifications for new reports</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="email-incidents" defaultChecked />
              <Label htmlFor="email-incidents">Email notifications for incidents</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="email-users" />
              <Label htmlFor="email-users">Email notifications for user registration</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="sms-alerts" />
              <Label htmlFor="sms-alerts">SMS alerts for critical incidents</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="alert-email">Alert recipient email</Label>
              <Input id="alert-email" defaultValue="admin@singlesafety.com" type="email" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="auto-approve" />
              <Label htmlFor="auto-approve">Auto-approve new user registrations</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="require-training" defaultChecked />
              <Label htmlFor="require-training">Require safety training completion</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="default-role">Default role for new users</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="user">User</option>
                <option value="operator">Operator</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password-reset">Password reset link expiry (hours)</Label>
              <Input id="password-reset" defaultValue="24" type="number" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="backup-frequency">Backup frequency</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="retention-period">Data retention period (months)</Label>
              <Input id="retention-period" defaultValue="36" type="number" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="auto-archive" defaultChecked />
              <Label htmlFor="auto-archive">Auto-archive resolved incidents</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="export-logs" />
              <Label htmlFor="export-logs">Enable audit log exports</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Application Name</Label>
              <Input defaultValue="Single Safety Dashboard" readOnly />
            </div>
            <div className="grid gap-2">
              <Label>Version</Label>
              <Input defaultValue="1.0.0" readOnly />
            </div>
            <div className="grid gap-2">
              <Label>Environment</Label>
              <Input defaultValue="Production" readOnly />
            </div>
            <div className="grid gap-2">
              <Label>Last Updated</Label>
              <Input defaultValue="2024-01-15 10:30:00" readOnly />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}