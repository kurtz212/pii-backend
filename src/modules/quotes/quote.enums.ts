export enum QuoteRequestStatus {
  OPEN = 'open', // en attente de réponses des agences ciblées
  ACCEPTED = 'accepted', // le client a choisi un devis parmi les réponses
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}