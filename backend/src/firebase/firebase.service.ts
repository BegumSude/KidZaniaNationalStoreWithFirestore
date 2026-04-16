import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnApplicationBootstrap {
    private readonly logger = new Logger(FirebaseService.name);
    private firestore!: admin.firestore.Firestore;

    constructor(private readonly configService: ConfigService) { }

    onApplicationBootstrap() {
        this.initialize();
    }

    private initialize() {
        if (admin.apps.length > 0) {
            return;
        }

        const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
        const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
        const privateKeyString = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

        if (
            !projectId || projectId.includes('your-') ||
            !clientEmail || clientEmail.includes('your-') ||
            !privateKeyString || privateKeyString.includes('YOUR_')
        ) {
            this.logger.warn('Firebase Admin credentials are not fully configured. Using mock data mode.');
            return;
        }

        // Handle escaped newlines in the private key from .env file
        const privateKey = privateKeyString.replace(/\\n/g, '\n');

        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });

            this.firestore = admin.firestore();

            // Attempt to ignore undefined properties setting in Firestore to prevent errors when dealing with JS objects
            this.firestore.settings({ ignoreUndefinedProperties: true });

            this.logger.log('Firebase Admin SDK initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Firebase Admin SDK', error);
            throw error;
        }
    }

    getFirestore(): admin.firestore.Firestore {
        if (!this.firestore) {
            if (admin.apps.length > 0) {
                this.firestore = admin.firestore();
            } else {
                throw new Error('Firebase SDK is not initialized.');
            }
        }
        return this.firestore;
    }
}
