-- Audit Log table for HIPAA/GDPR compliance
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('create', 'update', 'delete')),
    old_values TEXT,
    new_values TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    user_context TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);