"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Bot, CreditCard, Lock, ShieldCheck, Check, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PLANS } from '../constants';
import { createOrder } from '../lib/api';
import { saveUser, getStoredUser } from '../lib/store';

  const CheckoutPage: React.FC = () => {
  const params=useParams();
  const planId=params?.planId as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = PLANS.find(p => p.id === planId) || PLANS[1];

  const [formData, setFormData] = useState({
    name: 'Alex Johnson',
    email: 'alex@example.com',
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/26',
    cvc: '123'
  });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Save to Supabase
      await createOrder({
        user_email: formData.email,
        user_name: formData.name,
        plan_id: plan.id,
        amount: plan.price
      });

      // 2. Update local state
      const user = getStoredUser();
      saveUser({
        ...user,
        name: formData.name,
        email: formData.email,
        plan: plan.id
      });

      // 3. Success! Proceed to onboarding
      navigate('/app/onboarding');
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">AutoLink AI</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to plans
          </button>

          <h1 className="text-2xl font-bold text-gray-900">Complete your subscription</h1>
          
          <form onSubmit={handleCheckout} className="space-y-6">
            <Card title="Billing Information">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Payment Details">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      required
                      placeholder="0000 0000 0000 0000"
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.cardNumber}
                      onChange={e => setFormData({...formData, cardNumber: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input 
                      type="text" 
                      required
                      placeholder="MM/YY"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.expiry}
                      onChange={e => setFormData({...formData, expiry: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                    <input 
                      type="text" 
                      required
                      placeholder="123"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.cvc}
                      onChange={e => setFormData({...formData, cvc: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <Button size="lg" fullWidth type="submit" disabled={loading} className="gap-2 h-14 text-lg">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              Subscribe for ${plan.price}/mo
            </Button>

            <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secure Payment
              </div>
              <div>SSL Encrypted</div>
              <div>Cancel Anytime</div>
            </div>
          </form>
        </div>

        {/* Right: Summary */}
        <div className="space-y-6">
          <Card title="Order Summary">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-900">{plan.name} Plan</p>
                  <p className="text-sm text-gray-500">Subscription billed monthly</p>
                </div>
                <span className="font-bold text-gray-900">${plan.price}</span>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-lg font-bold">
                <span>Total Due</span>
                <span className="text-indigo-600">${plan.price}</span>
              </div>
            </div>
          </Card>

          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm">
              <Bot className="w-4 h-4" />
              Next Step: Personalization
            </div>
            <p className="text-xs text-indigo-700">
              After checkout, you'll upload your resume so our AI agent can start learning your professional voice.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
export default CheckoutPage;
