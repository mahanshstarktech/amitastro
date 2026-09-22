import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import { getAll, getOne, runQuery } from '../db/database';

export const getOrCreateConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    let conversation = await getOne<any>('SELECT * FROM chat_conversations WHERE customer_id = ?', [userId]);

    if (!conversation) {
      const convId = `conv-${uuidv4().substring(0, 8)}`;
      await runQuery(`
        INSERT INTO chat_conversations (id, customer_id, admin_id)
        VALUES (?, ?, 'admin-amit-soni')
      `, [convId, userId]);

      // Add welcoming message from Amit
      await runQuery(`
        INSERT INTO chat_messages (id, conversation_id, sender_type, sender_id, message_type, content, is_read)
        VALUES (?, ?, 'admin', 'admin-amit-soni', 'text', 'Namaste! I am Amit. Welcome to Amit Astro. You can share your queries or photos of your palm/kundli here.', 1)
      `, [`msg-${uuidv4().substring(0, 8)}`, convId]);

      conversation = await getOne<any>('SELECT * FROM chat_conversations WHERE id = ?', [convId]);
    }

    const messages = await getAll<any>(
      'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversation.id]
    );

    // Mark messages as read for customer
    await runQuery(`
      UPDATE chat_messages SET is_read = 1 
      WHERE conversation_id = ? AND sender_type = 'admin'
    `, [conversation.id]);

    await runQuery('UPDATE chat_conversations SET unread_customer_count = 0 WHERE id = ?', [conversation.id]);

    return res.json({ conversation, messages });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const sender = req.user!;
    const { conversationId, content, messageType, attachmentUrl } = req.body;

    if (!content && !attachmentUrl) {
      return res.status(400).json({ error: 'Message content or attachment is required' });
    }

    const conversation = await getOne<any>('SELECT * FROM chat_conversations WHERE id = ?', [conversationId]);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if locked due to trial expiration
    if (conversation.is_locked && sender.role !== 'admin') {
      return res.status(403).json({
        error: 'Your trial chat budget has expired. Please upgrade to a consultation package to continue chatting.'
      });
    }

    const msgId = `msg-${uuidv4().substring(0, 8)}`;
    const senderType = sender.role === 'admin' ? 'admin' : 'customer';

    await runQuery(`
      INSERT INTO chat_messages (id, conversation_id, sender_type, sender_id, message_type, content, attachment_url, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [msgId, conversationId, senderType, sender.id, messageType || 'text', content || '', attachmentUrl || null]);

    // Update conversation timestamp and unread counts
    if (senderType === 'customer') {
      await runQuery(`
        UPDATE chat_conversations 
        SET last_message_at = datetime('now'), unread_admin_count = unread_admin_count + 1
        WHERE id = ?
      `, [conversationId]);
    } else {
      await runQuery(`
        UPDATE chat_conversations 
        SET last_message_at = datetime('now'), unread_customer_count = unread_customer_count + 1
        WHERE id = ?
      `, [conversationId]);
    }

    const message = await getOne<any>('SELECT * FROM chat_messages WHERE id = ?', [msgId]);
    return res.status(201).json({ success: true, message });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAdminInbox = async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await getAll<any>(`
      SELECT 
        c.*,
        u.name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email,
        u.trial_used,
        u.trial_seconds_remaining,
        crm.internal_notes,
        crm.tags_json,
        (SELECT content FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_text,
        (SELECT created_at FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
      FROM chat_conversations c
      JOIN users u ON c.customer_id = u.id
      LEFT JOIN customer_crm_meta crm ON crm.user_id = u.id
      ORDER BY c.last_message_at DESC
    `);

    return res.json({ conversations });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAdminConversationDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;

    const conversation = await getOne<any>(`
      SELECT c.*, u.id as user_id, u.name, u.phone, u.email, u.trial_used, u.trial_seconds_remaining,
             crm.internal_notes, crm.tags_json
      FROM chat_conversations c
      JOIN users u ON c.customer_id = u.id
      LEFT JOIN customer_crm_meta crm ON crm.user_id = u.id
      WHERE c.id = ?
    `, [conversationId]);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await getAll<any>(
      'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversationId]
    );

    // Fetch customer 360 data
    const birthProfiles = await getAll<any>(
      'SELECT * FROM birth_profiles WHERE user_id = ? ORDER BY created_at ASC',
      [conversation.user_id]
    );

    const appointments = await getAll<any>(`
      SELECT a.*, p.name as package_name, p.price, p.duration_minutes
      FROM appointments a
      JOIN packages p ON a.package_id = p.id
      WHERE a.customer_id = ?
      ORDER BY a.created_at DESC
    `, [conversation.user_id]);

    const payments = await getAll<any>(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC',
      [conversation.user_id]
    );

    // Mark as read for admin
    await runQuery(`
      UPDATE chat_messages SET is_read = 1 
      WHERE conversation_id = ? AND sender_type = 'customer'
    `, [conversationId]);

    await runQuery('UPDATE chat_conversations SET unread_admin_count = 0 WHERE id = ?', [conversationId]);

    return res.json({
      conversation,
      messages,
      customer360: {
        birthProfiles,
        appointments,
        payments,
        notes: conversation.internal_notes || '',
        tags: JSON.parse(conversation.tags_json || '[]')
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateCustomerCrm = async (req: AuthRequest, res: Response) => {
  try {
    const { customerId } = req.params;
    const { notes, tags } = req.body;

    await runQuery(`
      INSERT INTO customer_crm_meta (user_id, internal_notes, tags_json, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        internal_notes = COALESCE(?, internal_notes),
        tags_json = COALESCE(?, tags_json),
        updated_at = datetime('now')
    `, [customerId, notes || '', JSON.stringify(tags || []), notes || '', JSON.stringify(tags || [])]);

    return res.json({ success: true, message: 'CRM metadata updated' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
