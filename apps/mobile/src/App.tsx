import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch, formatKes, type SaccoSummary } from './lib/api';

const ink = '#08132a';
const orange = '#fd761a';
const blue = '#d6e3ff';
const initial: SaccoSummary = {
  totals: { members: 0, savings: 0, loans: 0, dividends: 0 },
  members: [],
  loans: [],
  transactions: [],
  tickets: [],
};

export default function App() {
  const [summary, setSummary] = useState<SaccoSummary>(initial);
  const [tab, setTab] = useState<'home' | 'loans' | 'savings' | 'support'>('home');
  const [status, setStatus] = useState('Loading SACCO account...');
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
    load();
  }, []);

  const member = summary.members[0];

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

  return (
    <View style={{ flex: 1, backgroundColor: ink }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 54, paddingBottom: 92 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: orange, fontWeight: '900', letterSpacing: 1 }}>GROGON SACCO</Text>
            <Text style={{ color: 'white', fontSize: 26, fontWeight: '900' }}>Member App</Text>
          </View>
          <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: orange, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="construct-outline" size={24} color="#351000" />
          </View>
        </View>
        <Text style={{ marginTop: 10, color: blue }}>{status}</Text>

        {tab === 'home' && (
          <View>
            <Card>
              <Text style={label}>ACTIVE MEMBER</Text>
              <Text style={h2}>{member?.fullName || 'Grogon Mechanic'}</Text>
              <Text style={muted}>
                {member?.memberNo || 'GS-0001'} · {member?.shopLocation || 'Kirinyaga Road'}
              </Text>
              <View style={{ marginTop: 14, gap: 10 }}>
                <Metric icon="wallet-outline" label="Savings" value={formatKes(member?.savingsBalance || summary.totals.savings)} />
                <Metric icon="cash-outline" label="Loan balance" value={formatKes(member?.loanBalance || summary.totals.loans)} />
                <Metric icon="trending-up-outline" label="Dividends" value={formatKes(member?.dividendBalance || summary.totals.dividends)} />
              </View>
            </Card>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Mini title="Members" value={String(summary.totals.members)} />
              <Mini title="Loan book" value={formatKes(summary.totals.loans)} />
            </View>
          </View>
        )}

        {tab === 'loans' && (
          <Card>
            <Text style={label}>APPLICATION STEP 1</Text>
            <Text style={h2}>Select Loan Type</Text>
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
                <Ionicons
                  name={index === 0 ? 'construct-outline' : index === 1 ? 'wallet-outline' : 'trending-up-outline'}
                  size={25}
                  color={orange}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontWeight: '900' }}>{loanType}</Text>
                  <Text style={muted}>Tap to submit to credit committee</Text>
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
              <Text style={{ color: 'white', fontWeight: '900' }}>POST LOAN REPAYMENT</Text>
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
const h2 = { color: 'white', fontSize: 24, fontWeight: '900' as const, marginTop: 6 };
const muted = { color: '#c5c6cd', marginTop: 4 };
const input = { marginTop: 16, backgroundColor: '#030d25', borderWidth: 1, borderColor: '#44474d', borderRadius: 8, padding: 14, color: 'white', fontWeight: '800' as const };
const primary = { marginTop: 16, backgroundColor: orange, borderRadius: 8, padding: 14, alignItems: 'center' as const };
const secondary = { marginTop: 10, backgroundColor: '#0d1c32', borderWidth: 1, borderColor: '#44474d', borderRadius: 8, padding: 14, alignItems: 'center' as const };
const primaryText = { color: '#351000', fontWeight: '900' as const };
const choice = { marginTop: 12, backgroundColor: '#151f37', borderWidth: 1, borderColor: '#44474d', borderRadius: 10, padding: 14, flexDirection: 'row' as const, gap: 12, alignItems: 'center' as const };

function Card({ children }: { children: React.ReactNode }) {
  return <View style={{ backgroundColor: '#101b33', borderWidth: 1, borderColor: '#2a344d', borderRadius: 14, padding: 16, marginTop: 18 }}>{children}</View>;
}

function Metric({ icon, label: itemLabel, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#151f37', padding: 12, borderRadius: 10 }}>
      <Ionicons name={icon} size={22} color={orange} />
      <View>
        <Text style={{ color: '#c5c6cd', fontSize: 12, fontWeight: '800' }}>{itemLabel}</Text>
        <Text style={{ color: 'white', fontWeight: '900' }}>{value}</Text>
      </View>
    </View>
  );
}

function Mini({ title, value }: { title: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#d6e3ff', borderRadius: 12, padding: 14, marginTop: 12 }}>
      <Text style={{ color: '#39475f', fontSize: 12, fontWeight: '900' }}>{title}</Text>
      <Text style={{ color: '#0d1c32', fontSize: 18, fontWeight: '900' }}>{value}</Text>
    </View>
  );
}
