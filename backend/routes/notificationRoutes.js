const express = require('express');
const router = express.Router();
const { 
    getMyAlerts, 
    markAlertRead, 
    markAllAlertsRead, 
    getMyNotificationPreferences, 
    saveMyNotificationPreferences,
    addAlert
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All notification routes require authentication

router.route('/alerts')
    .get(getMyAlerts)
    .post(addAlert); // Add a new alert

router.post('/alerts/mark-all-read', markAllAlertsRead);
router.post('/alerts/:alertId/mark-read', markAlertRead);


router.route('/preferences')
    .get(getMyNotificationPreferences)
    .post(saveMyNotificationPreferences);

module.exports = router;