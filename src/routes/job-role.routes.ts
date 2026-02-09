import express, { Router } from 'express';
import { JobRoleController } from '../controllers/job-role.controller';

const router: Router = express.Router();
const jobRoleController = new JobRoleController();

router.get('/job-roles', (req, res) => jobRoleController.getJobRoles(req, res));

export default router;
