export const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";

export const genTicket = () => {
  const d = new Date();
  return `QW${d.getFullYear().toString().slice(-2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}${Math.floor(Math.random()*9999).toString().padStart(4,"0")}`;
};
