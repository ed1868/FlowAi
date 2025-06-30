import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SignUp() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to actual signup flow
    window.location.href = '/api/login';
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
              <h1 className="text-3xl font-bold mb-2">Create your account</h1>
              <p className="text-text-secondary">Start your journey to peak productivity</p>
            </div>

            {/* Quick Demo Option */}
            <div className="mb-6">
              <Button
                onClick={() => window.location.href = '/api/test-login'}
                className="w-full glass-button px-6 py-3 rounded-xl text-sm font-medium border-apple-green/30 text-apple-green hover:bg-apple-green/10 mb-4"
                variant="outline"
              >
                <i className="fas fa-user-check mr-2"></i>
                Try Flow with Test User (No signup required)
              </Button>
              
              <div className="relative mb-6">
                <Separator className="bg-glass-border" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-dark-1 px-4 text-text-tertiary text-sm">or create your account</span>
                </div>
              </div>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-text-primary">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    className="glass-input border-glass-border mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-text-primary">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className="glass-input border-glass-border mt-2"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-text-primary">Work Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@company.com"
                  className="glass-input border-glass-border mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="company" className="text-text-primary">Company (Optional)</Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Acme Corp"
                  className="glass-input border-glass-border mt-2"
                />
              </div>

              <Button
                type="submit"
                className="w-full glass-button px-6 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-apple-blue to-apple-indigo hover:shadow-lg"
              >
                <i className="fas fa-rocket mr-2"></i>
                Create Account & Start Free Trial
              </Button>
            </form>

            {/* OAuth Options */}
            <div className="mt-6">
              <div className="relative mb-6">
                <Separator className="bg-glass-border" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-dark-1 px-4 text-text-tertiary text-sm">or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => window.location.href = '/api/login'}
                  variant="outline"
                  className="glass-button px-4 py-3 rounded-xl text-sm font-medium border-glass-border"
                >
                  <i className="fab fa-google mr-2"></i>
                  Google
                </Button>
                <Button
                  onClick={() => window.location.href = '/api/login'}
                  variant="outline"
                  className="glass-button px-4 py-3 rounded-xl text-sm font-medium border-glass-border"
                >
                  <i className="fab fa-github mr-2"></i>
                  GitHub
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 space-y-4">
              <p className="text-text-tertiary text-sm">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-apple-blue hover:underline">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-apple-blue hover:underline">Privacy Policy</a>
              </p>
              
              <p className="text-text-secondary">
                Already have an account?{' '}
                <a 
                  href="/api/login" 
                  className="text-apple-blue hover:underline font-medium"
                >
                  Sign in
                </a>
              </p>
              
              <Button
                onClick={() => window.location.href = '/'}
                variant="ghost"
                className="text-text-tertiary hover:text-text-secondary"
              >
                ← Back to home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}