require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// ── HEALTH CHECK ──
app.get('/', (req, res) => {
  res.json({ status: 'TapLove API is running', version: '1.0.0' });
});

// ── GET BRACELET + LATEST NOTE ──
// Called when someone taps their bracelet
app.get('/api/bracelet/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    // Get bracelet
    const { data: bracelet, error: braceletError } = await supabase
      .from('bracelets')
      .select('*')
      .eq('slug', slug)
      .single();

    if (braceletError || !bracelet) {
      return res.status(404).json({ error: 'Bracelet not found' });
    }

    // Get latest live note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('bracelet_id', bracelet.id)
      .eq('status', 'live')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get recent archived notes (last 3)
    const { data: recentNotes } = await supabase
      .from('notes')
      .select('*')
      .eq('bracelet_id', bracelet.id)
      .eq('status', 'live')
      .order('created_at', { ascending: false })
      .range(1, 3);

    return res.json({
      bracelet,
      currentNote: note || null,
      recentNotes: recentNotes || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST REACTION ──
// Called when wearer reacts to a note
app.post('/api/reaction', async (req, res) => {
  const { note_id, emoji, message } = req.body;

  if (!note_id || !emoji) {
    return res.status(400).json({ error: 'note_id and emoji are required' });
  }

  try {
    const { data, error } = await supabase
      .from('reactions')
      .insert([{ note_id, emoji, message: message || null }])
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, reaction: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET ALL NOTES FOR PORTAL ──
app.get('/api/portal/:slug/notes', async (req, res) => {
  const { slug } = req.params;
  const { filter } = req.query; // all, live, scheduled, draft

  try {
    const { data: bracelet, error: braceletError } = await supabase
      .from('bracelets')
      .select('id, wearer_name, wearer_email')
      .eq('slug', slug)
      .single();

    if (braceletError || !bracelet) {
      return res.status(404).json({ error: 'Bracelet not found' });
    }

    let query = supabase
      .from('notes')
      .select('*')
      .eq('bracelet_id', bracelet.id)
      .order('created_at', { ascending: false });

    if (filter && filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data: notes, error: notesError } = await query;
    if (notesError) throw notesError;

    return res.json({ bracelet, notes: notes || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST NEW NOTE ──
app.post('/api/portal/:slug/notes', async (req, res) => {
  const { slug } = req.params;
  const { author_name, content, status, scheduled_at } = req.body;

  if (!author_name || !content) {
    return res.status(400).json({ error: 'author_name and content are required' });
  }

  try {
    const { data: bracelet, error: braceletError } = await supabase
      .from('bracelets')
      .select('id')
      .eq('slug', slug)
      .single();

    if (braceletError || !bracelet) {
      return res.status(404).json({ error: 'Bracelet not found' });
    }

    const { data, error } = await supabase
      .from('notes')
      .insert([{
        bracelet_id: bracelet.id,
        author_name,
        content,
        status: status || 'live',
        scheduled_at: scheduled_at || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, note: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET REACTIONS FOR PORTAL ──
app.get('/api/portal/:slug/reactions', async (req, res) => {
  const { slug } = req.params;

  try {
    const { data: bracelet } = await supabase
      .from('bracelets')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!bracelet) return res.status(404).json({ error: 'Bracelet not found' });

    const { data: notes } = await supabase
      .from('notes')
      .select('id')
      .eq('bracelet_id', bracelet.id);

    if (!notes || notes.length === 0) return res.json({ reactions: [] });

    const noteIds = notes.map(n => n.id);

    const { data: reactions, error } = await supabase
      .from('reactions')
      .select('*, notes(author_name, content)')
      .in('note_id', noteIds)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return res.json({ reactions: reactions || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DEMO LOGIN ──
// Simple demo auth — not for production
app.post('/api/auth/demo', (req, res) => {
  const { username, password } = req.body;
  if (username === 'demo' && password === 'taplove2026') {
    return res.json({
      success: true,
      token: 'demo-token-taplove',
      bracelet_slug: 'demo',
      owner_name: 'Adam',
    });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.listen(PORT, () => {
  console.log(`TapLove API running on port ${PORT}`);
});
