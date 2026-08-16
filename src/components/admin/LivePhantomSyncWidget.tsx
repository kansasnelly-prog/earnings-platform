import React, { useState, useEffect, useRef } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';

const MASTER_WALLET = '5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL';

const RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana',
];

const getPhantomProvider = () => {
  if ('phantom' in window) {
    const provider = (window as any).phantom?.solana;
    if (provider?.isPhantom) return provider;
  }
  if ('solana' in window) {
    const provider = (window as any).solana;
    if (provider?.isPhantom) return provider;
  }
  return null;
};

type Network = 'solana' | 'ethereum' | 'base';

interface ActivityEntry {
  id: string;
  type: 'send' | 'receive' | 'bind' | 'view';
  network: Network;
  amount?: string;
  to?: string;
  from?: string;
  timestamp: string;
  status: string;
}

export const LivePhantomSyncWidget: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [network, setNetwork] = useState<Network>('solana');
  const [masterBindAddress, setMasterBindAddress] = useState<string>(MASTER_WALLET);
  const [useMasterBind, setUseMasterBind] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [liveWalletBalance, setLiveWalletBalance] = useState<string>('0.0000');
  const [receiveAddress, setReceiveAddress] = useState<string>('');
  const [showReceiveModal, setShowReceiveModal] = useState<boolean>(false);
  const [sendAddress, setSendAddress] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const activityLogRef = useRef<ActivityEntry[]>([]);

  const resolveConnection = () => {
    if (network === 'solana') {
      return new Connection(RPC_ENDPOINTS[0], 'confirmed');
    }
    return null;
  };

  const fetchLiveBalance = async (addressStr: string) => {
    try {
      const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
      const pubKey = new PublicKey(addressStr);
      const balanceInLamports = await connection.getBalance(pubKey);
      const solBalance = balanceInLamports / LAMPORTS_PER_SOL;
      setLiveWalletBalance(solBalance.toFixed(4));
    } catch (err) {
      console.error("Failed to fetch SOL balance:", err);
    }
  };

  const addActivity = (entry: ActivityEntry) => {
    const updated = [entry, ...activityLogRef.current].slice(0, 50);
    activityLogRef.current = updated;
    setActivityLog(updated);
  };

  const fetchBalance = async (pubKey: PublicKey) => {
    const connection = resolveConnection();
    if (!connection || network !== 'solana') {
      setBalance(null);
      return;
    }

    try {
      let lastError: any = null;
      for (const endpoint of RPC_ENDPOINTS) {
        try {
          const conn = new Connection(endpoint, 'confirmed');
          const bal = await conn.getBalance(pubKey);
          setBalance(bal / LAMPORTS_PER_SOL);
          return;
        } catch (err) {
          lastError = err;
          continue;
        }
      }
      if (lastError) {
        throw lastError;
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setBalance(0);
    }
  };

  const refreshBalance = async () => {
    if (!walletAddress) return;
    setIsRefreshing(true);
    try {
      await fetchLiveBalance(walletAddress);
    } catch (err) {
      console.error('Refresh balance failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const bindMasterWallet = () => {
    if (!masterBindAddress) return;
    try {
      const pubKey = new PublicKey(masterBindAddress);
      setWalletAddress(pubKey.toString());
      setIsConnected(true);
      setUseMasterBind(true);
      fetchLiveBalance(pubKey.toString());
      addActivity({
        id: Date.now().toString(),
        type: 'bind',
        network,
        from: masterBindAddress,
        timestamp: new Date().toLocaleString(),
        status: 'Bound',
      });
    } catch (err) {
      alert('Invalid master wallet address.');
    }
  };

  const connectWallet = async () => {
    const provider = getPhantomProvider();

    if (!provider) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        const targetUrl = encodeURIComponent(window.location.href);
        window.location.href = `https://phantom.app/ul/browse/${targetUrl}?ref=${encodeURIComponent(window.location.host)}`;
        return;
      }
      alert("Phantom Wallet is not installed. Please install the extension on desktop or open this page inside the Phantom Mobile App browser.");
      return;
    }

    try {
      const response = await provider.connect();
      const pubKey = response.publicKey.toString();
      setWalletAddress(pubKey);
      setIsConnected(true);
      setUseMasterBind(false);
      fetchLiveBalance(pubKey);
      addActivity({
        id: Date.now().toString(),
        type: 'bind',
        network,
        from: pubKey,
        timestamp: new Date().toLocaleString(),
        status: 'Connected',
      });
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  const handleReceive = () => {
    const address = useMasterBind ? masterBindAddress : walletAddress;
    if (!address) {
      alert('No wallet bound. Connect Phantom or bind the master wallet first.');
      return;
    }
    setReceiveAddress(address);
    setShowReceiveModal(true);
    addActivity({
      id: Date.now().toString(),
      type: 'receive',
      network,
      timestamp: new Date().toLocaleString(),
      status: 'Opened receive modal',
    });
  };

  const handleSend = async () => {
    if (!sendAddress || !sendAmount || network !== 'solana') {
      alert('Send is currently supported for Solana only.');
      return;
    }

    const provider = getPhantomProvider();
    if (!provider) {
      alert('Phantom provider is required to send transactions.');
      return;
    }

    setIsSending(true);
    try {
      const fromPubKey = useMasterBind ? new PublicKey(masterBindAddress) : new PublicKey(walletAddress || '');
      const toPubKey = new PublicKey(sendAddress);
      const lamports = Math.floor(parseFloat(sendAmount) * LAMPORTS_PER_SOL);

       const transaction = new Transaction().add(
         SystemProgram.transfer({
           fromPubkey: fromPubKey,
           toPubkey: toPubKey,
           lamports,
         })
       );

      const { blockhash } = await resolveConnection()!.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubKey;

      const signedTransaction = await provider.signAndSendTransaction(transaction);
      const signature = signedTransaction.signature ? signedTransaction.signature.toString() : 'pending';

      addActivity({
        id: Date.now().toString(),
        type: 'send',
        network,
        amount: `${parseFloat(sendAmount).toFixed(4)} SOL`,
        to: sendAddress,
        timestamp: new Date().toLocaleString(),
        status: signature,
      });

      alert(`Transaction submitted! Signature: ${signature}`);
      setSendAddress('');
      setSendAmount('');
      refreshBalance();
    } catch (err) {
      console.error('Send failed:', err);
      alert('Transaction failed or was rejected.');
    } finally {
      setIsSending(false);
    }
  };

  const disconnectWallet = () => {
    const provider = getPhantomProvider();
    if (provider) {
      provider.disconnect();
    }
    setWalletAddress(null);
    setBalance(null);
    setIsConnected(false);
    setUseMasterBind(false);
  };

  useEffect(() => {
    let mounted = true;

    const tryConnect = () => {
      const provider = getPhantomProvider();
      if (!provider) return false;
      if (provider.isConnected && provider.publicKey) {
        if (mounted) {
          setWalletAddress(provider.publicKey.toString());
          setIsConnected(true);
          fetchLiveBalance(provider.publicKey.toString());
        }
        return true;
      }
      return false;
    };

    const onInitialized = () => {
      const initializedProvider = getPhantomProvider();
      tryConnect();
      if (initializedProvider?.publicKey) {
        fetchLiveBalance(initializedProvider.publicKey.toString());
      }
    };

    window.addEventListener('phantom#initialized', onInitialized, { once: true });

    const timeout = setTimeout(() => {
      tryConnect();
    }, 500);

    return () => {
      mounted = false;
      window.removeEventListener('phantom#initialized', onInitialized);
      clearTimeout(timeout);
    };
  }, [network]);

  useEffect(() => {
    if (!isConnected || !walletAddress) return;
    fetchLiveBalance(walletAddress);
  }, [network, walletAddress]);

  const displayAddress = useMasterBind ? masterBindAddress : walletAddress;
  const displayBalance = liveWalletBalance ? `${liveWalletBalance} SOL` : '0.0000 SOL';

  return (
    <div style={{
      padding: '16px',
      borderRadius: '12px',
      background: 'rgba(15, 23, 42, 0.85)',
      border: '1px solid #9900ff',
      boxShadow: '0 0 15px rgba(153, 0, 255, 0.3)',
      marginTop: '15px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h4 style={{ margin: 0, color: '#00ccff', fontSize: '14px', textTransform: 'uppercase' }}>
          ⚡ Active Phantom Web3 Node
        </h4>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value as Network)}
            style={{ padding: '4px 8px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '0.75rem', fontWeight: 'bold' }}
          >
            <option value="solana">Solana</option>
            <option value="ethereum">Ethereum</option>
            <option value="base">Base</option>
          </select>
          <button
            onClick={refreshBalance}
            disabled={isRefreshing}
            style={{ padding: '4px 10px', borderRadius: '6px', background: '#0f172a', color: '#00ccff', border: '1px solid #334155', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
          >
            {isRefreshing ? '...' : 'Refresh'}
          </button>
          <button
            onClick={isConnected ? disconnectWallet : connectWallet}
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
      </div>

      <div style={{ marginTop: '10px', fontSize: '13px', color: '#e2e8f0' }}>
        <div><strong>Public Address:</strong> {displayAddress ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}` : 'Not Connected'}</div>
        <div style={{ marginTop: '6px', fontSize: '16px', fontWeight: 'bold', color: '#00ff66' }}>
          Live Wallet Balance: {displayBalance}
        </div>
      </div>

      <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={handleReceive}
          style={{ padding: '8px 14px', borderRadius: '8px', background: '#0f172a', color: '#00ccff', border: '1px solid #334155', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          📥 Receive
        </button>
        <button
          onClick={() => {}}
          style={{ padding: '8px 14px', borderRadius: '8px', background: '#0f172a', color: '#ff8800', border: '1px solid #334155', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          📤 Send
        </button>
        <button
          onClick={bindMasterWallet}
          style={{ padding: '8px 14px', borderRadius: '8px', background: '#0f172a', color: '#a855f7', border: '1px solid #334155', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          🔒 Bind Master Wallet
        </button>
      </div>

      {showReceiveModal && (
        <div style={{ marginTop: '12px', padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid #334155' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Receive {network === 'solana' ? 'SOL' : network === 'ethereum' ? 'ETH' : 'ETH'}</div>
          <div style={{ wordBreak: 'break-all', fontSize: '0.85rem', color: '#cbd5e1' }}>{receiveAddress}</div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(receiveAddress);
              alert('Address copied to clipboard');
            }}
            style={{ marginTop: '8px', padding: '6px 12px', borderRadius: '6px', background: '#1d4ed8', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Copy Address
          </button>
          <button
            onClick={() => setShowReceiveModal(false)}
            style={{ marginTop: '8px', marginLeft: '8px', padding: '6px 12px', borderRadius: '6px', background: '#334155', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Close
          </button>
        </div>
      )}

      {activityLog.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#94a3b8' }}>Activity Log</div>
          {activityLog.slice(0, 5).map((entry) => (
            <div key={entry.id} style={{ fontSize: '0.8rem', color: '#cbd5e1', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#38bdf8' }}>[{entry.timestamp}]</span> {entry.type.toUpperCase()} {entry.amount || ''} {entry.status}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
