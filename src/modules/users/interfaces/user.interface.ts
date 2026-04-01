export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl: null;
  puublicImageUrl: null;
  role: string;
  createdAt: Date;
  stripeCustomerId: null;
}
