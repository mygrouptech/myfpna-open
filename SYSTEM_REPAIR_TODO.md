# System Repair & Unification Plan

## Phase 1: Revert Magic Link & Restore Manus OAuth
- [ ] Remove magic link database table (magic_link_tokens)
- [ ] Remove magic link routes (/api/auth/magic-link/*)
- [ ] Remove magic link database helpers (server/magiclink-db.ts)
- [ ] Remove magic link sign-in pages (SignIn.tsx, MagicLinkVerify.tsx)
- [ ] Restore original OAuth sign-in flow
- [ ] Update landing page to use OAuth login URL
- [ ] Remove magic link FAQ entries
- [ ] Test OAuth flow on dev server

## Phase 2: Fix Navigation & Empty Shells
- [ ] Add back button to all subpages (Resources, Partners)
- [ ] Complete Resources page with actual content or remove
- [ ] Complete Partners page with actual content or remove
- [ ] Fix all "Learn More" links - either add content or show "Coming Soon" toast
- [ ] Fix demo section - add actual screenshots or working placeholder
- [ ] Ensure all pages have escape routes (back to home)
- [ ] Test all navigation flows

## Phase 3: End-to-End Testing
- [ ] Test landing page on dev server
- [ ] Test OAuth sign-in flow on dev server
- [ ] Test dashboard access after authentication
- [ ] Test scenario creation workflow
- [ ] Test budget management
- [ ] Test forecasting features
- [ ] Test analytics dashboard
- [ ] Test donation flow
- [ ] Test all navigation paths
- [ ] Test logout and re-login

## Phase 4: Deployment Documentation
- [ ] Create CUSTOM_DOMAIN_OAUTH_SETUP.md with step-by-step instructions
- [ ] Document how to configure OAuth redirect URI for custom domain
- [ ] Document production deployment checklist
- [ ] Create user guide for first-time setup
- [ ] Document email list export process

## Phase 5: Final Delivery
- [ ] Run all tests (pnpm test)
- [ ] Check TypeScript compilation (pnpm tsc --noEmit)
- [ ] Commit all changes to Git
- [ ] Push to GitHub
- [ ] Create final checkpoint
- [ ] Generate deployment report for user
