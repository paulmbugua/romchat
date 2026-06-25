import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch, formatKes } from './lib/api';

const ink = '#08132a';
const orange = '#fd761a';
const blue = '#d6e3ff';
const white = '#ffffff';

type MemberDashboard = {
  member: {
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
  savings: { balance: number; monthlyTarget: number; deposits: any[] };
  loans: any[];
  dividends: { balance: number; lastDeclared: string; payoutStatus: string };
  transactions: any[];
  support: any[];
};

export default function App() {
  const [token, setToken] = useState('');
  const [dashboard, setDashboard] = useState<MemberDashboard | null>(null);
  const [tab, setTab] = useState<'home' | 'savings' | 'loans' | 'dividends' | 'support'>('home');
  const [status, setStatus] = useState('Welcome to Grogon SACCO');
  const [memberNo, setMemberNo] = useState('GS-0001');
  const [phone, setPhone] = useState('+254711204480');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [amount, setAmount] = useState('5000');
  const [loanAmount, setLoanAmount] = useState('250000');
  const [ticketMessage, setTicketMessage] = useState('Please assist me with my SACCO account.');

  const member = dashboard?.member;
  const mustSetPassword = Boolean(token && member?.mustSetPassword);

  async function login() {
    if (!memberNo.trim() || !phone.trim()) {
      setStatus('Enter member number and registered phone.');
      return;
    }
    setStatus('Checking member access...');
    try {
      const data = await apiFetch<{ token: string; mustSetPassword: boolean; dashboard: MemberDashboard; message: string }>('/api/member/auth/login', {
        method: 'POST',
        body: JSON.stringify({ memberNo, phone, password }),
      });
      setToken(data.token);
      setDashboard(data.dashboard);
      setStatus(data.message || 'Member access confirmed.');
    } catch (error: any) {
      setStatus(error.message || 'Login failed.');
    }
  }

  async function load() {
    if (!token) return;
    try {
      const data = await apiFetch<MemberDashboard>('/api/member/dashboard', { token });
      setDashboard(data);
      setStatus('Dashboard updated.');
    } catch (error: any) {
      setStatus(error.message || 'Could not refresh dashboard.');
    }
  }

  useEffect(() => {
    if (token && !mustSetPassword) load();
  }, [token]);

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
      setStatus(data.message || 'Password created.');
    } catch (error: any) {
      setStatus(error.message || 'Password setup failed.');
    }
  }

  async function post(path: string, body: any) {
    setStatus('Submitting...');
    try {
      const data: any = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
      setStatus(data.message || 'Posted successfully.');
      await load();
    } catch (error: any) {
      setStatus(error.message || 'Request failed.');
    }
  }

  function logout() {
    setToken('');
    setDashboard(null);
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setStatus('Logged out.');
  }

  if (!token || !dashboard || !member) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8f9ff' }}>
        <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 58, paddingBottom: 34 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: '#9d4300', fontWeight: '900', letterSpacing: 1 }}>GROGON AUTO INDUSTRY</Text>
              <Text style={{ color: ink, fontSize: 30, fontWeight: '900' }}>Grogon SACCO</Text>
            </View>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: ink, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="construct-outline" size={26} color={orange} />
            </View>
          </View>
          <Text style={{ marginTop: 28, color: ink, fontSize: 34, fontWeight: '900', lineHeight: 40 }}>
            Private SACCO services for Grogon mechanics and spare shops.
          </Text>
          <Text style={{ marginTop: 14, color: '#44474d', fontSize: 16, lineHeight: 25 }}>
            Members manage savings, loans, dividends and support after SACCO admin onboarding.
          </Text>
          <View style={{ marginTop: 24, gap: 10 }}>
            <PublicPoint icon="wallet-outline" text="Member savings and deposit records" />
            <PublicPoint icon="cash-outline" text="Equipment and working-capital credit" />
            <PublicPoint icon="headset-outline" text="Support desk for KYC, loans and dividends" />
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
              <Text style={primaryText}>CREATE PASSWORD</Text>
            </TouchableOpacity>
            <Text style={{ marginTop: 12, color: blue }}>{status}</Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: ink }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 54, paddingBottom: 96 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: orange, fontWeight: '900', letterSpacing: 1 }}>{member.memberNo}</Text>
            <Text style={{ color: white, fontSize: 26, fontWeight: '900' }}>{member.fullName}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={{ padding: 8 }}>
            <Ionicons name="log-out-outline" size={25} color={orange} />
          </TouchableOpacity>
        </View>
        <Text style={{ marginTop: 10, color: blue }}>{status}</Text>

        {tab === 'home' && (
          <View>
            <Card>
              <Text style={label}>MEMBER ACCOUNT</Text>
              <Text style={h2}>{member.shopLocation}</Text>
              <Text style={muted}>{member.membershipTier} member - KYC {member.kycStatus}</Text>
              <View style={{ marginTop: 14, gap: 10 }}>
                <Metric icon="wallet-outline" label="Savings" value={formatKes(member.savingsBalance)} />
                <Metric icon="cash-outline" label="Loan balance" value={formatKes(member.loanBalance)} />
                <Metric icon="trending-up-outline" label="Dividends" value={formatKes(member.dividendBalance)} />
                <Metric icon="flag-outline" label="Monthly target" value={formatKes(dashboard.savings.monthlyTarget)} />
              </View>
            </Card>
          </View>
        )}

        {tab === 'savings' && (
          <Card>
            <Text style={label}>SAVINGS</Text>
            <Text style={h2}>Deposit to your SACCO account</Text>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="number-pad" style={input} />
            <TouchableOpacity style={primary} onPress={() => post('/api/payments/record', { memberId: member.id, kind: 'savings_deposit', amount: Number(amount), channel: 'M-Pesa' })}>
              <Text style={primaryText}>POST SAVINGS DEPOSIT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={secondary} onPress={() => post('/api/payments/record', { memberId: member.id, kind: 'loan_repayment', amount: Number(amount), channel: 'M-Pesa' })}>
              <Text style={{ color: white, fontWeight: '900' }}>POST LOAN REPAYMENT</Text>
            </TouchableOpacity>
          </Card>
        )}

        {tab === 'loans' && (
          <Card>
            <Text style={label}>LOANS</Text>
            <Text style={h2}>Apply for business credit</Text>
            <TextInput value={loanAmount} onChangeText={setLoanAmount} keyboardType="number-pad" style={input} />
            {['Equipment Financing', 'Working Capital', 'Emergency Garage Float'].map((loanType, index) => (
              <TouchableOpacity
                key={loanType}
                onPress={() => post('/api/loans/apply', { memberId: member.id, loanType, amount: Number(loanAmount), termMonths: index === 0 ? 24 : 12, purpose: `${loanType} for Grogon auto shop operations` })}
                style={choice}
              >
                <Ionicons name={index === 0 ? 'construct-outline' : index === 1 ? 'wallet-outline' : 'flash-outline'} size={25} color={orange} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: white, fontWeight: '900' }}>{loanType}</Text>
                  <Text style={muted}>Submit to credit committee</Text>
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {tab === 'dividends' && (
          <Card>
            <Text style={label}>DIVIDENDS</Text>
            <Text style={h2}>{formatKes(dashboard.dividends.balance)}</Text>
            <Text style={muted}>{dashboard.dividends.payoutStatus}</Text>
            <Text style={{ marginTop: 14, color: blue }}>Last declared pool: {dashboard.dividends.lastDeclared}</Text>
          </Card>
        )}

        {tab === 'support' && (
          <Card>
            <Text style={label}>SUPPORT</Text>
            <Text style={h2}>Kirinyaga Road member desk</Text>
            <TextInput value={ticketMessage} onChangeText={setTicketMessage} multiline style={[input, { minHeight: 92 }]} />
            <TouchableOpacity style={primary} onPress={() => post('/api/support/tickets', { memberId: member.id, subject: 'Mobile app support', message: ticketMessage })}>
              <Text style={primaryText}>OPEN SUPPORT TICKET</Text>
            </TouchableOpacity>
            <Text style={{ marginTop: 12, color: blue }}>{dashboard.support.length} support record(s)</Text>
          </Card>
        )}
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 78, backgroundColor: '#151f37', borderTopWidth: 1, borderColor: '#2a344d', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 }}>
        {[
          ['home', 'home-outline', 'Home'],
          ['savings', 'wallet-outline', 'Savings'],
          ['loans', 'document-text-outline', 'Loans'],
          ['dividends', 'trending-up-outline', 'Dividends'],
          ['support', 'headset-outline', 'Support'],
        ].map(([key, icon, title]) => (
          <TouchableOpacity key={key} onPress={() => setTab(key as any)} style={{ alignItems: 'center', gap: 3, width: 70 }}>
            <Ionicons name={icon as any} size={22} color={tab === key ? orange : blue} />
            <Text style={{ color: tab === key ? orange : blue, fontSize: 10, fontWeight: '800' }}>{title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const label = { color: '#ffb690', fontSize: 12, fontWeight: '900' as const, letterSpacing: 1 };
const h2 = { color: white, fontSize: 24, fontWeight: '900' as const, marginTop: 6 };
const muted = { color: '#c5c6cd', marginTop: 4 };
const input = { marginTop: 16, backgroundColor: '#030d25', borderWidth: 1, borderColor: '#44474d', borderRadius: 8, padding: 14, color: white, fontWeight: '800' as const };
const lightInput = { marginTop: 12, backgroundColor: '#f8f9ff', borderWidth: 1, borderColor: '#c5c6cd', borderRadius: 8, padding: 14, color: ink, fontWeight: '800' as const };
const primary = { marginTop: 16, backgroundColor: orange, borderRadius: 8, padding: 14, alignItems: 'center' as const };
const publicPrimary = { marginTop: 16, backgroundColor: orange, borderRadius: 8, padding: 14, alignItems: 'center' as const };
const secondary = { marginTop: 10, backgroundColor: '#0d1c32', borderWidth: 1, borderColor: '#44474d', borderRadius: 8, padding: 14, alignItems: 'center' as const };
const primaryText = { color: '#351000', fontWeight: '900' as const };
const choice = { marginTop: 12, backgroundColor: '#151f37', borderWidth: 1, borderColor: '#44474d', borderRadius: 10, padding: 14, flexDirection: 'row' as const, gap: 12, alignItems: 'center' as const };

function Card({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <View style={{ backgroundColor: light ? white : '#101b33', borderWidth: 1, borderColor: light ? '#c5c6cd' : '#2a344d', borderRadius: 14, padding: 16, marginTop: 18 }}>
      {children}
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#151f37', padding: 12, borderRadius: 10 }}>
      <Ionicons name={icon} size={22} color={orange} />
      <View>
        <Text style={{ color: '#c5c6cd', fontSize: 12, fontWeight: '800' }}>{itemLabel}</Text>
        <Text style={{ color: white, fontWeight: '900' }}>{value}</Text>
      </View>
    </View>
  );
}
