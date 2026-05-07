UPDATE "User" SET "isPendingApproval" = false, "isActive" = true WHERE "role" = 'ADMIN';
UPDATE "User" SET "isPendingApproval" = false, "isActive" = true WHERE "email" = 'user@test.com';
