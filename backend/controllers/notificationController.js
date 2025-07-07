
const notificationServiceBackend = require('../services/notificationServiceBackend');

const getMyAlerts = async (req, res, next) => {
  try {
    const alerts = await notificationServiceBackend.getAlertsForUser(req.user.id); // req.user.id from 'protect' middleware
    res.json(alerts);
  } catch (error) { next(error); }
};

const markAlertRead = async (req, res, next) => {
  try {
    const success = await notificationServiceBackend.markAlertAsReadForUser(req.user.id, req.params.alertId);
    if (!success) { res.status(404); throw new Error('Alert not found or not accessible by user.'); }
    res.status(200).json({ message: 'Alert marked as read' });
  } catch (error) { next(error); }
};

const markAllAlertsRead = async (req, res, next) => {
  try {
    await notificationServiceBackend.markAllAlertsAsReadForUser(req.user.id);
    res.status(200).json({ message: 'All alerts marked as read' });
  } catch (error) { next(error); }
};

const getMyNotificationPreferences = async (req, res, next) => {
  try {
    const prefs = await notificationServiceBackend.getUserPreferences(req.user.id);
    const subs = await notificationServiceBackend.getScheduledSubscriptions(req.user.id);
    res.json({ alertPreferences: prefs, scheduledReportSubscriptions: subs });
  } catch (error) { next(error); }
};

const saveMyNotificationPreferences = async (req, res, next) => {
  const { alertPreferences, scheduledReportSubscriptions } = req.body;
  if (!Array.isArray(alertPreferences) || !Array.isArray(scheduledReportSubscriptions)) {
    res.status(400); return next(new Error('Invalid preferences format. Expects alertPreferences and scheduledReportSubscriptions arrays.'));
  }
  try {
    await notificationServiceBackend.saveUserPreferences(req.user.id, alertPreferences);
    await notificationServiceBackend.saveScheduledSubscriptions(req.user.id, scheduledReportSubscriptions);
    res.status(200).json({ message: 'Notification preferences saved' });
  } catch (error) { next(error); }
};

const addAlert = async (req, res, next) => {
    try {
        const { severity, message, type, detailsLink } = req.body;
        if (!severity || !message || !type) {
            res.status(400);
            return next(new Error('Severity, message, and type are required to create an alert.'));
        }
        // Alerts created via this endpoint are system-wide (user_id = null)
        const newAlert = await notificationServiceBackend.addSystemAlert({
            severity, message, type, detailsLink, userId: null
        });
        res.status(201).json(newAlert);
    } catch (error) {
        next(error);
    }
};

module.exports = { getMyAlerts, markAlertRead, markAllAlertsRead, getMyNotificationPreferences, saveMyNotificationPreferences, addAlert };