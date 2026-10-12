# ShopShield AI: shared website scanning

## Outcome
Keep the existing dashboard and extension experience while routing manual and automatic scans through one authenticated analysis-and-save service. Reuse the current scoring rules and report format; do not add a separate application or change the visual direction.

## Work
1. Add a validated, CORS-enabled HTTP scan endpoint for the extension and dashboard. It will verify each caller's existing access token, analyze the URL with the current shared risk engine, and save the scan and indicators for that user. Validate only HTTP/HTTPS URLs and bound request size; return clear auth, validation, and service errors.
2. Update the dashboard scan submission to call this endpoint and retain its current loading, result, report, and history behavior.
3. Update the Manifest V3 extension to use the same endpoint and persist the latest scan state for its popup. Automatically scan eligible shopping pages on navigation/activation, avoid repeat writes during the existing cooldown, and keep manual recheck, in-page alerts, report links, and sign-in behavior.
4. Rebuild the downloadable extension ZIP, then verify route security/error handling, matching analysis output and saved scan shape, package contents, and the preview build.

## Technical details
- Use the existing public/publishable database client only; validate the bearer token server-side and scope inserts to the verified user. Never put service credentials in the extension.
- The current engine is deterministic demonstration logic, not a connected trained ML model or verified live-site/domain intelligence; describe findings accordingly and do not claim verified probability.
- Reuse the existing database tables and RLS. Put source metadata in the existing JSON details field rather than changing database schema.
- Existing report/history pages remain the destinations for saved scans. Preserve current styling and navigation; only update scan wording/states needed to accurately describe the demo analysis.
