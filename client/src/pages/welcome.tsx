import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Timer, BookOpen, Mic, Target, BarChart3, Sparkles } from "lucide-react";
import { Link } from 'wouter';

function Welcome() {
  useEffect(() => {
    // Confetti or celebration effect could go here
    document.title = "Welcome to Flow!";
    
    // Check if user came from payment success
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntent = urlParams.get('payment_intent');
    const redirectStatus = urlParams.get('redirect_status');
    
    if (paymentIntent && redirectStatus === 'succeeded') {
      // Payment was successful, but we need to create the user account
      // This would typically be handled by a webhook, but for now we'll handle it here
      console.log('Payment successful:', paymentIntent);
    }
  }, []);

  const features = [
    {
      icon: Timer,
      title: "90-Minute Focus Timer",
      description: "Deep work sessions with Pomodoro, Ultradian, and Flowtime methods"
    },
    {
      icon: BookOpen,
      title: "Smart Journaling",
      description: "AI-powered insights, mood tracking, and calendar integration"
    },
    {
      icon: Mic,
      title: "Voice Notes & Cloning",
      description: "Record thoughts and get personalized advice from your future self"
    },
    {
      icon: Target,
      title: "Habit Tracking",
      description: "Build lasting habits with streak counters and analytics"
    },
    {
      icon: BarChart3,
      title: "Productivity Analytics",
      description: "Comprehensive insights into your focus patterns and progress"
    }
  ];

  const quickActions = [
    {
      title: "Start Your First Focus Session",
      description: "Begin with a 90-minute deep work session",
      action: "Go to Timer",
      href: "/timer",
      color: "bg-apple-blue"
    },
    {
      title: "Write Your First Journal Entry",
      description: "Capture your thoughts and track your mood",
      action: "Open Journal",
      href: "/journal",
      color: "bg-apple-green"
    },
    {
      title: "Record a Voice Note",
      description: "Share your thoughts and get AI insights",
      action: "Voice Notes",
      href: "/voice-notes",
      color: "bg-apple-purple"
    }
  ];

  return (
    <div className="min-h-screen pt-24 pb-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Welcome Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="mb-6">
            <div className="w-20 h-20 bg-apple-blue rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Welcome to Flow!
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              You're all set! Your account has been created and you're ready to unlock your productivity potential. 
              Let's get you started with your first session.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-apple-green mb-8">
            <Check className="w-5 h-5" />
            <span className="font-medium">Account created successfully</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Get Started</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardHeader>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={action.href}>
                    <Button className={`w-full ${action.color} hover:opacity-90 text-white`}>
                      {action.action}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">What You Can Do</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="glass-card rounded-xl p-6 text-center group hover:scale-105 transition-all duration-200">
                <div className="w-12 h-12 bg-apple-blue/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-apple-blue/30 transition-colors">
                  <feature.icon className="w-6 h-6 text-apple-blue" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-apple-blue" />
              Pro Tips for Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-apple-green mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Start small:</strong> Begin with a 25-minute Pomodoro session to build momentum
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-apple-green mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Track your mood:</strong> Add mood data to your journal entries for better insights
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-apple-green mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Use voice notes:</strong> Record thoughts quickly when you can't type
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-apple-green mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Review analytics:</strong> Check your progress weekly to stay motivated
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Continue Button */}
        <div className="text-center">
          <Link href="/timer">
            <Button size="lg" className="bg-apple-blue hover:bg-apple-blue/90 text-white px-8 py-4 text-lg">
              Start My First Focus Session
            </Button>
          </Link>
          <p className="text-sm text-text-secondary mt-4">
            You can always access all features from the navigation menu
          </p>
        </div>

      </div>
    </div>
  );
}

export default Welcome;