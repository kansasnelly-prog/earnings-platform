import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const LivePhantomSyncWidget: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const connection = new Connection('https://api.mainnet-beta.solana.com');

  const connectPhantom = async () => {
    if ('solana' in window) {
      const provider = (window as any).solana;
      if (provider.isPhantom) {
        try {
          const resp = await provider.connect();
          const pubKey = resp.publicKey.toString();
          setWalletAddress(pubKey);
          setIsConnected(true);
          fetchBalance(resp.publicKey);
        } catch (err) {
          console.error("User rejected wallet connection", err);
        }
      }
    } else {
      alert("Phantom Wallet is not installed. Please install it to bind your Web3 address.");
    }
  };

  const fetchBalance = async (pubKey: PublicKey) => {
    try {
      const bal = await connection.getBalance(pubKey);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  };

  useEffect(() => {
    if ('solana' in window) {
      const provider = (window as any).solana;
      if (provider.isPhantom && provider.isConnected) {
        setWalletAddress(provider.publicKey.toString());
        setIsConnected(true);
        fetchBalance(provider.publicKey);
      }
    }
  }, []);

  return (
    <div style={{
      padding: '16px',
      borderRadius: '12px',
      background: 'rgba(15, 23, 42, 0.85)',
      border: '1px solid #9900ff',
      boxShadow: '0 0 15px rgba(153, 0, 255, 0.3)',
      marginTop: '15px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, color: '#00ccff', fontSize: '14px', textTransform: 'uppercase' }}>
          ⚡ Active Phantom Web3 Node
        </h4>
        <button
          onClick={connectPhantom}
          style={{
            padding: '6px 14px',
            backgroundColor: isConnected ? '#00ff66' : '#9900ff',
            color: '#000',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {isConnected ? 'BOUND & ACTIVE' : 'CONNECT PHANTOM'}
        </button>
      </div>

      <div style={{ marginTop: '12px', fontSize: '13px', color: '#e2e8f0' }}>
        <div><strong>Public Address:</strong> {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not Connected'}</div>
        <div style={{ marginTop: '6px', fontSize: '16px', fontWeight: 'bold', color: '#00ff66' }}>
          Live Wallet Balance: {balance !== null ? `${balance.toFixed(4)} SOL` : '0.0000 SOL'}
        </div>
      </div>
    </div>
  );
};
