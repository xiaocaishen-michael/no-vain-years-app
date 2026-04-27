# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please **do not** open a public GitHub issue.

Use **GitHub Security Advisories** (private disclosure):

- Navigate to the repository's `Security` tab → `Advisories` → `Report a vulnerability`
- Or open this URL directly: https://github.com/xiaocaishen-michael/no-vain-years-app/security/advisories/new

This channel is private until the maintainer publishes the advisory.

## Response SLO

| Stage | Target |
|-------|--------|
| Initial acknowledgement | Within 3 business days |
| Severity assessment | Within 7 business days |
| Fix or mitigation plan | Within 30 business days for High/Critical; best-effort for Medium/Low |
| Public disclosure | Coordinated; default 90 days from initial report unless agreed otherwise |

## Scope

In scope:

- Cross-platform code injection (XSS in Web rendering, deep link / URL scheme exploits on mobile)
- Insecure local storage of authentication tokens or sensitive user data (AsyncStorage / Keychain / Keystore misuse)
- WebView vulnerabilities (if introduced)
- Hardcoded secrets in source code or shipped bundles (gitleaks pre-commit should catch most; report any that slip through)
- OAuth / deep link callback manipulation (Google id_token, WeChat redirect)
- Insecure transport (non-TLS, certificate pinning bypass)
- iOS / Android build artifact misconfiguration (debug symbols leaked, weak code signing, exported activities/intent filters)

Out of scope:

- Vulnerabilities in Expo / React Native / third-party JS dependencies — report upstream and let Dependabot raise a PR here
- Issues on jailbroken / rooted user devices
- Theoretical attacks without proof-of-concept

## Acknowledgements

Researchers who follow this policy and submit valid reports may be credited in the published advisory upon request.
