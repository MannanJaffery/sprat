const { Router } = require('express');
const { authenticate } = require('../middleware/auth');

const authRoutes = require('./auth');
const usersRoutes = require('./users');
const userGroupsRoutes = require('./userGroups');
const projectsRoutes = require('./projects');
const auditLogsRoutes = require('./auditLogs');
const aiRoutes = require('./ai');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/user-groups', userGroupsRoutes);
router.use('/projects', authenticate, projectsRoutes);
router.use('/audit-logs', auditLogsRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
