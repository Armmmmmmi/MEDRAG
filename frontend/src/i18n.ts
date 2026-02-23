import { createI18n } from 'vue-i18n'

const messages = {
    en: {
        nav: {
            single: 'Single Pair Data',
            multi: 'Multi Drug Check',
            patient: 'Patient Mode',
            qa: 'Literature Q&A',
            admin: 'Admin Panel'
        },
        common: {
            subtitle: 'DDI Clinical Decision Support System',
            clear: 'Clear',
            screening: 'Screening...',
            error: 'Error',
            none: 'None'
        },
        single: {
            title: 'Single Pair Data',
            desc: 'Check interactions between two specific medications.',
            drugA: 'Drug A',
            drugA_placeholder: 'e.g. Warfarin',
            drugB: 'Drug B',
            drugB_placeholder: 'e.g. Aspirin',
            check: 'Check Interaction',
            results: 'Interaction Details',
            report: 'Interaction Report',
            context: 'Database Context',
            no_context: 'No context provided. Database search did not meet threshold requirements.',
            score: 'Context Match:'
        },
        multi: {
            title: 'Multi Drug Check',
            desc: 'Paste a list of medications. The system will extract drug names and check all possible pairs for interactions.',
            input_label: 'Medication List',
            input_placeholder: 'e.g. Patient is currently taking Warfarin 5mg daily, Aspirin 81mg...',
            wait: 'Processing might take a moment as it checks all possible pairs...',
            screenBtn: 'Screen Medications',
            detected: 'Drugs detected',
            results_title: 'Screening Results'
        },
        patient: {
            title: 'Patient Mode',
            desc: 'Review medications for a specific patient by HN and visit date, then check for interactions.',
            hn: 'Hospital Number (HN)',
            hn_placeholder: 'e.g. 1234567',
            date: 'Visit Date',
            fetch: 'Fetch Medications',
            fetching: 'Fetching...',
            clear: 'Clear Data',
            found: 'Medications Found',
            found_sub: 'Select the drugs you want to include in the interaction screening.',
            selectAll: 'Select All',
            deselectAll: 'Deselect All',
            selectedInfo: 'medications selected for screening',
            runScreen: 'Run Interaction Screen'
        },
        qa: {
            title: 'Literature Q&A',
            desc: 'Ask free-form questions. The system will search the database and construct an answer strictly from the retrieved context.',
            clear: 'Clear Chat',
            placeholder: 'Ask a medical question based on the database...',
            sources: 'Sources Used',
            sourceInfo: 'Source'
        },
        admin: {
            title: 'Admin Panel',
            desc: 'Manage system settings, upload new interaction rules, and monitor database health.',
            config_title: 'System Configuration',
            config_sub: 'Configure connection strings for AI models and external servers.',
            embed_url: 'Embedding Server URL',
            embed_model: 'Embedding Model',
            gen_url: 'Generation Server URL',
            gen_model: 'Generation Model',
            qdrant_url: 'Qdrant Server URL',
            qdrant_col: 'Qdrant Collection Name',
            bridge: 'Bridge Server URL (Patient Mode)',
            sql: 'Patient SQL Template Query',
            sql_desc: 'Variables {HN} and {DATE} will be replaced.',
            save: 'Save Settings',
            import_title: 'Import Data (CSV)',
            import_sub: 'Upload a CSV file with 12 columns to insert into the knowledge base.',
            import_btn: 'Click to Upload CSV',
            export_title: 'Export Data',
            export_sub: 'Download a full JSON backup of the current SQLite database records.',
            export_btn: 'Download JSON Dump',
            reindex_title: 'Re-index Vectors',
            reindex_sub: 'Re-generate vector embeddings for all records using the current embedding model.',
            reindex_btn: 'Force Re-index All',
            db_title: 'Database Records',
            refresh: 'Refresh',
            drugA: 'Drug A',
            drugB: 'Drug B',
            severity: 'Severity',
            date: 'Created At'
        }
    },
    th: {
        nav: {
            single: 'ตรวจสอบคู่ยา (Single)',
            multi: 'ตรวจสอบหลายตัวรับ (Multi)',
            patient: 'ข้อมูลผู้ป่วย (Patient)',
            qa: 'ค้นหาฐานข้อมูล (Q&A)',
            admin: 'ผู้ดูแลระบบ (Admin)'
        },
        common: {
            subtitle: 'ระบบสนับสนุนการตัดสินใจทางคลินิก (DDI)',
            clear: 'ล้างข้อมูล',
            screening: 'กำลังตรวจสอบ...',
            error: 'เกิดข้อผิดพลาด',
            none: 'ไม่มี'
        },
        single: {
            title: 'ตรวจสอบยาคู่เดียว (Single Pair)',
            desc: 'ตรวจสอบปฏิกิริยาระหว่างยาสองชนิดแบบเจาะจง',
            drugA: 'ยา A',
            drugA_placeholder: 'เช่น Warfarin',
            drugB: 'ยา B',
            drugB_placeholder: 'เช่น Aspirin',
            check: 'ตรวจสอบปฏิกิริยา',
            results: 'รายละเอียดปฏิกิริยาอ้างอิง',
            report: 'รายงานปฏิกิริยา',
            context: 'บริบทข้อมูลระดับฐานข้อมูล',
            no_context: 'ไม่มีบริบท ไม่พบข้อมูลตรงตามเงื่อนไขความคล้ายในฐานข้อมูล',
            score: 'ความแม่นยำ (Match):'
        },
        multi: {
            title: 'ตรวจสอบยาหลายตัว (Multi Drug Check)',
            desc: 'วางรายชื่อยา ระบบจะสกัดชื่อยาและตรวจสอบปฏิกิริยาในทุกคู่ที่เป็นไปได้',
            input_label: 'รายการยา',
            input_placeholder: 'ตัวอย่าง: ผู้ป่วยกำลังรับประทานยา Warfarin 5mg, Aspirin 81mg...',
            wait: 'การประมวลผลอาจใช้เวลาระยะหนึ่งเนื่องจากตรวจนับทุกคู่ที่เป็นไปได้...',
            screenBtn: 'ตรวจสอบรายการยา',
            detected: 'ตรวจพบชื่อยา',
            results_title: 'ผลการตรวจสอบ'
        },
        patient: {
            title: 'โหมดดึงข้อมูลผู้ป่วย (Patient Mode)',
            desc: 'ตรวจสอบรายชื่อยาสําหรับผู้ป่วยจากระบบจัดการโรงพยาบาลด้วยรหัส HN และวันที่รับบริการ',
            hn: 'รหัสประจำตัวผู้ป่วย (HN)',
            hn_placeholder: 'เช่น 1234567',
            date: 'วันที่รับบริการ',
            fetch: 'ดึงข้อมูลยา',
            fetching: 'กำลังดึงข้อมูล...',
            clear: 'ล้างข้อมูล',
            found: 'รายการยาที่พบ',
            found_sub: 'เลือกยาที่คุณต้องการรวมไว้ในการคัดกรองปฏิกิริยา',
            selectAll: 'เลือกทั้งหมด',
            deselectAll: 'ยกเลิกทั้งหมด',
            selectedInfo: 'รายการถูกเลือกเพื่อนำไปตรวจสอบ',
            runScreen: 'ตรวจสอบปฏิกิริยาของยาที่เลือก'
        },
        qa: {
            title: 'ค้นหาฐานข้อมูลวิชาการ (Literature Q&A)',
            desc: 'ถามคำถามอิสระ ระบบจะค้นหาฐานข้อมูลและตอบคำถามโดยอิงจากบริบทที่ได้รับเสมอ',
            clear: 'ล้างแชท',
            placeholder: 'พิมพ์คำถามทางการแพทย์เพื่อตรวจสอบฐานข้อมูล...',
            sources: 'แหล่งข้อมูลอ้างอิง',
            sourceInfo: 'แหล่งที่มา'
        },
        admin: {
            title: 'แผงควบคุมระบบ (Admin Panel)',
            desc: 'จัดการการตั้งค่า อัปโหลดกฎข้อบังคับใหม่ และตรวจสอบสถานะฐานข้อมูล',
            config_title: 'การตั้งค่าระบบ',
            config_sub: 'ปรับแต่งเส้นทางการเชื่อมต่อสำหรับโมเดล AI และเซิร์ฟเวอร์ภายนอก',
            embed_url: 'Embedding Server URL',
            embed_model: 'Embedding Model',
            gen_url: 'Generation Server URL',
            gen_model: 'Generation Model',
            qdrant_url: 'Qdrant Server URL',
            qdrant_col: 'Qdrant Collection Name',
            bridge: 'Bridge Server URL (Patient Mode)',
            sql: 'คำสั่ง SQL Template ผู้ป่วย',
            sql_desc: 'ตัวแปร {HN} และ {DATE} จะถูกแทนที่อัตโนมัติ',
            save: 'บันทึกการตั้งค่า',
            import_title: 'นำเข้าข้อมูล (CSV)',
            import_sub: 'อัปโหลดไฟล์ CSV ที่มีโครงสร้าง 12 คอลัมน์ เข้าไปในคลังความรู้',
            import_btn: 'อัปโหลด CSV',
            export_title: 'ส่งออกข้อมูล',
            export_sub: 'ดาวน์โหลดบันทึกทั้งหมดใน SQLite Database ออกมาเป็นไฟล์ JSON',
            export_btn: 'ดาวน์โหลดข้อมูล (JSON Dump)',
            reindex_title: 'สร้างดัชนี Vector ใหม่',
            reindex_sub: 'สร้าง Embedding Vector ใหม่อีกครั้งสำหรับข้อมูลทั้งหมด',
            reindex_btn: 'บังคับสร้างดัชนีใหม่',
            db_title: 'ข้อมูลในฐานข้อมูล',
            refresh: 'รีเฟรช',
            drugA: 'ยา A',
            drugB: 'ยา B',
            severity: 'ระดับความรุนแรง',
            date: 'วันที่สร้าง'
        }
    }
}

export const i18n = createI18n({
    legacy: false, // use Composition API
    locale: 'en', // default
    fallbackLocale: 'en',
    messages,
})
