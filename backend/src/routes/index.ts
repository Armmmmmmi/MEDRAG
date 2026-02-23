import { Router } from 'express';
import { getStatus } from '../controllers/statusController';

import { getSingleInteraction } from '../controllers/interactionController';
import { getMultiInteraction } from '../controllers/multiController';
import { fetchPatientDrugs } from '../controllers/patientController';
import { importCsv, exportData, runReindex, getRecords, getSettings, updateSettings } from '../controllers/adminController';
import { ragQA } from '../controllers/ragController';
import multer from 'multer';
import path from 'path';

const upload = multer({ dest: path.join(__dirname, '..', '..', 'data', 'uploads') });

const router = Router();

router.get('/status', getStatus);

router.post('/interaction/single', getSingleInteraction);
router.post('/interaction/multi', getMultiInteraction);
router.post('/patient/fetch', fetchPatientDrugs);
router.post('/rag/qa', ragQA);

router.post('/admin/import', upload.single('file'), importCsv);
router.get('/admin/export', exportData);
router.post('/admin/reindex', runReindex);
router.get('/admin/records', getRecords);
router.get('/admin/settings', getSettings);
router.post('/admin/settings', updateSettings);

export default router;
