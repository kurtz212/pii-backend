import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// Centralise la configuration de connexion à PostgreSQL. `synchronize`
// est activé uniquement en développement pour que les entités créent
// automatiquement leurs tables — en production, on utilisera de vraies
// migrations TypeORM pour ne jamais risquer de perte de données.
export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    autoLoadEntities: true,
    synchronize: process.env.NODE_ENV !== 'production',
    logging: false,
    // Le pool par défaut (10 connexions) sature vite sous charge —
    // on l'augmente largement, tout en restant bien en dessous de la
    // limite PostgreSQL (100).
    extra: {
      max: 40,
      connectionTimeoutMillis: 10000,
    },
  }),
);