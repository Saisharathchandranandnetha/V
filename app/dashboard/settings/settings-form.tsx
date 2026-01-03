'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { updateSettings, updateProfile, deleteAccount, updatePassword } from './actions'
import { signout } from '@/app/login/actions'
// import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { useTheme } from "next-themes"

// If useToast doesn't exist, we'll gracefully degrade to console log or a simple robust implementation
// For now I'll implement a simple local toast if the verify fails, but assuming user has shadcn/ui toast.
// Actually, I'll avoid importing useToast if I'm not sure. I'll just rely on state "saved!" messages.

export default function SettingsForm({ user }: { user: any }) {
    const [loading, setLoading] = useState(false)
    const [settings, setSettings] = useState(user.settings || {})
    const [savedSection, setSavedSection] = useState<string | null>(null)
    const { setTheme } = useTheme()

    const handleSettingChange = async (key: string, value: any, section: string) => {
        const newSettings = { ...settings, [key]: value }
        setSettings(newSettings)

        // Auto-save
        try {
            await updateSettings({ [key]: value })
            // Show saved indicator for this section
            setSavedSection(section)
            setTimeout(() => setSavedSection(null), 2000)
        } catch (error) {
            console.error('Failed to save setting:', error)
        }
    }

    const handleProfileUpdate = async (formData: FormData) => {
        setLoading(true)
        try {
            await updateProfile(formData)
            setSavedSection('profile')
            setTimeout(() => setSavedSection(null), 2000)
        } catch (error) {
            console.error('Failed to update profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                await deleteAccount()
            } catch (error) {
                console.error('Failed to delete account:', error)
                alert('Failed to delete account. Please try again.')
            }
        }
    }

    const SavedBadge = ({ section }: { section: string }) => (
        savedSection === section ? <span className="text-xs text-green-500 font-medium animate-in fade-in">Saved!</span> : null
    )

    return (
        <div className="space-y-8">
            {/* SECTION 1: Account & Profile */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle>Account & Profile</CardTitle>
                        <CardDescription>Manage your personal information.</CardDescription>
                    </div>
                    <SavedBadge section="profile" />
                </CardHeader>
                <CardContent>
                    <form action={handleProfileUpdate} className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                {user.avatar ? <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" /> : <div className="text-2xl font-bold text-muted-foreground">{user.name?.[0]}</div>}
                            </div>
                            <Button variant="outline" type="button">Change Avatar</Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input id="name" name="name" defaultValue={user.name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" value={user.email} disabled />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bio">Short Bio / Goal</Label>
                            <Textarea id="bio" name="bio" defaultValue={settings.profileBio} placeholder="I want to learn..." />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Profile
                            </Button>
                        </div>
                    </form>
                    <div className="mt-6 pt-6 border-t flex flex-wrap gap-4">
                        <Button
                            variant="outline"
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={handleDeleteAccount}
                            type="button"
                        >
                            Delete Account
                        </Button>
                        <form action={signout}>
                            <Button variant="outline" type="submit">Log Out</Button>
                        </form>
                    </div>
                </CardContent>
            </Card>

            {/* SECTION: Security */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle>Security</CardTitle>
                        <CardDescription>Update your password.</CardDescription>
                    </div>
                    <SavedBadge section="security" />
                </CardHeader>
                <CardContent>
                    <form
                        action={async (formData) => {
                            setLoading(true)
                            try {
                                await updatePassword(formData)
                                setSavedSection('security')
                                setTimeout(() => setSavedSection(null), 2000)
                                // Optional: Reset form fields manually or via key change if needed, 
                                // but for now a success badge is enough feedback.
                            } catch (error: any) {
                                console.error('Failed to update password:', error)
                                alert(`Failed to update password: ${error.message}`)
                            } finally {
                                setLoading(false)
                            }
                        }}
                        className="space-y-4"
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input id="password" name="password" type="password" required minLength={6} placeholder="••••••••" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} placeholder="••••••••" />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Change Password
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* SECTION 2: Learning Preferences */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle>Learning Preferences</CardTitle>
                        <CardDescription>Customize how you learn.</CardDescription>
                    </div>
                    <SavedBadge section="learning" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <Label>Preferred Learning Style</Label>
                        <RadioGroup
                            defaultValue={settings.learningStyle || 'video'}
                            onValueChange={(val) => handleSettingChange('learningStyle', val, 'learning')}
                            className="flex flex-col space-y-1"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="video" id="video" />
                                <Label htmlFor="video">Video-first</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="reading" id="reading" />
                                <Label htmlFor="reading">Reading-first</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="practice" id="practice" />
                                <Label htmlFor="practice">Practice-first</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="dailyGoal">Daily Study Goal (minutes)</Label>
                            <Input
                                id="dailyGoal"
                                type="number"
                                defaultValue={settings.dailyStudyGoal || 30}
                                onChange={(e) => handleSettingChange('dailyStudyGoal', e.target.value, 'learning')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Difficulty Preference</Label>
                            <Select
                                defaultValue={settings.difficulty || 'intermediate'}
                                onValueChange={(val) => handleSettingChange('difficulty', val, 'learning')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Language</Label>
                            <Select
                                defaultValue={settings.language || 'en'}
                                onValueChange={(val) => handleSettingChange('language', val, 'learning')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="es">Spanish</SelectItem>
                                    <SelectItem value="fr">French</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* SECTION 3: AI Settings */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle>AI Settings</CardTitle>
                        <CardDescription>Configure AI assistant behavior.</CardDescription>
                    </div>
                    <SavedBadge section="ai" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="aiEnabled" className="flex flex-col space-y-1">
                            <span>Enable AI Features</span>
                            <span className="font-normal text-xs text-muted-foreground">Master toggle for all AI logic.</span>
                        </Label>
                        <Switch
                            id="aiEnabled"
                            checked={settings.aiEnabled !== false}
                            onCheckedChange={(val) => handleSettingChange('aiEnabled', val, 'ai')}
                        />
                    </div>
                    {settings.aiEnabled !== false && (
                        <>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="aiAutoSummary">Auto-generate Summary</Label>
                                <Switch
                                    id="aiAutoSummary"
                                    checked={settings.aiAutoSummary || false}
                                    onCheckedChange={(val) => handleSettingChange('aiAutoSummary', val, 'ai')}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="aiAutoFlashcards">Auto-generate Flashcards</Label>
                                <Switch
                                    id="aiAutoFlashcards"
                                    checked={settings.aiAutoFlashcards || false}
                                    onCheckedChange={(val) => handleSettingChange('aiAutoFlashcards', val, 'ai')}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label>AI Explain Mode</Label>
                                <Select
                                    defaultValue={settings.aiExplainMode || 'standard'}
                                    onValueChange={(val) => handleSettingChange('aiExplainMode', val, 'ai')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="eli5">Explain like I'm 15</SelectItem>
                                        <SelectItem value="standard">Standard</SelectItem>
                                        <SelectItem value="technical">Technical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">Clear AI History</Button>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* SECTION 4: Resource & Content */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Resource Settings</CardTitle>
                    <SavedBadge section="resources" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <Label>Default Validity</Label>
                        <RadioGroup
                            defaultValue={settings.defaultPrivacy || 'private'}
                            onValueChange={(val) => handleSettingChange('defaultPrivacy', val, 'resources')}
                            className="flex space-x-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="private" id="priv" />
                                <Label htmlFor="priv">Private</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="public" id="pub" />
                                <Label htmlFor="pub">Public</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="autoTag">Auto-tag Resources</Label>
                        <Switch
                            id="autoTag"
                            checked={settings.autoTagging || false}
                            onCheckedChange={(val) => handleSettingChange('autoTagging', val, 'resources')}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* SECTION 5: 3D & Animation */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>3D & Animation</CardTitle>
                    <SavedBadge section="3d" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="enable3D">Enable 3D Content</Label>
                        <Switch
                            id="enable3D"
                            checked={settings.enable3D !== false}
                            onCheckedChange={(val) => handleSettingChange('enable3D', val, '3d')}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="enableSpline">Enable Spline Embeds</Label>
                        <Switch
                            id="enableSpline"
                            checked={settings.enableSpline !== false}
                            onCheckedChange={(val) => handleSettingChange('enableSpline', val, '3d')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Load 3D Content</Label>
                        <Select
                            defaultValue={settings.load3DMode || 'always'}
                            onValueChange={(val) => handleSettingChange('load3DMode', val, '3d')}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="always">Always</SelectItem>
                                <SelectItem value="wifi">Wi-Fi Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* SECTION 6: Notifications */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Notifications</CardTitle>
                    <SavedBadge section="notifications" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="studyReminders">Study Reminders</Label>
                        <Switch
                            id="studyReminders"
                            checked={settings.studyReminders || false}
                            onCheckedChange={(val) => handleSettingChange('studyReminders', val, 'notifications')}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="streakReminders">Streak Reminders</Label>
                        <Switch
                            id="streakReminders"
                            checked={settings.streakReminders || false}
                            onCheckedChange={(val) => handleSettingChange('streakReminders', val, 'notifications')}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="emailNotif">Email Notifications</Label>
                        <Switch
                            id="emailNotif"
                            checked={settings.emailNotifications || false}
                            onCheckedChange={(val) => handleSettingChange('emailNotifications', val, 'notifications')}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* SECTION 9: Appearance */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Appearance</CardTitle>
                    <SavedBadge section="appearance" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <Label>Theme</Label>
                        <RadioGroup
                            defaultValue={settings.theme || 'system'}
                            onValueChange={(val) => {
                                handleSettingChange('theme', val, 'appearance')
                                setTheme(val)
                            }}
                            className="flex space-x-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="light" id="light" />
                                <Label htmlFor="light">Light</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="dark" id="dark" />
                                <Label htmlFor="dark">Dark</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="system" id="system" />
                                <Label htmlFor="system">System</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="reduceMotion">Reduce Motion</Label>
                        <Switch
                            id="reduceMotion"
                            checked={settings.reduceMotion || false}
                            onCheckedChange={(val) => handleSettingChange('reduceMotion', val, 'appearance')}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* SECTION 8: Privacy & Data */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Privacy & Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="analytics">Allow Analytics</Label>
                        <Switch
                            id="analytics"
                            checked={settings.analyticsEnabled !== false}
                            onCheckedChange={(val) => handleSettingChange('analyticsEnabled', val, 'privacy')}
                        />
                    </div>
                    <div className="pt-4 flex gap-4">
                        <Button variant="outline" asChild>
                            <a href="/api/user/data" target="_blank" rel="noopener noreferrer">Download My Data</a>
                        </Button>
                        <Button variant="outline">Clear History</Button>
                    </div>
                </CardContent>
            </Card>

            {/* SECTION 7: Planner & Productivity */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Planner & Productivity</CardTitle>
                    <SavedBadge section="planner" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="sessionLen">Session Length (mins)</Label>
                            <Input
                                id="sessionLen"
                                type="number"
                                defaultValue={settings.sessionLength || 45}
                                onChange={(e) => handleSettingChange('sessionLength', e.target.value, 'planner')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="breakLen">Break Duration (mins)</Label>
                            <Input
                                id="breakLen"
                                type="number"
                                defaultValue={settings.breakLength || 10}
                                onChange={(e) => handleSettingChange('breakLength', e.target.value, 'planner')}
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="autoStart">Auto-start Next Session</Label>
                        <Switch
                            id="autoStart"
                            checked={settings.autoStartNext || false}
                            onCheckedChange={(val) => handleSettingChange('autoStartNext', val, 'planner')}
                        />
                    </div>
                    <div className="space-y-3">
                        <Label>Week Starts On</Label>
                        <RadioGroup
                            defaultValue={settings.weekStart || 'mon'}
                            onValueChange={(val) => handleSettingChange('weekStart', val, 'planner')}
                            className="flex space-x-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="mon" id="mon" />
                                <Label htmlFor="mon">Monday</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="sun" id="sun" />
                                <Label htmlFor="sun">Sunday</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </CardContent>
            </Card>

            {/* SECTION 10: Help & About */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Help & About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Button variant="outline" className="w-full">App Walkthrough</Button>
                        <Button variant="outline" className="w-full">FAQ & Support</Button>
                        <Button variant="outline" className="w-full">Report a Bug</Button>
                        <Button variant="outline" className="w-full">Request Feature</Button>
                    </div>
                    <div className="pt-4 text-center text-sm text-muted-foreground">
                        <p>Version 1.2.0 (Beta)</p>
                        <p>Changelog</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
