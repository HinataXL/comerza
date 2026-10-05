ALTER TABLE "User" ADD COLUMN reset_password_token VARCHAR(255);
ALTER TABLE "User" ADD COLUMN reset_password_token_expiry TIMESTAMP;
