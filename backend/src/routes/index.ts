import { Router } from 'express';
import { getStatus } from '../controllers/statusController';

import { getSingleInteraction } from '../controllers/interactionController';
import { getMultiInteraction } from '../controllers/multiController';
import { fetchPatientDrugs } from '../controllers/patientController';
import { importCsv, exportData, runReindex, getRecords, getSettings, updateSettings } from '../controllers/adminController';
import { ragQA } from '../controllers/ragController';
import { login, verifyToken } from '../controllers/authController';
import { getHistory } from '../controllers/historyController';
import { suggestDrugs } from '../controllers/drugController';
import { requireAdmin } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

const upload = multer({ dest: path.join(__dirname, '..', '..', 'data', 'uploads') });

const router = Router();

router.get('/status', getStatus);

router.post('/interaction/single', getSingleInteraction);
router.post('/interaction/multi', getMultiInteraction);
router.post('/patient/fetch', fetchPatientDrugs);
router.post('/rag/qa', ragQA);

// History routes (Public per requirements)
router.get('/history', getHistory);

// Drug Autocomplete routes
router.get('/drugs/suggest', suggestDrugs);

// Auth routes
router.post('/auth/login', login);
router.post('/auth/verify', requireAdmin, verifyToken);

// Admin routes (Protected)
router.post('/admin/import', requireAdmin, upload.single('file'), importCsv);
router.get('/admin/export', requireAdmin, exportData);
router.post('/admin/reindex', requireAdmin, runReindex);
router.get('/admin/records', requireAdmin, getRecords);
router.get('/admin/settings', requireAdmin, getSettings);
router.post('/admin/settings', requireAdmin, updateSettings);

export default router;
