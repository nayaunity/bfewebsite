-- Tracks when a paying user completed the mandatory self-identification
-- (EEO + work-authorization) step at /onboarding/self-identification.
-- Used to gate /profile and /profile/applications so users who bail
-- mid-flow get redirected back.
ALTER TABLE "User" ADD COLUMN "selfIdCompletedAt" DATETIME;
