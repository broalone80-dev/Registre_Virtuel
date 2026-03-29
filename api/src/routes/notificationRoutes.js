const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', notificationController.getUserNotifications);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markAsRead);
router.post('/send', notificationController.sendNotification);

module.exports = router;
