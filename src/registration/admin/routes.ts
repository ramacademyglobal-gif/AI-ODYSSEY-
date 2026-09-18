export const ROUTES = {
  home: "/",
  register: "/register",
  admin: "/admin",
  adminLogin: "/admin/login",
  adminParticipants: "/admin/participants",
  adminCheckin: "/admin/checkin",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
