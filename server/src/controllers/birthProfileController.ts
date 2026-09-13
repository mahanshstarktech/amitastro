import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import { getAll, getOne, runQuery } from '../db/database';

export const getProfiles = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const profiles = await getAll<any>(
      'SELECT * FROM birth_profiles WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    );
    return res.json({ profiles });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { relation, fullName, dob, tob, tobUncertain, pob, pobLat, pobLng, pobTimezone } = req.body;

    if (!fullName || !dob || !pob) {
      return res.status(400).json({ error: 'Full name, date of birth, and place of birth are required' });
    }

    const profileId = `bp-${uuidv4().substring(0, 8)}`;
    await runQuery(`
      INSERT INTO birth_profiles (
        id, user_id, relation, full_name, dob, tob, tob_uncertain, pob, pob_lat, pob_lng, pob_timezone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      profileId,
      userId,
      relation || 'self',
      fullName,
      dob,
      tob || '12:00',
      tobUncertain ? 1 : 0,
      pob,
      pobLat || null,
      pobLng || null,
      pobTimezone || 'Asia/Kolkata'
    ]);

    const created = await getOne<any>('SELECT * FROM birth_profiles WHERE id = ?', [profileId]);
    return res.status(201).json({ success: true, profile: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { relation, fullName, dob, tob, tobUncertain, pob, pobLat, pobLng, pobTimezone } = req.body;

    const existing = await getOne<any>('SELECT * FROM birth_profiles WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Birth profile not found' });
    }

    await runQuery(`
      UPDATE birth_profiles SET
        relation = ?,
        full_name = ?,
        dob = ?,
        tob = ?,
        tob_uncertain = ?,
        pob = ?,
        pob_lat = ?,
        pob_lng = ?,
        pob_timezone = ?
      WHERE id = ?
    `, [
      relation || existing.relation,
      fullName || existing.full_name,
      dob || existing.dob,
      tob || existing.tob,
      tobUncertain !== undefined ? (tobUncertain ? 1 : 0) : existing.tob_uncertain,
      pob || existing.pob,
      pobLat !== undefined ? pobLat : existing.pob_lat,
      pobLng !== undefined ? pobLng : existing.pob_lng,
      pobTimezone || existing.pob_timezone,
      id
    ]);

    const updated = await getOne<any>('SELECT * FROM birth_profiles WHERE id = ?', [id]);
    return res.json({ success: true, profile: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await runQuery('DELETE FROM birth_profiles WHERE id = ? AND user_id = ?', [id, userId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Birth profile not found' });
    }

    return res.json({ success: true, message: 'Profile deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
