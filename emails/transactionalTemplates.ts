export const transactionalTemplates = {
  signupVerification: (verifyLink: string) => `
    <h1>Welcome to KickExpert!</h1>
    <p>Please verify your email by clicking the button below:</p>
    <a href="${verifyLink}" style="background:#0070f3;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">Verify Email</a>
  `,
  passwordReset: (resetLink: string) => `
    <h1>Password Reset</h1>
    <p>Click below to reset your password:</p>
    <a href="${resetLink}" style="background:#ff5722;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">Reset Password</a>
  `,

  testCheck: () => `
    <h1>Test Check</h1>
        <h1>Test Check</h1>

  `,
};
