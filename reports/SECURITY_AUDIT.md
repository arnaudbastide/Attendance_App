# Security Audit Summary

## Scope
Self-service registration flow in `backend/controllers/authController.js` and registration validation in `backend/utils/validators.js`.

## Findings
1. **Privilege escalation via registration role override**
   - The public `/api/auth/register` endpoint accepted a `role` field and passed it directly into `User.create`, allowing unauthenticated sign-ups to create `admin` or `manager` accounts.
   - Attackers could bypass authorization by registering with elevated roles, gaining full access to protected resources.

## Remediation
- Registration validation now explicitly forbids `role` and `managerId` inputs to prevent clients from supplying privilege-related fields.
- The registration handler always assigns new users the default `employee` role and ignores any attempt to override it.

## Recommendations
- Keep registration strictly scoped to least-privilege defaults unless an authenticated administrator performs the creation.
- Consider adding automated tests to enforce that privileged roles cannot be set during public sign-up.
