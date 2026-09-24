import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import apiRequest from '../api/client.js';
import {
  Wallet as WalletIcon, PlusCircle, ArrowUpRight, FileText,
  Copy, Check, Clock, Shield, ArrowDownLeft
} from 'lucide-react';

export default function Wallet({ onNavigate }) {
  const { user, openLogin, refreshUser } = useAuth();
  const { success, error } = useNotification();

  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState({ deposits: [], cashouts: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('add_money');

  // Add Money Form State
  const [depositAmount, setDepositAmount] = useState('100');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [utrNumber, setUtrNumber] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  // Cashout Form State
  const [cashoutAmount, setCashoutAmount] = useState('200');
  const [payoutIdentifier, setPayoutIdentifier] = useState('');
  const [accountName, setAccountName] = useState('');
  const [submittingCashout, setSubmittingCashout] = useState(false);

  const [copiedUpi, setCopiedUpi] = useState(false);

  const fetchWalletData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [sumRes, reqRes] = await Promise.all([
        apiRequest('/wallet/summary'),
        apiRequest('/wallet/requests')
      ]);
      setSummary(sumRes);
      setRequests(reqRes);
    } catch (err) {
      error(err.message, 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  const handleCopyUpi = () => {
    const upi = '7708728477@fam';
    navigator.clipboard.writeText(upi);
    setCopiedUpi(true);
    success('Copied UPI ID to clipboard!');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.trim().length < 6) {
      error('Please enter a valid 12-digit UTR or Transaction Reference number.');
      return;
    }

    try {
      setSubmittingDeposit(true);
      const res = await apiRequest('/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(depositAmount),
          paymentMethod,
          transactionId: utrNumber.trim(),
          proofImage: proofImage || null
        })
      });

      success(res.message, 'Deposit Submitted');
      setUtrNumber('');
      setProofImage('');
      setActiveTab('requests');
      await fetchWalletData();
      await refreshUser();
    } catch (err) {
      error(err.message, 'Deposit Failed');
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const handleCashoutSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(cashoutAmount);
    if (isNaN(amount) || amount <= 0) {
      error('Please enter a valid cashout amount.');
      return;
    }

    try {
      setSubmittingCashout(true);
      const res = await apiRequest('/wallet/cashout', {
        method: 'POST',
        body: JSON.stringify({
          amount,
          payoutIdentifier: payoutIdentifier.trim(),
          accountName: accountName.trim()
        })
      });

      success(res.message, 'Cashout Request Placed');
      setPayoutIdentifier('');
      setAccountName('');
      setActiveTab('requests');
      await fetchWalletData();
      await refreshUser();
    } catch (err) {
      error(err.message, 'Cashout Failed');
    } finally {
      setSubmittingCashout(false);
    }
  };

  if (!user) {
    return (
      <div style={{ maxWidth: '550px', margin: '60px auto', padding: '40px 20px', textAlign: 'center' }} className="tactical-card">
        <WalletIcon size={44} color="var(--primary)" style={{ margin: '0 auto 14px auto' }} />
        <h2 className="font-heading" style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '8px' }}>
          WALLET AUTHENTICATION REQUIRED
        </h2>
        <p className="font-body" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Log in to view available balance, request deposits via UPI, and cashout your tournament winnings.
        </p>
        <button onClick={openLogin} className="btn-primary">LOG IN TO WALLET</button>
      </div>
    );
  }

  const upiId = '7708728477@fam';
  const qrUrl = '/QR.jpg';
  const minDeposit = summary?.settings?.minDeposit || 50;
  const minCashout = summary?.settings?.minCashout || 100;
  const cashoutFeePercent = summary?.settings?.cashoutFeePercent || 2;

  const cashoutFee = (parseFloat(cashoutAmount || '0') * cashoutFeePercent) / 100;
  const cashoutNet = Math.max(0, parseFloat(cashoutAmount || '0') - cashoutFee);

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '30px 20px 80px 20px' }}>
      
      {/* 21. WALLET HERO (GLASSMORPHIC CARD) */}
      <div className="glass-panel" style={{ padding: '32px 28px', marginBottom: '32px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          
          <div>
            <div className="font-heading" style={{ fontSize: '0.75rem', color: 'var(--secondary)', letterSpacing: '0.1em' }}>
              AVAILABLE BALANCE
            </div>
            <div className="font-hud" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0' }}>
              ₹{summary ? Number(summary.availableBalance).toFixed(2) : '0.00'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Ready for tournament entries & direct cashouts
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('add_money')}
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.88rem' }}
            >
              <PlusCircle size={16} />
              <span>ADD MONEY</span>
            </button>

            <button
              onClick={() => setActiveTab('cashout')}
              className="btn-gold"
              style={{ padding: '10px 20px', fontSize: '0.88rem' }}
            >
              <ArrowUpRight size={16} />
              <span>CASHOUT</span>
            </button>

            <button
              onClick={() => onNavigate('transactions')}
              className="btn-ghost"
              style={{ padding: '10px 16px', fontSize: '0.85rem' }}
            >
              <FileText size={16} />
              <span>LEDGER</span>
            </button>
          </div>

        </div>

        {/* BALANCE METRICS BREAKDOWN */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div className="font-heading" style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>PENDING BALANCE</div>
            <div className="font-hud" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary)' }}>
              ₹{summary ? Number(summary.pendingBalance).toFixed(2) : '0.00'}
            </div>
          </div>

          <div>
            <div className="font-heading" style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>TOTAL DEPOSITED</div>
            <div className="font-hud" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              ₹{summary ? Number(summary.totalDeposited).toFixed(2) : '0.00'}
            </div>
          </div>

          <div>
            <div className="font-heading" style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>TOTAL WINNINGS</div>
            <div className="font-hud" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--prize-gold)' }}>
              ₹{summary ? Number(summary.totalWinnings).toFixed(2) : '0.00'}
            </div>
          </div>

          <div>
            <div className="font-heading" style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>TOTAL WITHDRAWN</div>
            <div className="font-hud" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              ₹{summary ? Number(summary.totalWithdrawn).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* WALLET TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('add_money')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'add_money' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'add_money' ? 'var(--text-main)' : 'var(--text-muted)',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.9rem',
            padding: '6px 14px',
            cursor: 'pointer'
          }}
        >
          ADD MONEY
        </button>

        <button
          onClick={() => setActiveTab('cashout')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'cashout' ? '2px solid var(--prize-gold)' : '2px solid transparent',
            color: activeTab === 'cashout' ? 'var(--prize-gold)' : 'var(--text-muted)',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.9rem',
            padding: '6px 14px',
            cursor: 'pointer'
          }}
        >
          CASHOUT
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'requests' ? '2px solid var(--secondary)' : '2px solid transparent',
            color: activeTab === 'requests' ? 'var(--secondary)' : 'var(--text-muted)',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.9rem',
            padding: '6px 14px',
            cursor: 'pointer'
          }}
        >
          REQUEST STATUS TRACKER
        </button>
      </div>

      {/* 22. ADD MONEY UI */}
      {activeTab === 'add_money' && (
        <div className="tactical-card" style={{ padding: '28px', maxWidth: '850px' }}>
          
          <div style={{ marginBottom: '20px' }}>
            <h3 className="font-heading" style={{ fontSize: '1.3rem', color: 'var(--text-main)' }}>
              DEPOSIT FUNDS VIA UPI
            </h3>
            <p className="font-body" style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginTop: '4px' }}>
              Deposits require admin approval before funds are added to your wallet.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            
            {/* UPI QR CARD */}
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div className="font-heading" style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
                SCAN QR CODE OR COPY UPI ID
              </div>

              <div style={{ width: '170px', height: '170px', background: '#FFF', padding: '8px', borderRadius: 'var(--radius-sm)', margin: '0 auto 12px auto' }}>
                <img src={qrUrl} alt="UPI QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>

              <div style={{ background: 'var(--bg-dark)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-subtle)' }}>
                <span className="font-hud" style={{ fontSize: '0.82rem', color: 'var(--secondary)' }}>{upiId}</span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                >
                  {copiedUpi ? <Check size={14} color="var(--secondary)" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div>
                <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  PRESET AMOUNTS
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '8px' }}>
                  {['50', '100', '200', '500', '1000'].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className="font-hud"
                      style={{
                        padding: '6px 0',
                        borderRadius: 'var(--radius-sm)',
                        border: depositAmount === amt ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        background: depositAmount === amt ? 'rgba(255, 77, 0, 0.15)' : 'var(--bg-secondary)',
                        color: depositAmount === amt ? 'var(--primary)' : 'var(--text-main)',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min={minDeposit}
                  placeholder="Custom Amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="input-dark font-hud"
                  required
                />
              </div>

              <div>
                <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  12-DIGIT UTR / TRANSACTION ID *
                </label>
                <input
                  type="text"
                  placeholder="Enter 12-digit UTR from payment receipt"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="input-dark font-hud"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingDeposit}
                className="btn-primary"
                style={{ padding: '10px', marginTop: '6px' }}
              >
                {submittingDeposit ? 'SUBMITTING...' : `SUBMIT DEPOSIT OF ₹${depositAmount}`}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 23. CASHOUT UI */}
      {activeTab === 'cashout' && (
        <div className="tactical-card" style={{ padding: '28px', maxWidth: '700px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 className="font-heading" style={{ fontSize: '1.3rem', color: 'var(--prize-gold)' }}>
              WITHDRAW WINNINGS
            </h3>
            <p className="font-body" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Direct payout to your registered UPI ID or Bank account.
            </p>
          </div>

          <form onSubmit={handleCashoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                CASHOUT AMOUNT (MIN ₹{minCashout})
              </label>
              <input
                type="number"
                min={minCashout}
                max={summary?.availableBalance || 0}
                value={cashoutAmount}
                onChange={(e) => setCashoutAmount(e.target.value)}
                className="input-dark font-hud"
                required
              />
            </div>

            <div>
              <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                PAYOUT UPI ID / ACCOUNT *
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210@paytm"
                value={payoutIdentifier}
                onChange={(e) => setPayoutIdentifier(e.target.value)}
                className="input-dark font-hud"
                required
              />
            </div>

            <div>
              <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                ACCOUNT HOLDER NAME *
              </label>
              <input
                type="text"
                placeholder="Full name on bank account"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="input-dark"
                required
              />
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Fee ({cashoutFeePercent}%):</span>
                <span style={{ color: 'var(--danger-red)' }}>-₹{cashoutFee.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontWeight: 700 }}>
                <span>Net Transfer Amount:</span>
                <span className="font-hud" style={{ color: 'var(--prize-gold)' }}>₹{cashoutNet.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingCashout || Number(user?.wallet_balance) < parseFloat(cashoutAmount || '0')}
              className="btn-gold"
              style={{ padding: '10px', marginTop: '6px' }}
            >
              {submittingCashout ? 'PROCESSING...' : `REQUEST CASHOUT OF ₹${cashoutNet.toFixed(2)}`}
            </button>
          </form>
        </div>
      )}

      {/* REQUEST TRACKER */}
      {activeTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="tactical-card" style={{ padding: '20px' }}>
            <h4 className="font-heading" style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '14px' }}>DEPOSIT STATUS</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>DATE</th>
                    <th style={{ padding: '8px' }}>AMOUNT</th>
                    <th style={{ padding: '8px' }}>UTR / REF</th>
                    <th style={{ padding: '8px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.deposits.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{d.created_at}</td>
                      <td className="font-hud" style={{ padding: '8px', color: 'var(--secondary)', fontWeight: 700 }}>+₹{Number(d.amount).toFixed(2)}</td>
                      <td className="font-hud" style={{ padding: '8px', color: 'var(--text-main)' }}>{d.transaction_id}</td>
                      <td style={{ padding: '8px' }}>
                        {d.status === 'pending' && <span className="badge-open">PENDING ADMIN APPROVAL</span>}
                        {d.status === 'approved' && <span className="badge-cyan">APPROVED</span>}
                        {d.status === 'rejected' && <span style={{ color: 'var(--danger-red)', fontSize: '0.75rem', fontWeight: 700 }}>REJECTED</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="tactical-card" style={{ padding: '20px' }}>
            <h4 className="font-heading" style={{ fontSize: '1.1rem', color: 'var(--prize-gold)', marginBottom: '14px' }}>CASHOUT STATUS</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>DATE</th>
                    <th style={{ padding: '8px' }}>NET PAYOUT</th>
                    <th style={{ padding: '8px' }}>ACCOUNT</th>
                    <th style={{ padding: '8px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.cashouts.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{c.created_at}</td>
                      <td className="font-hud" style={{ padding: '8px', color: 'var(--prize-gold)', fontWeight: 700 }}>₹{Number(c.net_amount).toFixed(2)}</td>
                      <td className="font-hud" style={{ padding: '8px', color: 'var(--text-main)' }}>{c.payout_identifier}</td>
                      <td style={{ padding: '8px' }}>
                        {c.status === 'pending' && <span className="badge-open">PENDING</span>}
                        {c.status === 'processing' && <span className="badge-cyan">PROCESSING</span>}
                        {c.status === 'paid' && <span className="badge-gold">PAID</span>}
                        {c.status === 'rejected' && <span style={{ color: 'var(--danger-red)', fontSize: '0.75rem', fontWeight: 700 }}>REJECTED</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
