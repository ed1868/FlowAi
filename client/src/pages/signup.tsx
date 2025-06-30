import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SignUp() {
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        throw new Error("Invalid credentials");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.username && formData.password) {
      loginMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-dark-1 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <Card className="glass-card rounded-3xl p-8">
          <CardContent className="p-0">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-apple-blue to-apple-indigo rounded-lg flex items-center justify-center">
                  <i className="fas fa-bolt text-white"></i>
                </div>
                <span className="text-2xl font-semibold gradient-text">Flow</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-text-secondary">
                {isLogin ? 'Sign in to continue your productivity journey' : 'Start your journey to peak productivity'}
              </p>
            </div>

            {/* Quick Demo Option */}
            <div className="mb-6">
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/test-login', {
                      method: 'GET',
                      headers: {
                        'Accept': 'application/json',
                      },
                    });
                    
                    if (response.ok) {
                      const data = await response.json();
                      if (data.success) {
                        window.location.href = data.redirect || '/';
                      }
                    } else {
                      // Fallback to direct navigation
                      window.location.href = '/api/test-login';
                    }
                  } catch (error) {
                    // Fallback to direct navigation
                    window.location.href = '/api/test-login';
                  }
                }}
                className="w-full glass-button px-6 py-3 rounded-xl text-sm font-medium border-apple-green/30 text-apple-green hover:bg-apple-green/10 mb-4"
                variant="outline"
              >
                <i className="fas fa-user-check mr-2"></i>
                Try as Test User (no signup required)
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-dark-1 px-2 text-text-secondary">or</span>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="glass-input rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="glass-input rounded-xl"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full glass-button px-6 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-apple-blue to-apple-indigo text-white hover:scale-105 transition-all"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-arrow-right mr-2"></i>
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Test Credentials Help */}
            <div className="mt-6 p-4 bg-dark-2/50 rounded-xl border border-apple-blue/20">
              <div className="text-sm text-text-secondary">
                <div className="flex items-center mb-2">
                  <i className="fas fa-info-circle text-apple-blue mr-2"></i>
                  <span className="font-medium">Test Credentials</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div><strong>Username:</strong> test</div>
                  <div><strong>Password:</strong> testing</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6">
              <p className="text-sm text-text-secondary">
                New to Flow?{' '}
                <button 
                  onClick={() => window.location.href = '/api/login'}
                  className="text-apple-blue hover:underline"
                >
                  Create account with Replit
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}