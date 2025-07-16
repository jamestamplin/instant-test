import { init } from '@instantdb/react';
import schema from "../instant.schema";

const APP_ID = "0d0e44a9-b57a-43ed-ac52-6685304c0f41";
const db = init({ appId: APP_ID, schema });

export default db;