-- App-owned scheduling metadata. JMAP remains the source of truth for mail.
CREATE TABLE IF NOT EXISTS mail_jobs (
  id uuid PRIMARY KEY,
  user_id text NOT NULL,
  account_id text NOT NULL,
  request_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('send', 'snooze')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'completed', 'failed', 'needs_review', 'cancelled')),
  run_at timestamptz NOT NULL,
  payload_ciphertext text NOT NULL,
  credential_ciphertext text NOT NULL,
  error text,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, account_id, request_id)
);
CREATE INDEX IF NOT EXISTS mail_jobs_due ON mail_jobs (run_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS mail_jobs_owner ON mail_jobs (user_id, account_id, created_at DESC);

-- One current refresh token per account, shared by all of its queued jobs.
CREATE TABLE IF NOT EXISTS mail_job_credentials (
  user_id text NOT NULL,
  account_id text NOT NULL,
  credential_ciphertext text NOT NULL,
  expires_at bigint NOT NULL,
  PRIMARY KEY (user_id, account_id)
);
