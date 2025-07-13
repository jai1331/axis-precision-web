'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Database, User, Lock } from 'lucide-react';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use local proxy to avoid CORS issues
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        username: credentials.username.toLowerCase().trim(),
        password: credentials.password
      });

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw
      };

      const response = await fetch('/api/login', requestOptions);
      const result = await response.json();
      
      if (result.status === 'ok') {
        // Store user data in localStorage (matching React Native format exactly)
        localStorage.setItem('userRole', result.user);
        localStorage.setItem('username', credentials.username);
        localStorage.setItem('token', result.data);
        
        toast({
          title: 'Success',
          description: `Welcome back, ${credentials.username}!`,
        });
        
        // Redirect based on role (matching React Native navigation)
        if (result.user === 'admin') {
          router.push('/');
        } else if (result.user === 'employee') {
          router.push('/employee/entry');
        }
      } else {
        toast({
          title: 'Error',
          description: 'Invalid username or password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: 'Login failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <Database className="h-8 w-8 text-primary mr-2" />
            <span className="text-2xl font-bold">Axis Precision</span>
          </div>
          <CardTitle className="text-2xl">Sign in to your account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access the system
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  className="pl-10"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  className="pl-10"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">System Access:</p>
            <div className="space-y-1 text-xs">
              <p>Please contact your system administrator for login credentials.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}