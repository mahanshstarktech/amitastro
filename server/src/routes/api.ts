import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import * as authCtrl from '../controllers/authController';
import * as profileCtrl from '../controllers/birthProfileController';
import * as apptCtrl from '../controllers/appointmentController';
import * as payCtrl from '../controllers/paymentController';
import * as chatCtrl from '../controllers/chatController';
import * as trialCtrl from '../controllers/trialController';
import * as blogCtrl from '../controllers/blogController';
import * as adminCtrl from '../controllers/adminController';

const router = Router();

// 1. Auth Routes
router.post('/auth/send-otp', authCtrl.sendOtp);
router.post('/auth/verify-otp', authCtrl.verifyOtp);
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticateToken, authCtrl.getMe);

// 2. Birth Profiles
router.get('/profiles', authenticateToken, profileCtrl.getProfiles);
router.post('/profiles', authenticateToken, profileCtrl.createProfile);
router.put('/profiles/:id', authenticateToken, profileCtrl.updateProfile);
router.delete('/profiles/:id', authenticateToken, profileCtrl.deleteProfile);

// 3. Packages & Availability
router.get('/packages', apptCtrl.getPackages);
router.get('/availability', apptCtrl.getAvailability);

// 4. Appointments
router.post('/appointments', authenticateToken, apptCtrl.createAppointment);
router.get('/appointments/my', authenticateToken, apptCtrl.getMyAppointments);
router.get('/appointments/all', authenticateToken, requireAdmin, apptCtrl.getAllAppointments);
router.patch('/appointments/:id/status', authenticateToken, requireAdmin, apptCtrl.updateAppointmentStatus);

// 5. Payments
router.get('/payments/config', payCtrl.getPaymentConfig);
router.post('/payments/proof', authenticateToken, payCtrl.submitPaymentProof);
router.get('/payments/pending', authenticateToken, requireAdmin, payCtrl.getPendingPayments);
router.post('/payments/:id/verify', authenticateToken, requireAdmin, payCtrl.verifyPayment);
router.post('/payments/:id/reject', authenticateToken, requireAdmin, payCtrl.rejectPayment);

// 6. Chat
router.get('/chat/conversation', authenticateToken, chatCtrl.getOrCreateConversation);
router.post('/chat/message', authenticateToken, chatCtrl.sendMessage);
router.get('/chat/admin/inbox', authenticateToken, requireAdmin, chatCtrl.getAdminInbox);
router.get('/chat/admin/conversation/:conversationId', authenticateToken, requireAdmin, chatCtrl.getAdminConversationDetails);
router.post('/chat/admin/crm/:customerId', authenticateToken, requireAdmin, chatCtrl.updateCustomerCrm);

// 7. Trial
router.get('/trial/status', authenticateToken, trialCtrl.getTrialStatus);
router.post('/trial/deduct', authenticateToken, trialCtrl.deductTrialTime);

// 8. Blog
router.get('/blog/categories', blogCtrl.getCategories);
router.get('/blog/posts', blogCtrl.getPosts);
router.get('/blog/posts/:slug', blogCtrl.getPostBySlug);
router.post('/blog/admin/posts', authenticateToken, requireAdmin, blogCtrl.adminCreatePost);
router.put('/blog/admin/posts/:id', authenticateToken, requireAdmin, blogCtrl.adminUpdatePost);
router.delete('/blog/admin/posts/:id', authenticateToken, requireAdmin, blogCtrl.adminDeletePost);

// 9. Admin Operations
router.get('/admin/dashboard', authenticateToken, requireAdmin, adminCtrl.getDashboardStats);
router.get('/admin/customers', authenticateToken, requireAdmin, adminCtrl.getCustomersCrm);
router.get('/admin/customers/:id', authenticateToken, requireAdmin, adminCtrl.getCustomerDetails);
router.patch('/admin/packages/:id', authenticateToken, requireAdmin, adminCtrl.updatePackage);
router.get('/admin/availability-settings', authenticateToken, requireAdmin, adminCtrl.getAvailabilitySettings);
router.put('/admin/availability-settings', authenticateToken, requireAdmin, adminCtrl.updateAvailabilityRules);
router.post('/admin/blackout-dates', authenticateToken, requireAdmin, adminCtrl.addBlackoutDate);
router.delete('/admin/blackout-dates/:date', authenticateToken, requireAdmin, adminCtrl.removeBlackoutDate);
router.post('/admin/broadcast', authenticateToken, requireAdmin, adminCtrl.sendBroadcast);
router.get('/admin/analytics', authenticateToken, requireAdmin, adminCtrl.getAnalytics);

export default router;
