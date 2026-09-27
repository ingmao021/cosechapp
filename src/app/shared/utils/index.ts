// Utilidades compartidas - placeholder para futuras utilidades
export const formatKilos = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) return '0 kg';
  const rounded = Math.round(value * 1000) / 1000;
  const parts = rounded.toString().split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1] ? `,${parts[1]}` : '';
  return `${integerPart}${decimalPart} kg`;
};

export const formatCurrency = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) return '$ 0 COP';
  const rounded = Math.round(value);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$ ${formatted} COP`;
};