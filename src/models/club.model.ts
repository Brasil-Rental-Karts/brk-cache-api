// Club entity model
export interface Club {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  foundationDate: string | null;
  description: string | null;
  logoUrl: string | null;
  ownerId: string;
  _timestamp: number;
}

// Redis key pattern for clubs
export const CLUB_KEY_PREFIX = 'clubs:';

// Generate Redis key for a club
export const generateClubKey = (id: string): string => `${CLUB_KEY_PREFIX}${id}`;

// Parse Redis key to extract entity ID
export const parseClubKey = (key: string): string => {
  if (key.startsWith(CLUB_KEY_PREFIX)) {
    return key.substring(CLUB_KEY_PREFIX.length);
  }
  return key;
};