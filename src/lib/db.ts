import Dexie, { type Table } from 'dexie';
import type { Assessment, AssessmentLog } from './types';

export class PropagateDigitalLocalDB extends Dexie {
  assessments!: Table<Assessment>;
  assessment_logs!: Table<AssessmentLog>;

  constructor() {
    super('PropagateDigital_Local');
    this.version(1).stores({
      assessments: 'assessment_id, title, type, is_offline_enabled', // Primary key: assessment_id
      assessment_logs: 'log_id, user_id, assessment_id, sync_status',    // Primary key: log_id
    });
  }
}

export const localDb = new PropagateDigitalLocalDB();
