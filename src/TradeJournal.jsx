import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function TradeJournal() {
  const [trades, setTrades] = useState([]);
  const [form, setForm] = useState({
    date: '', ticker: '', direction: '', entry: '', exit: '', pnl: '', notes: ''
  });

  useEffect(() => { fetchTrades(); }, []);

  const fetchTrades = async () => {
    const { data, error } = await supabase.from('trades').select('*').order('date', { ascending: true });
    if (!error) setTrades(data);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addTrade = async () => {
    if (form.ticker && form.entry && form.exit) {
      const tradeWithUser = { ...form, user_id: null };
      const { error } = await supabase.from('trades').insert([tradeWithUser]);
      if (!error) setTrades([...trades, tradeWithUser]);
      setForm({ date: '', ticker: '', direction: '', entry: '', exit: '', pnl: '', notes: '' });
    }
  };

  const importCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const enhanced = results.data.map((t) => ({ ...t, user_id: null }));
        const { error } = await supabase.from('trades').insert(enhanced);
        if (!error) setTrades([...trades, ...enhanced]);
      },
    });
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <input name="date" placeholder="Date" value={form.date} onChange={handleChange} />
        <input name="ticker" placeholder="Ticker" value={form.ticker} onChange={handleChange} />
        <input name="direction" placeholder="Long/Short" value={form.direction} onChange={handleChange} />
        <input name="entry" placeholder="Entry Price" value={form.entry} onChange={handleChange} />
        <input name="exit" placeholder="Exit Price" value={form.exit} onChange={handleChange} />
        <input name="pnl" placeholder="P&L ($)" value={form.pnl} onChange={handleChange} />
        <input name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} />
        <button onClick={addTrade}>Add Trade</button>
        <input type="file" accept=".csv" onChange={importCSV} />
      </div>
      <table border="1" cellPadding="4" style={{ width: '100%', marginBottom: '2rem' }}>
        <thead><tr><th>Date</th><th>Ticker</th><th>Dir</th><th>Entry</th><th>Exit</th><th>P&L</th><th>Notes</th></tr></thead>
        <tbody>{trades.map((t, i) => (<tr key={i}><td>{t.date}</td><td>{t.ticker}</td><td>{t.direction}</td><td>{t.entry}</td><td>{t.exit}</td><td>{t.pnl}</td><td>{t.notes}</td></tr>))}</tbody>
      </table>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trades.map((t) => ({ name: `${t.ticker} ${t.date}`, pnl: parseFloat(t.pnl || 0) }))}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="pnl" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}