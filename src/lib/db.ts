import Dexie, { type Table } from 'dexie';
import type { Assessment, AssessmentLog } from './types';

export class PropagateDigitalLocalDB extends Dexie {
  assessments!: Table<Assessment>;
  assessment_logs!: Table<AssessmentLog>;

  constructor() {
    super('PropagateDigital_Local');
    this.version(1).stores({
      assessments: 'assessment_id, title, type, is_offline_enabled',
      assessment_logs: '++log_id, user_id, assessment_id, sync_status',
    });
  }
}

export const localDb = new PropagateDigitalLocalDB();
