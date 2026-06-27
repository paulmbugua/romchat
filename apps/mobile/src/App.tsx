import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiBaseUrl, apiFetch, formatKes } from './lib/api';

const ink = '#08132a';
const orange = '#fd761a';
const blue = '#d6e3ff';
const white = '#ffffff';
const storageToken = 'grogon-member-token';
const storageDashboard = 'grogon-member-dashboard';

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

export default function App() {
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

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
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
      <View style={{ flex: 1, backgroundColor: ink, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Ionicons name="construct-outline" size={34} color={orange} />
        <Text style={{ color: white, fontSize: 24, fontWeight: '900', marginTop: 14 }}>Opening Grogon Sacco</Text>
        <Text style={{ color: blue, marginTop: 8, textAlign: 'center' }}>Checking your saved member session.</Text>
      </View>
    );
  }

  if (!token || !dashboard || !member) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8f9ff' }}>
        <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 58, paddingBottom: 34 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: '#9d4300', fontWeight: '900', letterSpacing: 1 }}>GROGON AUTO INDUSTRY</Text>
              <Text style={{ color: ink, fontSize: 30, fontWeight: '900' }}>Grogon Sacco</Text>
            </View>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: ink, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="construct-outline" size={26} color={orange} />
            </View>
          </View>
          <Text style={{ marginTop: 28, color: ink, fontSize: 34, fontWeight: '900', lineHeight: 40 }}>
            Private SACCO services for Grogon mechanics and spare shops.
          </Text>
          <Text style={{ marginTop: 14, color: '#44474d', fontSize: 16, lineHeight: 25 }}>
            Members manage savings, loans, dividends, statements and support after SACCO admin onboarding.
          </Text>
          <View style={{ marginTop: 24, gap: 10 }}>
            <PublicPoint icon="wallet-outline" text="Auto-posted M-Pesa PayBill savings" />
            <PublicPoint icon="cash-outline" text="Equipment and working-capital credit" />
            <PublicPoint icon="document-text-outline" text="PDF savings, loan, dividend and full statements" />
          </View>
          <Card light>
            <Text style={{ color: '#9d4300', fontWeight: '900', letterSpacing: 1 }}>MEMBER LOGIN</Text>
            <TextInput value={memberNo} onChangeText={setMemberNo} placeholder="Member number" style={lightInput} autoCapitalize="characters" />
            <TextInput value={phone} onChangeText={setPhone} placeholder="Registered phone" style={lightInput} keyboardType="phone-pad" />
            <TextInput value={password} onChangeText={setPassword} placeholder="Password, leave blank on first login" style={lightInput} secureTextEntry />
            <TouchableOpacity style={publicPrimary} onPress={login}>
              <Text style={{ color: '#351000', fontWeight: '900' }}>LOGIN TO DASHBOARD</Text>
            </TouchableOpacity>
            <Text style={{ marginTop: 12, color: '#44474d', lineHeight: 21 }}>{status}</Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  if (mustSetPassword) {
    return (
      <View style={{ flex: 1, backgroundColor: ink }}>
        <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 58, paddingBottom: 34 }}>
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
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: ink }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 54, paddingBottom: 106 }}>
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
              <Text style={muted}>PDF records match the web member portal and are generated from your live SACCO account.</Text>
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

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 82, backgroundColor: '#151f37', borderTopWidth: 1, borderColor: '#2a344d', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 }}>
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
    </View>
  );
}

const label = { color: '#ffb690', fontSize: 12, fontWeight: '900' as const, letterSpacing: 1 };
const h2 = { color: white, fontSize: 24, fontWeight: '900' as const, marginTop: 6 };
const muted = { color: '#c5c6cd', marginTop: 4, lineHeight: 21 };
const input = { marginTop: 10, backgroundColor: '#030d25', borderWidth: 1, borderColor: '#44474d', borderRadius: 8, padding: 14, color: white, fontWeight: '800' as const };
const lightInput = { marginTop: 12, backgroundColor: '#f8f9ff', borderWidth: 1, borderColor: '#c5c6cd', borderRadius: 8, padding: 14, color: ink, fontWeight: '800' as const };
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
