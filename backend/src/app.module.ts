import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './firebase/firebase.module';
import { ResourceModule } from './resource/resource.module';

@Module({
    imports: [
        // Load .env files and make ConfigService available globally
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        FirebaseModule,
        ResourceModule,
    ],
})
export class AppModule { }
