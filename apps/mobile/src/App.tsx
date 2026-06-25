import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch, formatKes, type SaccoSummary } from './lib/api';

const ink = '#08132a';
const orange = '#fd761a';
const blue = '#d6e3ff';
const white = '#ffffff';
const initial: SaccoSummary = {
  totals: { members: 0, savings: 0, loans: 0, dividends: 0 },
  members: [],
  loans: [],
  transactions: [],
  tickets: [],
};

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [summary, setSummary] = useState<SaccoSummary>(initial);
  const [tab, setTab] = useState<'home' | 'loans' | 'savings' | 'support'>('home');
  const [status, setStatus] = useState('Welcome to Grogon SACCO');
  const [memberNo, setMemberNo] = useState('GS-0001');
  const [phone, setPhone] = useState('+254711204480');
  const [amount, setAmount] = useState('25000');

  async function load() {
    try {
      const data = await apiFetch<SaccoSummary>('/api/sacco/summary');
      setSummary(data);
      setStatus('Live member portal');
    } catch {
      setStatus('Offline mode. Start backend on port 4000.');
    }
  }

  useEffect(() => {
    if (authenticated) load();
  }, [authenticated]);

  const member = summary.members.find((item) => item.memberNo === memberNo) || summary.members[0];

  function login() {
    if (!memberNo.trim() || !phone.trim()) {
      setStatus('Enter member number and registered phone.');
      return;
    }
    setAuthenticated(true);
    setStatus('Opening member portal...');
  }

  async function post(path: string, body: any) {
    setStatus('Submitting...');
    try {
      const data: any = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
      setStatus(data.message || 'Posted');
      await load();
    } catch (error: any) {
      setStatus(error.message || 'Request failed');
    }
  }

  if (!authenticated) {
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
          <Text style={{ marginTop: 28, color: ink, fontSize: 36, fontWeight: '900', lineHeight: 42 }}>
            Savings and fair credit for Nairobi's motor trade.
          </Text>
          <Text style={{ marginTop: 14, color: '#44474d', fontSize: 16, lineHeight: 25 }}>
            For mechanics, panel beaters, painters, auto electricians, spare-part shops and garage
            owners around Grogon and Kirinyaga Road.
          </Text>
          <View style={{ marginTop: 24, gap: 10 }}>
            <PublicPoint icon="people-outline" text="Member-owned savings and dividends" />
            <PublicPoint icon="cash-outline" text="Equipment and working-capital finance" />
            <PublicPoint icon="shield-checkmark-outline" text="KYC, credit committee and clear records" />
          </View>
          <Card light>
            <Text style={{ color: '#9d4300', fontWeight: '900', letterSpacing: 1 }}>MEMBER LOGIN</Text>
            <TextInput value={memberNo} onChangeText={setMemberNo} placeholder="Member number" style={lightInput} />
            <TextInput value={phone} onChangeText={setPhone} placeholder="Registered phone" style={lightInput} />
            <TouchableOpacity style={publicPrimary} onPress={login}>
              <Text style={{ color: '#351000', fontWeight: '900' }}>LOGIN TO PORTAL</Text>
            </TouchableOpacity>
            <Text style={{ marginTop: 12, color: '#44474d', lineHeight: 21 }}>
              Not activated? Visit the SACCO desk with ID, KRA PIN and workshop details.
            </Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: ink }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 54, paddingBottom: 92 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: orange, fontWeight: '900', letterSpacing: 1 }}>GROGON SACCO</Text>
            <Text style={{ color: white, fontSize: 26, fontWeight: '900' }}>Member Portal</Text>
          </View>
          <TouchableOpacity onPress={() => setAuthenticated(false)} style={{ padding: 8 }}>
            <Ionicons name="log-out-outline" size={25} color={orange} />
          </TouchableOpacity>
        </View>
        <Text style={{ marginTop: 10, color: blue }}>{status}</Text>

        {tab === 'home' && (
          <View>
            <Card>
              <Text style={label}>ACTIVE MEMBER</Text>
              <Text style={h2}>{member?.fullName || 'Grogon Member'}</Text>
              <Text style={muted}>{member?.memberNo || memberNo} - {member?.shopLocation || 'Kirinyaga Road'}</Text>
              <View style={{ marginTop: 14, gap: 10 }}>
                <Metric icon="wallet-outline" label="Savings" value={formatKes(member?.savingsBalance || 0)} />
                <Metric icon="cash-outline" label="Loan balance" value={formatKes(member?.loanBalance || 0)} />
                <Metric icon="trending-up-outline" label="Dividends" value={formatKes(member?.dividendBalance || 0)} />
              </View>
            </Card>
          </View>
        )}

        {tab === 'loans' && (
          <Card>
            <Text style={label}>CREDIT REQUEST</Text>
            <Text style={h2}>Choose a loan product</Text>
            {['Equipment Financing', 'Working Capital', 'Business Growth Fund'].map((loanType, index) => (
              <TouchableOpacity
                key={loanType}
                onPress={() =>
                  post('/api/loans/apply', {
                    memberId: member?.id,
                    loanType,
                    amount: index ? 350000 : 1200000,
                    termMonths: index ? 12 : 24,
                    purpose: `${loanType} for Grogon auto shop operations`,
                  })
                }
                style={choice}
              >
                <Ionicons name={index === 0 ? 'construct-outline' : index === 1 ? 'wallet-outline' : 'trending-up-outline'} size={25} color={orange} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: white, fontWeight: '900' }}>{loanType}</Text>
                  <Text style={muted}>Submit to credit committee</Text>
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {tab === 'savings' && (
          <Card>
            <Text style={label}>M-PESA PAYBILL</Text>
            <Text style={h2}>Deposit or repay</Text>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="number-pad" style={input} />
            <TouchableOpacity style={primary} onPress={() => post('/api/payments/record', { memberId: member?.id, kind: 'savings_deposit', amount: Number(amount), channel: 'M-Pesa' })}>
              <Text style={primaryText}>POST SAVINGS DEPOSIT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={secondary} onPress={() => post('/api/payments/record', { memberId: member?.id, kind: 'loan_repayment', amount: Number(amount), channel: 'M-Pesa' })}>
              <Text style={{ color: white, fontWeight: '900' }}>POST LOAN REPAYMENT</Text>
            </TouchableOpacity>
          </Card>
        )}

        {tab === 'support' && (
          <Card>
            <Text style={label}>LIVE SUPPORT</Text>
            <Text style={h2}>Kirinyaga Road member desk</Text>
            <Text style={muted}>Open a ticket for KYC, dividend payout or loan repayment help.</Text>
            <TouchableOpacity style={primary} onPress={() => post('/api/support/tickets', { memberId: member?.id, subject: 'Mobile app support', message: 'Please assist this SACCO member.' })}>
              <Text style={primaryText}>OPEN SUPPORT TICKET</Text>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 74, backgroundColor: '#151f37', borderTopWidth: 1, borderColor: '#2a344d', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 }}>
        {[
          ['home', 'home-outline', 'Home'],
          ['loans', 'document-text-outline', 'Loans'],
          ['savings', 'wallet-outline', 'Savings'],
          ['support', 'headset-outline', 'Support'],
        ].map(([key, icon, title]) => (
          <TouchableOpacity key={key} onPress={() => setTab(key as any)} style={{ alignItems: 'center', gap: 3 }}>
            <Ionicons name={icon as any} size={24} color={tab === key ? orange : blue} />
            <Text style={{ color: tab === key ? orange : blue, fontSize: 11, fontWeight: '800' }}>{title}</Text>
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
