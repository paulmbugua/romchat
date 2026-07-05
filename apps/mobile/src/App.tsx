import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiBaseUrl, apiFetch, formatKes } from './lib/api';

const ink = '#08132a';
const orange = '#fd761a';
const blue = '#d6e3ff';
const white = '#ffffff';
const storageToken = 'grogon-member-token';
const storageDashboard = 'grogon-member-dashboard';
const appMode = process.env.EXPO_PUBLIC_APP_MODE || 'demo';
const isDemoMode = appMode !== 'live';
const demoToken = 'demo-grogon-member-token';

type Member = {
  id: string;
  memberNo: string;
  fullName: string;
  phone: string;
  email?: string;
  shopLocation: string;
  membershipTier: string;
  savingsBalance: number;
  loanBalance: number;
  dividendBalance: number;
  kycStatus: string;
  onboardingStage?: string;
  mustSetPassword?: boolean;
};

type Transaction = {
  id: string;
  kind: string;
  channel?: string;
  amount: number;
  reference: string;
  status: string;
  createdAt?: string;
};

type Loan = {
  id: string;
  loanType: string;
  amount: number;
  termMonths: number;
  purpose: string;
  status: string;
  monthlyRepayment: number;
  createdAt?: string;
};

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  resolution?: string;
  createdAt?: string;
};

type MemberDashboard = {
  member: Member;
  savings: { balance: number; monthlyTarget: number; deposits: Transaction[] };
  loans: Loan[];
  dividends: { balance: number; lastDeclared: string; payoutStatus: string };
  transactions: Transaction[];
  support: Ticket[];
};

type Tab = 'home' | 'savings' | 'loans' | 'dividends' | 'support' | 'statement';

const demoDashboard: MemberDashboard = {
  member: {
    id: 'demo-member-001',
    memberNo: 'DEMO-0001',
    fullName: 'Peter Mwangi',
    phone: '+254711204480',
    email: 'demo@grogonsacco.co.ke',
    shopLocation: 'Kirinyaga Road Garage',
    membershipTier: 'Demo workshop member',
    savingsBalance: 184500,
    loanBalance: 62000,
    dividendBalance: 8420,
    kycStatus: 'sample only',
    onboardingStage: 'Demo mode',
    mustSetPassword: false,
  },
  savings: {
    balance: 184500,
    monthlyTarget: 12000,
    deposits: [
      { id: 'demo-saving-1', kind: 'savings_deposit', channel: 'Sample PayBill feed', amount: 5000, reference: 'DEMO-MPESA-9JK2', status: 'sample posted' },
      { id: 'demo-saving-2', kind: 'savings_deposit', channel: 'Sample PayBill feed', amount: 3000, reference: 'DEMO-MPESA-9HJ8', status: 'sample posted' },
    ],
  },
  loans: [
    { id: 'demo-loan-1', loanType: 'Working Capital', amount: 250000, termMonths: 12, purpose: 'Spare parts stock and garage cash flow', status: 'sample committee review', monthlyRepayment: 23800 },
    { id: 'demo-loan-2', loanType: 'Tools Facility', amount: 62000, termMonths: 10, purpose: 'Garage tools', status: 'sample disbursed', monthlyRepayment: 7200 },
  ],
  dividends: { balance: 8420, lastDeclared: 'Sample June 2026 pool', payoutStatus: 'Demo payout status only' },
  transactions: [
    { id: 'demo-tx-1', kind: 'savings_deposit', amount: 5000, reference: 'DEMO-MPESA-9JK2', status: 'sample posted' },
    { id: 'demo-tx-2', kind: 'loan_repayment', amount: 7200, reference: 'DEMO-LR-2026-0628', status: 'sample posted' },
    { id: 'demo-tx-3', kind: 'dividend_credit', amount: 420, reference: 'DEMO-DIV-2026', status: 'sample posted' },
  ],
  support: [
    { id: 'demo-ticket-1', subject: 'Deposit confirmation', message: 'Sample support ticket only.', status: 'sample open' },
    { id: 'demo-ticket-2', subject: 'KYC document update', message: 'Sample resolved ticket.', status: 'sample resolved', resolution: 'Updated by demo admin.' },
  ],
};

export default function App() {
  return (
    <SafeAreaProvider>
      <MemberApp />
    </SafeAreaProvider>
  );
}

function MemberApp() {
  const [token, setToken] = useState('');
  const [dashboard, setDashboard] = useState<MemberDashboard | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [status, setStatus] = useState('Welcome to Grogon Sacco');
  const [booting, setBooting] = useState(true);
  const [memberNo, setMemberNo] = useState('GS-0001');
  const [phone, setPhone] = useState('+254711204480');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loan, setLoan] = useState({
    loanType: 'Working Capital',
    amount: '250000',
    termMonths: '12',
    purpose: 'Spare parts stock and garage cash flow',
  });
  const [ticket, setTicket] = useState({
    subject: 'Account support',
    message: 'Please assist me with my SACCO account.',
  });

  const member = dashboard?.member;
  const mustSetPassword = Boolean(token && member?.mustSetPassword);
  const nextPayment = useMemo(() => {
    const activeLoan = dashboard?.loans.find((item) => ['approved', 'disbursed'].includes(item.status));
    return activeLoan?.monthlyRepayment || 0;
  }, [dashboard?.loans]);
  const openTickets = dashboard?.support.filter((item) => item.status !== 'resolved' && item.status !== 'closed').length || 0;
  const insets = useSafeAreaInsets();
  const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : 'height';
  const keyboardOffset = Platform.OS === 'ios' ? Math.max(insets.top, 12) : 0;

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    if (isDemoMode) {
      setToken(demoToken);
      setDashboard(demoDashboard);
      setStatus('Demo mode: sample data only. No real savings, loans, deposits, payments or SACCO services are provided.');
      setBooting(false);
      return;
    }
    try {
      const [savedToken, savedDashboard] = await Promise.all([
        AsyncStorage.getItem(storageToken),
        AsyncStorage.getItem(storageDashboard),
      ]);
      if (savedDashboard) setDashboard(JSON.parse(savedDashboard));
      if (savedToken) {
        setToken(savedToken);
        await load(savedToken);
      }
    } catch {
      setStatus('Could not restore saved session.');
    } finally {
      setBooting(false);
    }
  }

  async function persist(nextToken: string, nextDashboard: MemberDashboard) {
    setToken(nextToken);
    setDashboard(nextDashboard);
    await Promise.all([
      AsyncStorage.setItem(storageToken, nextToken),
      AsyncStorage.setItem(storageDashboard, JSON.stringify(nextDashboard)),
    ]);
  }

  async function login() {
    if (!memberNo.trim() || !phone.trim()) {
      setStatus('Enter member number and registered phone.');
      return;
    }
    if (isDemoMode) {
      await persist(demoToken, demoDashboard);
      setPassword('');
      setStatus('Demo dashboard opened with sample data only. Licensed SACCO operations are disabled in this build.');
      return;
    }
    setStatus('Checking member access...');
    try {
      const data = await apiFetch<{ token: string; mustSetPassword: boolean; dashboard: MemberDashboard; message: string }>(
        '/api/member/auth/login',
        { method: 'POST', body: JSON.stringify({ memberNo, phone, password }) },
      );
      await persist(data.token, data.dashboard);
      setPassword('');
      setStatus(data.message || 'Member access confirmed.');
    } catch (error: any) {
      setStatus(error.message || 'Login failed.');
    }
  }

  async function load(nextToken = token) {
    if (!nextToken) return;
    if (isDemoMode) {
      setDashboard(demoDashboard);
      setStatus('Demo data refreshed. Live backend sync is disabled until licensed activation.');
      return;
    }
    try {
      const data = await apiFetch<MemberDashboard>('/api/member/dashboard', { token: nextToken });
      setDashboard(data);
      await AsyncStorage.setItem(storageDashboard, JSON.stringify(data));
      setStatus('Dashboard updated.');
    } catch (error: any) {
      setStatus(error.message || 'Could not refresh dashboard.');
    }
  }

  async function createPassword() {
    if (newPassword.length < 8) {
      setStatus('Use at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('The two passwords do not match.');
      return;
    }
    try {
      const data = await apiFetch<{ dashboard: MemberDashboard; message: string }>('/api/member/auth/set-password', {
        method: 'POST',
        token,
        body: JSON.stringify({ password: newPassword }),
      });
      setDashboard(data.dashboard);
      await AsyncStorage.setItem(storageDashboard, JSON.stringify(data.dashboard));
      setNewPassword('');
      setConfirmPassword('');
      setStatus(data.message || 'Password created.');
    } catch (error: any) {
      setStatus(error.message || 'Password setup failed.');
    }
  }

  async function post(path: string, body: any, successTab?: Tab) {
    setStatus('Submitting...');
    if (isDemoMode) {
      if (successTab) setTab(successTab);
      const action = path.includes('loans') ? 'loan request' : path.includes('support') ? 'support ticket' : 'request';
      setStatus(`Demo mode: sample ${action} captured locally. No real SACCO record, credit decision, payment or financial service was created.`);
      setDashboard({ ...demoDashboard, support: path.includes('support') ? [{ id: 'demo-ticket-new', subject: body?.subject || 'Sample ticket', message: body?.message || 'Sample message', status: 'sample open' }, ...demoDashboard.support] : demoDashboard.support });
      return;
    }
    try {
      const data: any = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
      setStatus(data.message || 'Posted successfully.');
      if (successTab) setTab(successTab);
      await load();
    } catch (error: any) {
      setStatus(error.message || 'Request failed.');
    }
  }

  function openStatement(type: 'full' | 'savings' | 'loans' | 'dividends' | 'transactions') {
    if (!token) return;
    if (isDemoMode) {
      setStatus(`Demo mode: ${type} statement preview only. PDF downloads activate after licensing and organization approval.`);
      return;
    }
    const url = `${apiBaseUrl}/api/member/statements/${type}.pdf?token=${encodeURIComponent(token)}`;
    Linking.openURL(url);
    setStatus('Opening PDF statement...');
  }

  async function logout() {
    await Promise.all([AsyncStorage.removeItem(storageToken), AsyncStorage.removeItem(storageDashboard)]);
    setToken('');
    setDashboard(null);
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTab('home');
    setStatus('Logged out.');
  }

  if (booting) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: ink, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Ionicons name="construct-outline" size={34} color={orange} />
        <Text style={{ color: white, fontSize: 24, fontWeight: '900', marginTop: 14 }}>Opening Grogon Sacco Demo</Text>
        <Text style={{ color: blue, marginTop: 8, textAlign: 'center' }}>Checking your saved member session.</Text>
      </SafeAreaView>
    );
  }

  if (!token || !dashboard || !member) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#f8f9ff' }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboardBehavior} keyboardVerticalOffset={keyboardOffset}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            contentContainerStyle={{ padding: 18, paddingTop: 22, paddingBottom: Math.max(42, insets.bottom + 30) }}
          >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: '#9d4300', fontWeight: '900', letterSpacing: 1 }}>PORTFOLIO DEMO APP</Text>
              <Text style={{ color: ink, fontSize: 30, fontWeight: '900' }}>Grogon Sacco Demo</Text>
            </View>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: ink, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="construct-outline" size={26} color={orange} />
            </View>
          </View>
          <Text style={{ marginTop: 28, color: ink, fontSize: 34, fontWeight: '900', lineHeight: 40 }}>
            SACCO-style mobile app concept for Grogon mechanics and spare shops.
          </Text>
          <Text style={{ marginTop: 14, color: '#44474d', fontSize: 16, lineHeight: 25 }}>
            Demo screens use sample data only. This build does not provide real savings, loans, payments, dividends or financial services.
          </Text>
          <View style={{ marginTop: 24, gap: 10 }}>
            <PublicPoint icon="wallet-outline" text="Sample member dashboard and savings UI" />
            <PublicPoint icon="cash-outline" text="Sample loan request and balance screens" />
            <PublicPoint icon="document-text-outline" text="Sample statements, dividends and support flows" />
          </View>
          <Card light>
            <Text style={{ color: '#9d4300', fontWeight: '900', letterSpacing: 1 }}>DEMO LOGIN</Text>
            <LoginFieldLabel text="Member number" />
            <TextInput value={memberNo} onChangeText={setMemberNo} placeholder="Example: GS-0001" placeholderTextColor={lightPlaceholder} selectionColor={orange} style={lightInput} autoCapitalize="characters" autoCorrect={false} />
            <LoginFieldLabel text="Registered phone" />
            <TextInput value={phone} onChangeText={setPhone} placeholder="Example: +254711204480" placeholderTextColor={lightPlaceholder} selectionColor={orange} style={lightInput} keyboardType="phone-pad" />
            <LoginFieldLabel text="Password" />
            <TextInput value={password} onChangeText={setPassword} placeholder="First login? Leave password blank" placeholderTextColor={lightPlaceholder} selectionColor={orange} style={lightInput} secureTextEntry />
            <TouchableOpacity style={publicPrimary} onPress={login}>
              <Text style={{ color: '#351000', fontWeight: '900' }}>OPEN DEMO DASHBOARD</Text>
            </TouchableOpacity>
            <Text style={{ marginTop: 12, color: '#44474d', lineHeight: 21 }}>{status}</Text>
          </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (mustSetPassword) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: ink }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboardBehavior} keyboardVerticalOffset={keyboardOffset}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            contentContainerStyle={{ padding: 18, paddingTop: 22, paddingBottom: Math.max(42, insets.bottom + 30) }}
          >
          <Text style={label}>FIRST LOGIN</Text>
          <Text style={{ color: white, fontSize: 32, fontWeight: '900', lineHeight: 38, marginTop: 8 }}>
            Create your private password, {member.fullName}.
          </Text>
          <Text style={{ color: blue, lineHeight: 24, marginTop: 12 }}>
            From your next login, use your member number, registered phone and this password.
          </Text>
          <Card>
            <Text style={h2}>{member.memberNo}</Text>
            <Text style={muted}>{member.shopLocation} - KYC {member.kycStatus}</Text>
            <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="New password" placeholderTextColor="#8790a3" style={input} secureTextEntry />
            <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" placeholderTextColor="#8790a3" style={input} secureTextEntry />
            <TouchableOpacity style={primary} onPress={createPassword}>
              <Text style={primaryText}>CREATE PASSWORD AND OPEN DASHBOARD</Text>
            </TouchableOpacity>
            <Text style={{ marginTop: 12, color: blue }}>{status}</Text>
          </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: ink }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboardBehavior} keyboardVerticalOffset={keyboardOffset}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentContainerStyle={{ padding: 16, paddingTop: 18, paddingBottom: 110 + insets.bottom }}
        >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: orange, fontWeight: '900', letterSpacing: 1 }}>{member.memberNo}</Text>
            <Text style={{ color: white, fontSize: 26, fontWeight: '900' }}>{member.fullName}</Text>
            <Text style={{ color: blue, marginTop: 4 }}>{member.shopLocation}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => load()} style={{ padding: 8 }}>
              <Ionicons name="refresh-outline" size={24} color={orange} />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={{ padding: 8 }}>
              <Ionicons name="log-out-outline" size={25} color={orange} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={{ marginTop: 10, color: blue }}>{status}</Text>
        {isDemoMode && <DemoNotice />}

        <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Pill text={member.membershipTier} />
          <Pill text={`KYC ${member.kycStatus}`} />
          <Pill text={member.onboardingStage || 'Active'} />
        </View>

        {tab === 'home' && (
          <View>
            <Card>
              <Text style={label}>ACCOUNT OVERVIEW</Text>
              <Text style={h2}>Practical money tools for your garage and parts business.</Text>
              <Text style={muted}>Track your savings, credit, dividends and support requests without seeing any other member account.</Text>
              <View style={{ marginTop: 14, gap: 10 }}>
                <Metric icon="wallet-outline" label="Savings" value={formatKes(member.savingsBalance)} />
                <Metric icon="cash-outline" label="Loan balance" value={formatKes(member.loanBalance)} />
                <Metric icon="trending-up-outline" label="Dividends" value={formatKes(member.dividendBalance)} />
                <Metric icon="receipt-outline" label="Next repayment" value={nextPayment ? formatKes(nextPayment) : 'None due'} />
              </View>
            </Card>
            <Card>
              <Text style={label}>MEMBER PROFILE</Text>
              <InfoLine label="Phone" value={member.phone} />
              <InfoLine label="Email" value={member.email || 'Not recorded'} />
              <InfoLine label="Monthly target" value={formatKes(dashboard.savings.monthlyTarget)} />
              <InfoLine label="Loan requests" value={String(dashboard.loans.length)} />
              <InfoLine label="Open tickets" value={String(openTickets)} />
            </Card>
          </View>
        )}

        {tab === 'savings' && (
          <View>
            <Card>
              <Text style={label}>M-PESA PAYBILL SAVINGS</Text>
              <Text style={h2}>Deposits post automatically</Text>
              <Text style={muted}>Use PayBill 522522 and account GROGON-{member.memberNo}. Your savings update after M-Pesa confirms the payment.</Text>
              <Metric icon="business-outline" label="PayBill" value="522522" />
              <Metric icon="keypad-outline" label="Account" value={`GROGON-${member.memberNo}`} />
              <ActionRow>
                <ActionButton text="Savings PDF" icon="download-outline" onPress={() => openStatement('savings')} />
                <ActionButton text="Full PDF" icon="document-text-outline" dark onPress={() => openStatement('full')} />
              </ActionRow>
            </Card>
            <ListCard
              title="Auto-posted savings"
              empty="No savings deposits yet."
              rows={dashboard.savings.deposits.map((item) => ({
                id: item.id,
                title: `${item.reference} - ${formatKes(item.amount)}`,
                detail: `${item.channel || 'M-Pesa PayBill'} - ${item.status}`,
              }))}
            />
          </View>
        )}

        {tab === 'loans' && (
          <View>
            <Card>
              <Text style={label}>APPLY FOR CREDIT</Text>
              <Text style={h2}>Send a request to the credit committee</Text>
              <Field label="Loan type" value={loan.loanType} onChange={(value) => setLoan({ ...loan, loanType: value })} />
              <Field label="Amount" value={loan.amount} onChange={(value) => setLoan({ ...loan, amount: value })} keyboardType="number-pad" />
              <Field label="Term months" value={loan.termMonths} onChange={(value) => setLoan({ ...loan, termMonths: value })} keyboardType="number-pad" />
              <Field label="Purpose" value={loan.purpose} onChange={(value) => setLoan({ ...loan, purpose: value })} />
              <TouchableOpacity
                style={primary}
                onPress={() =>
                  post(
                    '/api/loans/apply',
                    { ...loan, memberId: member.id, amount: Number(loan.amount), termMonths: Number(loan.termMonths) },
                    'loans',
                  )
                }
              >
                <Text style={primaryText}>SEND TO CREDIT COMMITTEE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={secondary} onPress={() => openStatement('loans')}>
                <Text style={{ color: white, fontWeight: '900' }}>DOWNLOAD LOAN STATEMENT PDF</Text>
              </TouchableOpacity>
            </Card>
            <ListCard
              title="Loan activity"
              empty="No loan requests yet."
              rows={dashboard.loans.map((item) => ({
                id: item.id,
                title: `${item.loanType} - ${formatKes(item.amount)}`,
                detail: `${item.status} - monthly ${formatKes(item.monthlyRepayment)}`,
              }))}
            />
          </View>
        )}

        {tab === 'dividends' && (
          <View>
            <Card>
              <Text style={label}>DIVIDENDS</Text>
              <Text style={h2}>{formatKes(dashboard.dividends.balance)}</Text>
              <Text style={muted}>{dashboard.dividends.payoutStatus}</Text>
              <InfoLine label="Last declared pool" value={dashboard.dividends.lastDeclared} />
              <ActionRow>
                <ActionButton text="Dividend PDF" icon="download-outline" onPress={() => openStatement('dividends')} />
                <ActionButton text="Full PDF" icon="document-text-outline" dark onPress={() => openStatement('full')} />
              </ActionRow>
            </Card>
            <Card>
              <Text style={label}>WHAT THIS MEANS</Text>
              <Text style={muted}>Dividends reflect your participation in the SACCO pool. Admins process payout instructions after board declaration and member verification.</Text>
            </Card>
          </View>
        )}

        {tab === 'support' && (
          <View>
            <Card>
              <Text style={label}>OPEN SUPPORT TICKET</Text>
              <Text style={h2}>Kirinyaga Road member desk</Text>
              <Field label="Subject" value={ticket.subject} onChange={(value) => setTicket({ ...ticket, subject: value })} />
              <TextInput
                value={ticket.message}
                onChangeText={(value) => setTicket({ ...ticket, message: value })}
                multiline
                placeholder="Message"
                placeholderTextColor="#8790a3"
                style={[input, { minHeight: 92 }]}
              />
              <TouchableOpacity style={primary} onPress={() => post('/api/support/tickets', { memberId: member.id, subject: ticket.subject, message: ticket.message }, 'support')}>
                <Text style={primaryText}>SEND TO SACCO DESK</Text>
              </TouchableOpacity>
            </Card>
            <ListCard
              title="Support history"
              empty="No support tickets yet."
              rows={dashboard.support.map((item) => ({
                id: item.id,
                title: `${item.subject} - ${item.status}`,
                detail: item.resolution || item.message || 'In review',
              }))}
            />
          </View>
        )}

        {tab === 'statement' && (
          <View>
            <Card>
              <Text style={label}>STATEMENTS</Text>
              <Text style={h2}>Download account records</Text>
              <Text style={muted}>{isDemoMode ? 'Statement buttons are visible for UI demonstration. PDF generation activates only in licensed live mode.' : 'PDF records match the web member portal and are generated from your live SACCO account.'}</Text>
              <ActionRow>
                <ActionButton text="Full PDF" icon="document-text-outline" onPress={() => openStatement('full')} />
                <ActionButton text="Transactions" icon="receipt-outline" dark onPress={() => openStatement('transactions')} />
              </ActionRow>
              <ActionRow>
                <ActionButton text="Savings" icon="wallet-outline" onPress={() => openStatement('savings')} />
                <ActionButton text="Loans" icon="cash-outline" dark onPress={() => openStatement('loans')} />
              </ActionRow>
            </Card>
            <ListCard
              title="Account statement"
              empty="No transactions yet."
              rows={dashboard.transactions.map((item) => ({
                id: item.id,
                title: `${item.kind.replace(/_/g, ' ')} - ${formatKes(item.amount)}`,
                detail: `${item.reference} - ${item.status}`,
              }))}
            />
          </View>
        )}
        </ScrollView>

        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 78 + insets.bottom, backgroundColor: '#151f37', borderTopWidth: 1, borderColor: '#2a344d', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 9, paddingBottom: Math.max(insets.bottom, 14) }}>
        {[
          ['home', 'home-outline', 'Home'],
          ['savings', 'wallet-outline', 'Savings'],
          ['loans', 'document-text-outline', 'Loans'],
          ['dividends', 'trending-up-outline', 'Dividends'],
          ['support', 'headset-outline', 'Support'],
          ['statement', 'receipt-outline', 'Statement'],
        ].map(([key, icon, title]) => (
          <TouchableOpacity key={key} onPress={() => setTab(key as Tab)} style={{ alignItems: 'center', gap: 3, width: 58 }}>
            <Ionicons name={icon as any} size={21} color={tab === key ? orange : blue} />
            <Text style={{ color: tab === key ? orange : blue, fontSize: 9, fontWeight: '800' }}>{title}</Text>
          </TouchableOpacity>
        ))}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const label = { color: '#ffb690', fontSize: 12, fontWeight: '900' as const, letterSpacing: 1 };
const h2 = { color: white, fontSize: 24, fontWeight: '900' as const, marginTop: 6 };
const muted = { color: '#c5c6cd', marginTop: 4, lineHeight: 21 };
const input = { marginTop: 10, backgroundColor: '#030d25', borderWidth: 1, borderColor: '#44474d', borderRadius: 8, padding: 14, color: white, fontWeight: '800' as const };
const lightPlaceholder = '#596172';
const lightInput = { marginTop: 7, backgroundColor: white, borderWidth: 1.4, borderColor: '#9aa3b2', borderRadius: 8, padding: 14, color: ink, fontSize: 15, fontWeight: '900' as const };
const primary = { marginTop: 16, backgroundColor: orange, borderRadius: 8, padding: 14, alignItems: 'center' as const };
const publicPrimary = { marginTop: 16, backgroundColor: orange, borderRadius: 8, padding: 14, alignItems: 'center' as const };
const secondary = { marginTop: 10, backgroundColor: '#0d1c32', borderWidth: 1, borderColor: '#44474d', borderRadius: 8, padding: 14, alignItems: 'center' as const };
const primaryText = { color: '#351000', fontWeight: '900' as const };

function Card({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <View style={{ backgroundColor: light ? white : '#101b33', borderWidth: 1, borderColor: light ? '#c5c6cd' : '#2a344d', borderRadius: 14, padding: 16, marginTop: 18 }}>
      {children}
    </View>
  );
}

function Pill({ text }: { text: string }) {
  return <Text style={{ color: blue, backgroundColor: '#151f37', borderWidth: 1, borderColor: '#2a344d', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, fontWeight: '900', fontSize: 12 }}>{text}</Text>;
}

function Field({ label, value, onChange, keyboardType }: { label: string; value: string; onChange: (value: string) => void; keyboardType?: 'default' | 'number-pad' }) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ color: '#c5c6cd', fontWeight: '900', fontSize: 12 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType={keyboardType || 'default'} placeholderTextColor="#8790a3" style={input} />
    </View>
  );
}

function LoginFieldLabel({ text }: { text: string }) {
  return <Text style={{ color: '#363b46', fontWeight: '900', fontSize: 12, marginTop: 13 }}>{text}</Text>;
}

function PublicPoint({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: white, padding: 13, borderRadius: 12, borderWidth: 1, borderColor: '#d7dbe5' }}>
      <Ionicons name={icon} size={21} color="#9d4300" />
      <Text style={{ color: ink, fontWeight: '800', flex: 1 }}>{text}</Text>
    </View>
  );
}

function Metric({ icon, label: itemLabel, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#151f37', padding: 12, borderRadius: 10, marginTop: 10 }}>
      <Ionicons name={icon} size={22} color={orange} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#c5c6cd', fontSize: 12, fontWeight: '800' }}>{itemLabel}</Text>
        <Text style={{ color: white, fontWeight: '900' }}>{value}</Text>
      </View>
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginTop: 10, backgroundColor: '#151f37', borderRadius: 10, padding: 12 }}>
      <Text style={{ color: '#c5c6cd', fontSize: 12, fontWeight: '800' }}>{label}</Text>
      <Text style={{ color: white, fontWeight: '900', marginTop: 2 }}>{value}</Text>
    </View>
  );
}

function ActionRow({ children }: { children: React.ReactNode }) {
  return <View style={{ marginTop: 12, flexDirection: 'row', gap: 10 }}>{children}</View>;
}

function ActionButton({ text, icon, onPress, dark = false }: { text: string; icon: any; onPress: () => void; dark?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flex: 1, backgroundColor: dark ? '#0d1c32' : orange, borderWidth: dark ? 1 : 0, borderColor: '#44474d', borderRadius: 8, padding: 12, alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={18} color={dark ? white : '#351000'} />
      <Text style={{ color: dark ? white : '#351000', fontSize: 11, fontWeight: '900', textAlign: 'center' }}>{text}</Text>
    </TouchableOpacity>
  );
}

function ListCard({ title, rows, empty }: { title: string; rows: Array<{ id: string; title: string; detail: string }>; empty: string }) {
  return (
    <Card>
      <Text style={label}>{title.toUpperCase()}</Text>
      {rows.length === 0 && <Text style={muted}>{empty}</Text>}
      {rows.map((row) => (
        <View key={row.id} style={{ marginTop: 10, backgroundColor: '#151f37', borderRadius: 10, padding: 12 }}>
          <Text style={{ color: white, fontWeight: '900' }}>{row.title}</Text>
          <Text style={muted}>{row.detail}</Text>
        </View>
      ))}
    </Card>
  );
}


function DemoNotice() {
  return (
    <View style={{ marginTop: 14, backgroundColor: '#fff7ed', borderColor: '#fd761a', borderWidth: 1, borderRadius: 12, padding: 12 }}>
      <Text style={{ color: '#9d4300', fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>DEMO MODE</Text>
      <Text style={{ color: '#351000', marginTop: 4, lineHeight: 20 }}>
        Sample data only. No real SACCO account, savings, loan, dividend, payment, statement or support service is provided until licensed live activation.
      </Text>
    </View>
  );
}
