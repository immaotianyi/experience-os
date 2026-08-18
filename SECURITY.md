# Security Policy

## Supported Version

EOS is currently an Alpha. Security fixes are applied to the latest `3.0.0-alpha.x` release only.

## Reporting a Vulnerability

Use this repository's **Security → Advisories → New draft security advisory** flow. Do not open a public issue for an unpatched vulnerability.

Include:

- the affected version or commit;
- the smallest reproducible scenario;
- the expected and observed security boundary;
- whether local Vault data, credentials, process execution or cross-user data is involved.

Do not include real API keys, passwords, private chat transcripts or personal data. Replace them with synthetic examples.

## Security Boundaries

- Local mode binds to `127.0.0.1` by default and treats that loopback boundary as a trusted single-user environment.
- Remote deployments must put an authenticating reverse proxy in front of EOS and inject the canonical `x-eos-identity` header.
- EOS does not provide account sessions, JWT issuance or public multi-tenant isolation yet.
- Strict capture permits are required when `EOS_CAPTURE_POLICY=strict_permit`.
- Raw collaboration content and credentials must not be included in Beta feedback.
