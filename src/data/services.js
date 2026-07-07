export const SERVICES = [
  { id: 1, name: "Nettoyage à sec", items: [
    { name: "Pantalon", price: 2500 }, { name: "Chemise", price: 2000 },
    { name: "Veste", price: 3500 }, { name: "Robe", price: 4000 },
    { name: "Costume complet", price: 8000 }, { name: "Manteau", price: 5000 },
  ]},
  { id: 2, name: "Repassage", items: [
    { name: "Pantalon", price: 1000 }, { name: "Chemise", price: 800 },
    { name: "Robe", price: 1500 }, { name: "Drap", price: 1200 },
  ]},
  { id: 3, name: "Lavage", items: [
    { name: "Kg de linge", price: 1500 }, { name: "Couverture", price: 3000 },
    { name: "Rideau", price: 2500 }, { name: "Tapis", price: 4000 },
  ]},
];

export const PERMISSION_LABELS = {
  can_create_orders: "Créer des commandes",
  can_view_orders: "Voir les commandes",
  can_edit_orders: "Modifier le statut des commandes",
  can_view_clients: "Voir les clients",
  can_manage_inventory: "Gérer les stocks",
  can_view_reports: "Voir les rapports financiers",
  can_manage_staff: "Gérer le personnel",
};
