export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      onboardingComplete?: boolean;
      isVoter?: boolean;
      isAdmin?: boolean;
    };
  }
}
