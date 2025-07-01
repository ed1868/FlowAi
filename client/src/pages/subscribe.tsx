import React, { useState, useEffect } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Brain, Calendar, Mic } from "lucide-react";

// Placeholder Stripe key - will be replaced with real key
const STRIPE_PUBLIC_KEY = "pk_test_placeholder_key";
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

const signupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    description: "Perfect for getting started with productivity",
    features: [
      "Basic 90-minute focus timer",
      "Simple journaling",
      "5 voice notes per month",
      "Basic habit tracking",
      "Limited analytics"
    ],
    popular: false,
    color: "gray"
  },
  {
    id: "pro",
    name: "Flow Pro",
    price: 12,
    period: "month",
    description: "Unlock your full productivity potential",
    features: [
      "Unlimited focus sessions",
      "Advanced journaling with AI insights",
      "Unlimited voice notes & transcription",
      "Voice cloning for personalized advice",
      "Comprehensive habit analytics",
      "Advanced workflow methods",
      "Priority support",
      "Export & backup features"
    ],
    popular: true,
    color: "blue"
  },
  {
    id: "team",
    name: "Flow Team",
    price: 25,
    period: "month",
    description: "Built for teams and organizations",
    features: [
      "Everything in Pro",
      "Team dashboard & insights",
      "Collaborative habits",
      "Team focus sessions",
      "Admin management tools",
      "Advanced reporting",
      "Custom integrations",
      "Dedicated support"
    ],
    popular: false,
    color: "purple"
  }
];

function PlanCard({ plan, isSelected, onSelect }: { plan: typeof SUBSCRIPTION_PLANS[0], isSelected: boolean, onSelect: () => void }) {
  const colorClasses: Record<string, string> = {
    gray: "border-gray-200 dark:border-gray-700",
    blue: "border-apple-blue dark:border-apple-blue",
    purple: "border-apple-purple dark:border-apple-purple"
  };

  const selectedClasses: Record<string, string> = {
    gray: "ring-2 ring-gray-400",
    blue: "ring-2 ring-apple-blue",
    purple: "ring-2 ring-apple-purple"
  };

  return (
    <Card 
      className={`relative cursor-pointer transition-all duration-200 ${colorClasses[plan.color]} ${
        isSelected ? selectedClasses[plan.color] : 'hover:shadow-lg'
      }`}
      onClick={onSelect}
    >
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-apple-blue text-white">
          <Crown className="w-3 h-3 mr-1" />
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <div className="text-3xl font-bold">
          {plan.price === 0 ? (
            "Free"
          ) : (
            <>
              <span className="text-2xl">$</span>
              {plan.price}
              <span className="text-base font-normal text-text-secondary">/{plan.period}</span>
            </>
          )}
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-apple-green mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function PaymentForm({ selectedPlan, userInfo }: { selectedPlan: typeof SUBSCRIPTION_PLANS[0], userInfo: SignupForm }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || selectedPlan.price === 0) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/welcome`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedPlan.price === 0) {
    return (
      <div className="text-center py-8">
        <Button 
          size="lg" 
          className="bg-apple-green hover:bg-apple-green/90"
          onClick={() => {
            // Handle free signup
            toast({
              title: "Account Created!",
              description: "Welcome to Flow! You can start using your free account right away.",
            });
            window.location.href = "/welcome";
          }}
        >
          Create Free Account
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
        <PaymentElement />
      </div>
      
      <Button 
        type="submit" 
        size="lg" 
        className="w-full bg-apple-blue hover:bg-apple-blue/90"
        disabled={!stripe || isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Processing...
          </div>
        ) : (
          `Subscribe to ${selectedPlan.name} - $${selectedPlan.price}/${selectedPlan.period}`
        )}
      </Button>
      
      <p className="text-xs text-text-secondary text-center">
        By subscribing, you agree to our Terms of Service and Privacy Policy. 
        You can cancel anytime from your account settings.
      </p>
    </form>
  );
}

function SignupPage() {
  const [step, setStep] = useState<'plans' | 'info' | 'payment'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<typeof SUBSCRIPTION_PLANS[0] | null>(null);
  const [userInfo, setUserInfo] = useState<SignupForm | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmitUserInfo = (data: SignupForm) => {
    setUserInfo(data);
    if (selectedPlan?.price === 0) {
      setStep('payment'); // Even for free, we go to "payment" step which handles free signup
    } else {
      // Create payment intent for paid plans
      createPaymentIntent();
      setStep('payment');
    }
  };

  const createPaymentIntent = async () => {
    if (!selectedPlan || selectedPlan.price === 0) return;

    try {
      const response = await apiRequest("POST", "/api/create-subscription", {
        planId: selectedPlan.id,
        userInfo,
      });
      setClientSecret(response.clientSecret);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePlanSelect = (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    setSelectedPlan(plan);
    setStep('info');
  };

  const renderStep = () => {
    switch (step) {
      case 'plans':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold gradient-text mb-4">Choose Your Flow</h1>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Select the perfect plan to unlock your productivity potential with our comprehensive suite of focus tools.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={selectedPlan?.id === plan.id}
                  onSelect={() => handlePlanSelect(plan)}
                />
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm text-text-secondary">
                All plans include a 14-day free trial. No commitment, cancel anytime.
              </p>
            </div>
          </div>
        );

      case 'info':
        return (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold gradient-text mb-2">Create Your Account</h1>
              <p className="text-text-secondary">
                You've selected <strong>{selectedPlan?.name}</strong>
                {selectedPlan?.price === 0 ? '' : ` for $${selectedPlan?.price}/${selectedPlan?.period}`}
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitUserInfo)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep('plans')}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button type="submit" className="flex-1 bg-apple-blue hover:bg-apple-blue/90">
                        Continue
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        );

      case 'payment':
        if (!selectedPlan || !userInfo) return null;

        const paymentContent = (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold gradient-text mb-2">
                {selectedPlan.price === 0 ? 'Complete Signup' : 'Complete Payment'}
              </h1>
              <div className="glass-card rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedPlan.name}</span>
                  <span className="text-lg font-bold">
                    {selectedPlan.price === 0 ? 'Free' : `$${selectedPlan.price}/${selectedPlan.period}`}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-1">
                  For {userInfo.firstName} {userInfo.lastName} ({userInfo.email})
                </p>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <PaymentForm selectedPlan={selectedPlan} userInfo={userInfo} />
                
                <div className="text-center mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setStep('info')}
                    className="text-text-secondary"
                  >
                    ← Back to account info
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

        // Only wrap with Stripe Elements if it's a paid plan
        if (selectedPlan.price === 0 || !clientSecret) {
          return paymentContent;
        }

        return (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            {paymentContent}
          </Elements>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {renderStep()}
      </div>
    </div>
  );
}

export default SignupPage;