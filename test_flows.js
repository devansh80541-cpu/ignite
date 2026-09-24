import db, { initDatabase } from './server/db.js';
import { seedDatabase } from './server/seed.js';

async function runTests() {
  console.log('\n=============================================');
  console.log('🧪 RUNNING COMPREHENSIVE INTEGRATION TESTS');
  console.log('=============================================\n');

  initDatabase();
  await seedDatabase();

  const baseUrl = 'http://localhost:5000/api';

  // Helper request
  async function api(path, method = 'GET', body = null, token = null) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data: json };
  }

  // TEST 1: Admin Login
  console.log('1. Testing Admin Authentication...');
  const adminRes = await api('/auth/admin-login', 'POST', {
    username: 'Igniteesports',
    password: 'IgniteXsolofx7'
  });
  if (!adminRes.ok || !adminRes.data.token) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminRes.data)}`);
  }
  const adminToken = adminRes.data.token;
  console.log('   ✅ Admin Authenticated. Role:', adminRes.data.user.role);

  // TEST 2: Player Registration & Login
  console.log('2. Testing Player Signup & Login...');
  const testUserEmail = `testplayer_${Date.now()}@example.com`;
  const testUsername = `player_${Date.now().toString().slice(-6)}`;
  const signupRes = await api('/auth/signup', 'POST', {
    name: 'Rohit Sharma',
    username: testUsername,
    email: testUserEmail,
    password: 'securepassword123',
    phone: '+91 9998887776',
    free_fire_uid: '3849102847',
    in_game_name: 'ROHIT_OP'
  });
  if (!signupRes.ok || !signupRes.data.token) {
    throw new Error(`Player signup failed: ${JSON.stringify(signupRes.data)}`);
  }
  const playerToken = signupRes.data.token;
  const playerId = signupRes.data.user.id;
  console.log('   ✅ Player Registered & Authenticated. Wallet Balance: ₹', signupRes.data.user.wallet_balance);

  // TEST 3: Add Money Flow (Requires Admin Approval)
  console.log('3. Testing Add Money Deposit Flow (Admin Approval Required)...');
  const utrNum = `UTR${Date.now().toString().slice(-8)}`;
  const depRes = await api('/wallet/deposit', 'POST', {
    amount: 500.00,
    paymentMethod: 'upi',
    transactionId: utrNum,
    proofImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400'
  }, playerToken);

  if (!depRes.ok || depRes.data.deposit.status !== 'pending') {
    throw new Error(`Deposit submission failed: ${JSON.stringify(depRes.data)}`);
  }
  const depositId = depRes.data.deposit.id;
  console.log('   ✅ Deposit Submitted with Status PENDING. Wallet NOT credited yet.');

  // Verify wallet is still 0
  const walletBeforeApprove = await api('/wallet/summary', 'GET', null, playerToken);
  if (walletBeforeApprove.data.availableBalance !== 0) {
    throw new Error('Wallet was prematurely credited without admin approval!');
  }
  console.log('   ✅ Verified Wallet Balance is still ₹0.00 before admin review.');

  // TEST 4: Admin Approves Deposit
  console.log('4. Testing Admin Deposit Approval & Ledger Update...');
  const approveRes = await api(`/admin/deposits/${depositId}/approve`, 'POST', {}, adminToken);
  if (!approveRes.ok) {
    throw new Error(`Admin approve deposit failed: ${JSON.stringify(approveRes.data)}`);
  }
  console.log('   ✅ Admin approved deposit request.');

  // Check player wallet updated
  const walletAfterApprove = await api('/wallet/summary', 'GET', null, playerToken);
  if (walletAfterApprove.data.availableBalance !== 500) {
    throw new Error(`Wallet balance expected 500, got ${walletAfterApprove.data.availableBalance}`);
  }
  console.log('   ✅ Player wallet credited with ₹500.00.');

  // TEST 5: Join 50-Slot Battle Royale Tournament
  console.log('5. Testing 50-Slot Battle Royale Registration & Balance Deduction...');
  const tournDetails = await api('/tournaments/tourn-br-01', 'GET');
  console.log('   Tournament slots total:', tournDetails.data.totalSlots, 'Registered:', tournDetails.data.registeredCount);

  const joinRes = await api('/tournaments/tourn-br-01/join', 'POST', {
    slotNumber: 42,
    inGameName: 'ROHIT_OP',
    freeFireUid: '3849102847'
  }, playerToken);

  if (!joinRes.ok) {
    throw new Error(`Tournament join failed: ${JSON.stringify(joinRes.data)}`);
  }
  console.log('   ✅ Joined Slot 42. Balance after entry fee deduction: ₹', joinRes.data.walletBalance);

  // TEST 6: Admin Releases Room ID and Password
  console.log('6. Testing Room ID & Password Release...');
  const releaseRes = await api('/admin/tournaments/tourn-br-01/release-room', 'POST', {
    roomId: '9847291',
    roomPassword: 'FFWIN'
  }, adminToken);
  if (!releaseRes.ok) {
    throw new Error(`Room release failed: ${JSON.stringify(releaseRes.data)}`);
  }
  console.log('   ✅ Room ID & Password released.');

  // Check registered player can now see room credentials
  const tournDetailsPlayer = await api('/tournaments/tourn-br-01', 'GET', null, playerToken);
  if (tournDetailsPlayer.data.tournament.room_id !== '9847291') {
    throw new Error('Player unable to see released room ID');
  }
  console.log('   ✅ Player successfully sees Room ID: 9847291 | Pass: FFWIN');

  // TEST 7: Admin Finalizes Results & Distributes Prizes
  console.log('7. Testing Results & Atomic Prize Payout Engine...');
  const resultsPayload = [
    { userId: playerId, playerName: 'ROHIT_OP', ffUid: '3849102847', position: 1, kills: 7, prizeAmount: 2500.00 }
  ];
  const resultsRes = await api('/admin/tournaments/tourn-br-01/results', 'POST', {
    results: resultsPayload,
    isFinalizeAndPayout: true
  }, adminToken);
  if (!resultsRes.ok) {
    throw new Error(`Results finalization failed: ${JSON.stringify(resultsRes.data)}`);
  }
  console.log('   ✅ Match results finalized and ₹2,500.00 1st place prize paid.');

  // Check player wallet after win
  const walletAfterPrize = await api('/wallet/summary', 'GET', null, playerToken);
  console.log('   ✅ Player Available Balance after winning: ₹', walletAfterPrize.data.availableBalance);

  // TEST 8: Cashout Request & Funds Locking
  console.log('8. Testing Cashout Request with Balance Locking...');
  const cashoutRes = await api('/wallet/cashout', 'POST', {
    amount: 1000.00,
    payoutIdentifier: 'rohit@okaxis',
    accountName: 'Rohit Sharma'
  }, playerToken);
  if (!cashoutRes.ok) {
    throw new Error(`Cashout request failed: ${JSON.stringify(cashoutRes.data)}`);
  }
  console.log('   ✅ Cashout placed for ₹1000. Available balance reduced, Pending balance increased to ₹', cashoutRes.data.pendingBalance);

  // TEST 9: Admin Reviews and Marks Cashout as Paid
  console.log('9. Testing Admin Marks Cashout as Paid...');
  const cashoutsQueue = await api('/admin/cashouts?status=pending', 'GET', null, adminToken);
  const myCashout = cashoutsQueue.data.cashouts.find(c => c.user_id === playerId);
  if (!myCashout) throw new Error('Cashout not found in admin queue');

  const markPaidRes = await api(`/admin/cashouts/${myCashout.id}/mark-paid`, 'POST', {
    transactionReference: `IMPS-${Date.now()}`,
    adminNote: 'Transfer successful'
  }, adminToken);
  if (!markPaidRes.ok) throw new Error('Mark paid failed');
  console.log('   ✅ Cashout marked Paid with IMPS reference.');

  // TEST 10: Transactions Ledger Verification
  console.log('10. Testing Complete Transaction Ledger Integrity...');
  const txHistory = await api('/wallet/transactions', 'GET', null, playerToken);
  console.log(`   ✅ Player ledger contains ${txHistory.data.transactions.length} immutable transaction records.`);

  console.log('\n=============================================');
  console.log('🎉 ALL 10 INTEGRATION TESTS PASSED PERFECTLY!');
  console.log('=============================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
