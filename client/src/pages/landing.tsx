import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const [timerDisplay, setTimerDisplay] = useState("90:00");
  
  useEffect(() => {
    // Demo timer animation
    let timeRemaining = 90 * 60;
    const interval = setInterval(() => {
      if (timeRemaining > 0) {
        timeRemaining--;
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        setTimerDisplay(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-dark-1 text-text-primary overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-apple-blue to-apple-indigo rounded-lg flex items-center justify-center">
                <i className="fas fa-bolt text-white text-sm"></i>
              </div>
              <span className="text-xl font-semibold gradient-text">Flow</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('dashboard')}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                Dashboard
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                Pricing
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/api/login'}
                className="text-text-secondary hover:text-text-primary"
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/api/test-login'}
                className="glass-button px-4 py-2 rounded-xl text-sm font-medium border-apple-blue/30 text-apple-blue hover:bg-apple-blue/10"
              >
                Test User
              </Button>
              <Button
                onClick={() => window.location.href = '/api/login'}
                className="glass-button px-6 py-2 rounded-xl text-sm font-medium hover:bg-white/20"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-apple-blue/20 via-transparent to-apple-indigo/20"></div>
        
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">Deep Work</span><br />
              <span className="text-text-primary">Reimagined</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your productivity with 90-minute focus sessions, intelligent break reminders, 
              and powerful habit tracking—all in one elegant suite.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={() => window.location.href = '/api/login'}
                className="glass-button px-8 py-4 rounded-2xl text-lg font-medium hover:animate-glow"
              >
                <i className="fas fa-play mr-2"></i>
                Start Your First Session
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/api/test-login'}
                className="glass-button px-8 py-4 rounded-2xl text-lg font-medium border-apple-green/30 text-apple-green hover:bg-apple-green/10"
              >
                <i className="fas fa-user-check mr-2"></i>
                Try as Test User
              </Button>
              <Button
                variant="outline"
                onClick={() => scrollToSection('dashboard')}
                className="glass-button px-8 py-4 rounded-2xl text-lg font-medium"
              >
                <i className="fas fa-chart-line mr-2"></i>
                View Demo
              </Button>
            </div>
            
            {/* Hero Visual */}
            <div className="relative animate-float">
              <Card className="glass-card rounded-3xl p-8 max-w-md mx-auto">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Deep Work Session</h3>
                    <span className="text-apple-green text-sm">Active</span>
                  </div>
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                      <path 
                        className="text-dark-3" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        fill="none" 
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path 
                        className="text-apple-blue progress-ring" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        fill="none" 
                        strokeDasharray="75, 100" 
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{timerDisplay}</div>
                        <div className="text-sm text-text-tertiary">remaining</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <button className="w-12 h-12 bg-apple-blue/20 rounded-full flex items-center justify-center">
                      <i className="fas fa-pause text-apple-blue"></i>
                    </button>
                    <button className="w-12 h-12 bg-apple-red/20 rounded-full flex items-center justify-center">
                      <i className="fas fa-stop text-apple-red"></i>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">Powerful Features</h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Every tool you need to master deep work and build lasting habits
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "fas fa-clock",
                title: "90-Minute Sessions",
                description: "Scientifically-optimized deep work sessions with intelligent break reminders and progress tracking.",
                gradient: "from-apple-blue to-apple-indigo"
              },
              {
                icon: "fas fa-pen-fancy",
                title: "Smart Journaling",
                description: "Capture thoughts and insights with timestamped entries and intelligent reflection prompts.",
                gradient: "from-apple-orange to-apple-red"
              },
              {
                icon: "fas fa-microphone",
                title: "Voice Notes",
                description: "Record ideas instantly with browser-based voice recording and intelligent transcription.",
                gradient: "from-apple-green to-apple-blue"
              },
              {
                icon: "fas fa-chart-line",
                title: "Habit Tracking",
                description: "Build lasting habits with streak counters, visual analytics, and personalized insights.",
                gradient: "from-purple-500 to-apple-indigo"
              },
              {
                icon: "fas fa-spa",
                title: "Reset Rituals",
                description: "Customizable wellness rituals to refresh your mind between sessions and maintain peak performance.",
                gradient: "from-apple-orange to-yellow-500"
              },
              {
                icon: "fas fa-analytics",
                title: "Smart Analytics",
                description: "Visualize your productivity patterns with beautiful charts and actionable insights.",
                gradient: "from-pink-500 to-apple-red"
              }
            ].map((feature, index) => (
              <Card key={index} className="glass-card rounded-3xl p-8 hover:scale-105 transition-transform duration-300">
                <CardContent className="p-0">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6`}>
                    <i className={`${feature.icon} text-white text-2xl`}></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="glass-card rounded-3xl p-12">
            <CardContent className="p-0">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to <span className="gradient-text">Transform</span> Your Productivity?
              </h2>
              <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
                Join thousands of professionals who've already mastered deep work with Flow. 
                Start your journey to peak productivity today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  onClick={() => window.location.href = '/api/login'}
                  className="glass-button px-8 py-4 rounded-2xl text-lg font-medium hover:animate-glow"
                >
                  <i className="fas fa-rocket mr-2"></i>
                  Start Free Trial
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/api/test-login'}
                  className="glass-button px-8 py-4 rounded-2xl text-lg font-medium border-apple-green/30 text-apple-green hover:bg-apple-green/10"
                >
                  <i className="fas fa-user-check mr-2"></i>
                  Try as Test User
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/api/login'}
                  className="glass-button px-8 py-4 rounded-2xl text-lg font-medium"
                >
                  <i className="fas fa-calendar mr-2"></i>
                  Book a Demo
                </Button>
              </div>
              
              <div className="flex items-center justify-center space-x-8 text-text-tertiary text-sm">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-check text-apple-green"></i>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-check text-apple-green"></i>
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-check text-apple-green"></i>
                  <span>Cancel anytime</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-glass">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-apple-blue to-apple-indigo rounded-lg flex items-center justify-center">
                  <i className="fas fa-bolt text-white text-sm"></i>
                </div>
                <span className="text-xl font-semibold gradient-text">Flow</span>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                The premium productivity suite for deep work masters and habit builders.
              </p>
            </div>
            
            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Changelog", "Roadmap"]
              },
              {
                title: "Resources", 
                links: ["Documentation", "API Reference", "Help Center", "Blog"]
              },
              {
                title: "Company",
                links: ["About", "Privacy", "Terms", "Contact"]
              }
            ].map((section, index) => (
              <div key={index}>
                <h4 className="text-text-primary font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-2 text-text-secondary text-sm">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href="#" className="hover:text-text-primary transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-glass mt-8 pt-8 text-center text-text-tertiary text-sm">
            <p>&copy; 2024 Flow. All rights reserved. Built with precision and passion.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
