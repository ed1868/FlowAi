import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, X } from "lucide-react";

export default function Landing() {
  const [timerDisplay, setTimerDisplay] = useState("90:00");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
                onClick={() => scrollToSection('pricing')}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                Pricing
              </button>
              <button 
                onClick={() => window.location.href = '/api/test-login'}
                className="text-apple-green hover:text-apple-green/80 transition-colors"
              >
                Try Demo
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

      {/* Stats Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-apple-blue/10 to-apple-indigo/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "2.3M+", label: "Active Users" },
              { value: "45M+", label: "Focus Sessions" },
              { value: "87%", label: "Productivity Increase" },
              { value: "4.9/5", label: "User Rating" }
            ].map((stat, index) => (
              <div key={index} className="glass-card rounded-2xl p-6">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-text-secondary text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-xl text-text-secondary mb-12">Trusted by leading companies worldwide</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center opacity-60">
            {[
              { name: "Microsoft", logo: "🏢" },
              { name: "Google", logo: "🔍" },
              { name: "Spotify", logo: "🎵" },
              { name: "Netflix", logo: "🎬" },
              { name: "Airbnb", logo: "🏠" },
              { name: "Uber", logo: "🚗" }
            ].map((company, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div className="text-2xl">{company.logo}</div>
                <div className="text-sm text-text-tertiary">{company.name}</div>
              </div>
            ))}
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

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-dark-2 to-dark-3">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">What Our Users Say</h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Join thousands of professionals who've transformed their productivity with Flow
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Flow transformed my productivity. The 90-minute sessions helped me achieve deep focus like never before. My output increased by 300% in just 6 weeks.",
                author: "Sarah Chen",
                role: "Senior Product Manager",
                company: "Microsoft",
                avatar: "👩‍💼"
              },
              {
                quote: "The voice notes feature is incredible. I can capture ideas instantly while walking or driving. The AI transcription is spot-on and saves me hours.",
                author: "Marcus Johnson",
                role: "Creative Director",
                company: "Netflix",
                avatar: "👨‍🎨"
              },
              {
                quote: "Our entire team adopted Flow. The habit tracking and analytics gave us insights into our productivity patterns. Team efficiency improved by 40%.",
                author: "Elena Rodriguez",
                role: "Engineering Lead",
                company: "Spotify",
                avatar: "👩‍💻"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="glass-card rounded-3xl p-8">
                <CardContent className="p-0">
                  <div className="flex items-center mb-6">
                    <div className="text-4xl mr-4">{testimonial.avatar}</div>
                    <div>
                      <h4 className="font-semibold text-text-primary">{testimonial.author}</h4>
                      <p className="text-text-secondary text-sm">{testimonial.role} at {testimonial.company}</p>
                    </div>
                  </div>
                  <p className="text-text-secondary leading-relaxed italic">"{testimonial.quote}"</p>
                  <div className="flex text-apple-orange text-sm mt-4">
                    {"★".repeat(5)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">Simple, Transparent Pricing</h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Choose the plan that fits your productivity journey. No hidden fees, cancel anytime.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: "Free",
                period: "forever",
                description: "Perfect for getting started with focused work",
                features: [
                  "3 focus sessions per day",
                  "Basic journaling",
                  "Simple habit tracking",
                  "Community support",
                  "Mobile app access"
                ],
                cta: "Get Started",
                popular: false,
                gradient: "from-apple-green to-apple-blue"
              },
              {
                name: "Pro",
                price: "$12",
                period: "per month",
                description: "For professionals serious about productivity",
                features: [
                  "Unlimited focus sessions",
                  "Voice notes & AI transcription",
                  "Advanced analytics",
                  "Custom reset rituals",
                  "Priority support",
                  "Calendar integration",
                  "Team collaboration"
                ],
                cta: "Start Free Trial",
                popular: true,
                gradient: "from-apple-orange to-apple-red"
              },
              {
                name: "Teams",
                price: "$8",
                period: "per user/month",
                description: "Scale productivity across your entire team",
                features: [
                  "Everything in Pro",
                  "Team dashboard",
                  "Performance insights",
                  "Admin controls",
                  "SSO integration",
                  "Custom branding",
                  "Dedicated support"
                ],
                cta: "Contact Sales",
                popular: false,
                gradient: "from-purple-500 to-apple-indigo"
              }
            ].map((plan, index) => (
              <Card key={index} className={`glass-card rounded-3xl p-8 relative ${plan.popular ? 'ring-2 ring-apple-orange scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-apple-orange to-apple-red text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardContent className="p-0">
                  <div className={`w-16 h-16 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                    <i className="fas fa-bolt text-white text-2xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-center mb-2">{plan.name}</h3>
                  <div className="text-center mb-4">
                    <span className="text-4xl font-bold gradient-text">{plan.price}</span>
                    {plan.price !== "Free" && <span className="text-text-secondary">/{plan.period}</span>}
                  </div>
                  <p className="text-text-secondary text-center mb-8">{plan.description}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <i className="fas fa-check text-apple-green mr-3"></i>
                        <span className="text-text-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => window.location.href = plan.name === 'Teams' ? '/contact' : '/api/login'}
                    className={`w-full glass-button px-6 py-3 rounded-xl text-sm font-medium ${
                      plan.popular ? 'bg-gradient-to-r from-apple-orange to-apple-red hover:shadow-lg' : 'hover:bg-white/20'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-text-secondary mb-4">All plans include 14-day free trial • No credit card required • Cancel anytime</p>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/api/test-login'}
              className="glass-button px-6 py-3 rounded-xl text-sm font-medium border-apple-green/30 text-apple-green hover:bg-apple-green/10"
            >
              <i className="fas fa-user-check mr-2"></i>
              Try Flow with Test User
            </Button>
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
                  onClick={() => window.location.href = '/signup'}
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
