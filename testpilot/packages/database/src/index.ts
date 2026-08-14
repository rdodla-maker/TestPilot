export * from './types.js';
export * from './repository.js';
export * from './in-memory-repository.js';
export * from './prisma-repository.js';
export * from './profile-service.js';

import { PrismaClient } from '@prisma/client';
import { InMemoryProfileRepository } from './in-memory-repository.js';
import { PrismaProfileRepository } from './prisma-repository.js';
import { ApplicationProfileService } from './profile-service.js';

export function createDefaultApplicationProfileService(): ApplicationProfileService {
	if (process.env.DATABASE_URL) {
		return new ApplicationProfileService(new PrismaProfileRepository(new PrismaClient()));
	}
	return new ApplicationProfileService(new InMemoryProfileRepository());
}