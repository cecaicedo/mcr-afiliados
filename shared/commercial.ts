export type CommercialProduct = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  activo?: boolean;
};

export type CommercialLead = {
  productoInteresId?: number | null;
  estado?: string | null;
  fuente?: string | null;
};

export function getProductNiches(products: CommercialProduct[]) {
  return ["Todos", ...Array.from(new Set(products.map((product) => product.categoria).filter((category): category is string => Boolean(category))))];
}

export function filterProductsByNiche(products: CommercialProduct[], query: string, niche: string) {
  const normalizedQuery = query.trim().toLowerCase();
  return products.filter((product) => {
    const searchableText = `${product.nombre} ${product.descripcion ?? ""} ${product.categoria ?? ""}`.toLowerCase();
    return searchableText.includes(normalizedQuery) && (niche === "Todos" || product.categoria === niche);
  });
}

export function summarizeLeadsByNiche(leads: CommercialLead[], products: CommercialProduct[]) {
  const productMap = new Map(products.map((product) => [product.id, product]));
  const summary = new Map<string, { name: string; leads: number; sales: number }>();
  leads.forEach((lead) => {
    const niche = productMap.get(lead.productoInteresId ?? -1)?.categoria || "Sin nicho";
    const current = summary.get(niche) ?? { name: niche, leads: 0, sales: 0 };
    current.leads += 1;
    if (lead.estado === "compro") current.sales += 1;
    summary.set(niche, current);
  });
  return Array.from(summary.values()).sort((a, b) => b.leads - a.leads);
}

export function countAttentionLeads(leads: CommercialLead[]) {
  return leads.filter((lead) => lead.estado === "nuevo" || lead.estado === "interesado").length;
}

export function countAbandonedCartLeads(leads: CommercialLead[]) {
  return leads.filter((lead) => String(lead.fuente ?? "").includes("carrito")).length;
}
