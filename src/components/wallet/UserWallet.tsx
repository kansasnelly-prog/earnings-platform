import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

const UserWallet: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<'nigeria' | 'cambodia' | 'global'>('nigeria');
  const [nigeriaBank, setNigeriaBank] = useState('');
  const [cambodiaBank, setCambodiaBank] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cryptoType, setCryptoType] = useState<'USDT' | 'BTC'>('USDT');
  const [loading, setLoading] = useState(false);

  const nigeriaBanks = [
    'Access Bank',
    'Zenith Bank',
    'GTBank',
    'UBA',
    'First Bank',
    'Kuda Bank',
  ];

  const cambodiaBanks = [
    'ABA Bank',
    'ACLEDA Bank',
    'TrueMoney',
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleNigeriaSubmit = async () => {
    if (!nigeriaBank || !amount || !receiptFile) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill all fields and upload receipt',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      const { error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          country: 'Nigeria',
          bank_name: nigeriaBank,
          receipt_url: publicUrl,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Receipt submitted successfully!',
        description: 'Your account balance will update the exact second the admin approves the transfer verification.',
      });
      setAmount('');
      setReceiptFile(null);
    } catch (error) {
      console.error('Error submitting deposit:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Failed to submit deposit. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCambodiaSubmit = async () => {
    if (!cambodiaBank || !amount || !receiptFile) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill all fields and upload receipt',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      const { error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          country: 'Cambodia',
          bank_name: cambodiaBank,
          receipt_url: publicUrl,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Receipt submitted successfully!',
        description: 'Your account balance will update the exact second the admin approves the transfer verification.',
      });
      setAmount('');
      setReceiptFile(null);
    } catch (error) {
      console.error('Error submitting deposit:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Failed to submit deposit. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardSubmit = async () => {
    if (!cardNumber || !cardExpiry || !cardCvv || !amount) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill all card fields',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          country: 'Global',
          bank_name: `Credit Card (${cryptoType})`,
          receipt_url: cardNumber.slice(-4),
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Receipt submitted successfully!',
        description: 'Your account balance will update the exact second the admin approves the transfer verification.',
      });
      setAmount('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
    } catch (error) {
      console.error('Error submitting card payment:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Failed to submit payment. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Multi-Currency Wallet</h1>
          <p className="text-gray-400">Deposit funds via bank transfer or credit card</p>
        </div>

        {/* Country Selector */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => setSelectedCountry('nigeria')}
            className={`flex-1 ${selectedCountry === 'nigeria' ? 'bg-green-600' : 'bg-white/10'} text-white font-bold py-3 rounded-xl transition-all duration-300`}
          >
            🇳🇬 Nigeria
          </Button>
          <Button
            onClick={() => setSelectedCountry('cambodia')}
            className={`flex-1 ${selectedCountry === 'cambodia' ? 'bg-blue-600' : 'bg-white/10'} text-white font-bold py-3 rounded-xl transition-all duration-300`}
          >
            🇰🇭 Cambodia
          </Button>
          <Button
            onClick={() => setSelectedCountry('global')}
            className={`flex-1 ${selectedCountry === 'global' ? 'bg-purple-600' : 'bg-white/10'} text-white font-bold py-3 rounded-xl transition-all duration-300`}
          >
            🌍 Global
          </Button>
        </div>

        {/* Nigeria Bank Transfer Desk */}
        {selectedCountry === 'nigeria' && (
          <Card
            className="backdrop-blur-xl border-2 border-green-500/30 mb-6"
            style={{
              background: 'rgba(34, 197, 94, 0.1)',
              boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)',
            }}
          >
            <CardHeader>
              <CardTitle className="text-green-400 text-2xl">🇳🇬 Nigeria Bank Transfer Desk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-green-300 text-sm mb-2 block">Select Bank</label>
                <select
                  value={nigeriaBank}
                  onChange={(e) => setNigeriaBank(e.target.value)}
                  className="w-full bg-white/10 border border-green-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                >
                  <option value="">Choose a bank...</option>
                  {nigeriaBanks.map((bank) => (
                    <option key={bank} value={bank} className="bg-slate-900">
                      {bank}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-green-300 text-sm mb-2 block">Amount (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-white/10 border border-green-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-green-300 text-sm mb-2 block">Upload Receipt</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="w-full bg-white/10 border border-green-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <Button
                onClick={handleNigeriaSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 rounded-xl hover:scale-105 transition-all duration-300"
              >
                {loading ? 'Processing...' : 'Submit Deposit'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Cambodia Local Bank Desk */}
        {selectedCountry === 'cambodia' && (
          <Card
            className="backdrop-blur-xl border-2 border-blue-500/30 mb-6"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
            }}
          >
            <CardHeader>
              <CardTitle className="text-blue-400 text-2xl">🇰🇭 Cambodia Local Bank Desk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {cambodiaBanks.map((bank) => (
                  <div
                    key={bank}
                    onClick={() => setCambodiaBank(bank)}
                    className={`cursor-pointer rounded-xl p-4 text-center transition-all duration-300 ${
                      cambodiaBank === bank
                        ? 'bg-blue-600 border-2 border-blue-400'
                        : 'bg-white/10 border-2 border-blue-500/30 hover:bg-white/20'
                    }`}
                  >
                    <div className="text-3xl mb-2">🏦</div>
                    <p className="text-white text-sm font-semibold">{bank}</p>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-blue-300 text-sm mb-2 block">Amount (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-white/10 border border-blue-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-blue-300 text-sm mb-2 block">Upload Receipt</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="w-full bg-white/10 border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <Button
                onClick={handleCambodiaSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-3 rounded-xl hover:scale-105 transition-all duration-300"
              >
                {loading ? 'Processing...' : 'Submit Deposit'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Global Credit Card Console */}
        {selectedCountry === 'global' && (
          <Card
            className="backdrop-blur-xl border-2 border-purple-500/30 mb-6"
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
            }}
          >
            <CardHeader>
              <CardTitle className="text-purple-400 text-2xl">🌍 Global Credit Card Console</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-purple-300 text-sm mb-2 block">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-purple-300 text-sm mb-2 block">Expiry Date</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-purple-300 text-sm mb-2 block">CVV</label>
                  <input
                    type="text"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="123"
                    className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-purple-300 text-sm mb-2 block">Amount (USD)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-purple-300 text-sm mb-2 block">Crypto Deposit Address</label>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div
                    onClick={() => setCryptoType('USDT')}
                    className={`cursor-pointer rounded-lg p-4 text-center transition-all duration-300 ${
                      cryptoType === 'USDT'
                        ? 'bg-purple-600 border-2 border-purple-400'
                        : 'bg-white/10 border-2 border-purple-500/30 hover:bg-white/20'
                    }`}
                  >
                    <div className="text-2xl mb-1">💵</div>
                    <p className="text-white text-sm font-semibold">USDT</p>
                  </div>
                  <div
                    onClick={() => setCryptoType('BTC')}
                    className={`cursor-pointer rounded-lg p-4 text-center transition-all duration-300 ${
                      cryptoType === 'BTC'
                        ? 'bg-purple-600 border-2 border-purple-400'
                        : 'bg-white/10 border-2 border-purple-500/30 hover:bg-white/20'
                    }`}
                  >
                    <div className="text-2xl mb-1">₿</div>
                    <p className="text-white text-sm font-semibold">BTC</p>
                  </div>
                </div>
                <div className="bg-white/10 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-purple-300 text-sm mb-1">
                    {cryptoType === 'USDT' ? 'USDT (TRC20)' : 'BTC'} Address:
                  </p>
                  <p className="text-white text-xs break-all font-mono">
                    {cryptoType === 'USDT'
                      ? 'T9yX14BjQJ9E1GDv8Y4s9Z2f3W4R5T6Y7U8I9O0P'
                      : 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleCardSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl hover:scale-105 transition-all duration-300"
              >
                {loading ? 'Processing...' : 'Submit Payment'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserWallet;
