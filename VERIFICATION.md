# Verification — 9 October 2026

## Automated checks

All four suites pass under Node.js 24.19.0:

- Real SQLite insert, persistence after server restart, retry deduplication and parameterized input containing SQL syntax.
- Invalid input, malformed JSON, oversized requests, unsupported content types, cross-site rejection and rate limiting.
- Private database/source paths blocked, correct static routes, legacy Portfolio redirect, genuine 404 responses and video byte ranges.
- Case-sensitive local page/asset links, absence of merge markers and valid inline/shared JavaScript syntax.

## Browser checks

- An actual sample enquiry was submitted using the contact form and its stored database record was verified using the operator command.
- Contact page has one form, renders its footer and reports confirmed storage.
- Home, About, Services, Portfolio and Contact were navigated after the final runtime fixes with no captured browser errors.
- FAQ click opens the selected answer and closes the previous one.
- Homepage desktop and 390-pixel mobile layouts inspected; mobile navigation opens and its Portfolio link reaches the actual portfolio page.

The test database is outside the release folder and is not included in this package. No changes were made to the live domain. Cloud deployment and email delivery have not been performed. Docker build validation is recorded separately in the delivery message if available.

## Turso update
Eight automated tests now pass, including simulated remote HTTP queries backed by real SQLite, concurrent duplicate prevention, missing credentials, remote failures and retry behavior across server instances. The Turso provider has not been tested against a live account. Frontend browser checks above apply to the unchanged frontend. Email remains disabled.
