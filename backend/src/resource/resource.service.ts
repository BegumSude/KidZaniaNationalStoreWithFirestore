import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { Resource } from './interfaces/resource.interface';

@Injectable()
export class ResourceService {
    private readonly collectionName = 'resources';
    private readonly logger = new Logger(ResourceService.name);

    constructor(private readonly firebaseService: FirebaseService) { }

    private get collection() {
        return this.firebaseService.getFirestore().collection(this.collectionName);
    }

    async create(createResourceDto: CreateResourceDto): Promise<Resource> {
        try {
            const docRef = this.collection.doc();
            const newResource: Resource = {
                id: docRef.id,
                ...createResourceDto,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await docRef.set(newResource);
            return newResource;
        } catch (error) {
            this.logger.error('Failed to create resource', error);
            throw new InternalServerErrorException('Error creating resource');
        }
    }

    async findAll(): Promise<Resource[]> {
        try {
            const snapshot = await this.collection.get();
            return snapshot.docs.map(doc => doc.data() as Resource);
        } catch (error: any) {
            if (error.message === 'Firebase SDK is not initialized.') {
                this.logger.warn('Firebase is not initialized. Returning mock resources.');
                return [
                    {
                        id: 'mock-1',
                        title: 'Welcome to web.skeleton!',
                        description: 'This is a mock resource. Your frontend and backend are connected successfully!',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        id: 'mock-2',
                        title: 'Next Steps',
                        description: '1. Create a Firebase project. 2. Add Service Account to backend/.env 3. Restart the backend.',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                ];
            }
            this.logger.error('Failed to retrieve resources', error);
            throw new InternalServerErrorException('Error fetching resources');
        }
    }

    async findOne(id: string): Promise<Resource> {
        try {
            const docRef = await this.collection.doc(id).get();
            if (!docRef.exists) {
                throw new NotFoundException(`Resource with ID "${id}" not found`);
            }
            return docRef.data() as Resource;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(`Failed to retrieve resource ${id}`, error);
            throw new InternalServerErrorException('Error fetching resource');
        }
    }

    async update(id: string, updateResourceDto: UpdateResourceDto): Promise<Resource> {
        try {
            const docRef = this.collection.doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new NotFoundException(`Resource with ID "${id}" not found`);
            }

            const updateData = {
                ...updateResourceDto,
                updatedAt: new Date().toISOString(),
            };

            await docRef.update(updateData);

            const updatedDoc = await docRef.get();
            return updatedDoc.data() as Resource;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(`Failed to update resource ${id}`, error);
            throw new InternalServerErrorException('Error updating resource');
        }
    }

    async remove(id: string): Promise<void> {
        try {
            const docRef = this.collection.doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new NotFoundException(`Resource with ID "${id}" not found`);
            }

            await docRef.delete();
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(`Failed to delete resource ${id}`, error);
            throw new InternalServerErrorException('Error deleting resource');
        }
    }
}
