// One motion vocabulary for the whole site. Every animation should use
// these curves and durations so the page feels choreographed by one hand.

export const ease = {
  out: [0.22, 1, 0.36, 1],
  expo: [0.16, 1, 0.3, 1],
  in: [0.7, 0, 0.84, 0],
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const duration = {
  hover: 0.3,
  ui: 0.4,
  reveal: 0.65,
  heading: 0.85,
  hero: 0.95,
} as const;

// Shared whileInView viewport: fire once, a little before fully in view.
export const inView = {
  once: true,
  amount: 0.2,
  margin: "0px 0px -8% 0px",
} as const;
