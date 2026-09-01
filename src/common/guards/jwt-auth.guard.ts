import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Simple alias autour de la stratégie 'jwt' déjà enregistrée dans
// AuthModule — évite de répéter AuthGuard('jwt') partout et prépare
// le terrain si on doit personnaliser la logique plus tard (ex:
// vérifier qu'un compte n'est pas suspendu).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}