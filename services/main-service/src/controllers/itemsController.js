const { body, param } = require('express-validator');
const { getSupabase } = require('../config/supabase');
const redis = require('../config/redis');

// Sample CRUD resource backed by Supabase (Postgres) — replace `items` with
// your actual hackathon domain model. Table expected:
//   create table items (
//     id uuid primary key default gen_random_uuid(),
//     owner_id text not null,
//     title text not null,
//     body text,
//     created_at timestamptz default now()
//   );

const createValidators = [body('title').trim().isLength({ min: 1, max: 200 }), body('body').optional().isString()];
const idValidators = [param('id').isUUID()];

async function list(req, res, next) {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(503).json({ error: { message: 'Supabase not configured', code: 'SUPABASE_UNAVAILABLE', requestId: req.id } });
    const { data, error } = await supabase.from('items').select('*').eq('owner_id', req.user.id).order('created_at', { ascending: false });
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    return res.status(200).json({ items: data });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(503).json({ error: { message: 'Supabase not configured', code: 'SUPABASE_UNAVAILABLE', requestId: req.id } });
    const { title, body: content } = req.body;
    const { data, error } = await supabase.from('items').insert({ title, body: content, owner_id: req.user.id }).select().single();
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    await invalidateListCache(req.user.id);
    return res.status(201).json({ item: data });
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(503).json({ error: { message: 'Supabase not configured', code: 'SUPABASE_UNAVAILABLE', requestId: req.id } });
    const { error } = await supabase.from('items').delete().eq('id', req.params.id).eq('owner_id', req.user.id);
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    await invalidateListCache(req.user.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

async function invalidateListCache(userId) {
  try {
    const keys = await redis.keys(`cache:/api/items*:${userId}`);
    if (keys.length) await redis.del(keys);
  } catch {
    // best-effort — cache will simply expire via TTL if this fails
  }
}

module.exports = { list, create, remove, createValidators, idValidators };
