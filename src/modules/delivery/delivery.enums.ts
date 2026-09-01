export enum DeliveryRequestStatus {
  OPEN = 'open', // en attente d'offres
  ASSIGNED = 'assigned', // une offre a été acceptée
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum DeliveryOfferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected', // rejetée automatiquement quand une autre offre est acceptée
}