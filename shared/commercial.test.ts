import { describe, expect, it } from "vitest";
import {
  countAbandonedCartLeads,
  countAttentionLeads,
  filterProductsByNiche,
  getProductNiches,
  summarizeLeadsByNiche,
} from "./commercial";

describe("commercial utilities", () => {
  const products = [
    { id: 1, nombre: "Finanzas personales", descripcion: "Ahorro y presupuesto", categoria: "Finanzas" },
    { id: 2, nombre: "Contenido para redes", descripcion: "Estrategia digital", categoria: "Marketing" },
    { id: 3, nombre: "Hábitos saludables", descripcion: "Rutinas diarias", categoria: "Bienestar" },
  ];

  it("returns a simple list of product niches with Todos first", () => {
    expect(getProductNiches(products)).toEqual(["Todos", "Finanzas", "Marketing", "Bienestar"]);
  });

  it("filters products by search text and niche without mutating the catalog", () => {
    const filtered = filterProductsByNiche(products, "ahorro", "Finanzas");
    expect(filtered.map((product) => product.id)).toEqual([1]);
    expect(products).toHaveLength(3);
    expect(filterProductsByNiche(products, "", "Marketing").map((product) => product.id)).toEqual([2]);
  });

  it("summarizes leads by niche and counts completed purchases", () => {
    const leads = [
      { productoInteresId: 1, estado: "interesado" },
      { productoInteresId: 1, estado: "compro" },
      { productoInteresId: 2, estado: "nuevo" },
      { productoInteresId: null, estado: "nuevo" },
    ];
    expect(summarizeLeadsByNiche(leads, products)).toEqual([
      { name: "Finanzas", leads: 2, sales: 1 },
      { name: "Marketing", leads: 1, sales: 0 },
      { name: "Sin nicho", leads: 1, sales: 0 },
    ]);
  });

  it("identifies leads that need attention and abandoned carts", () => {
    const leads = [
      { estado: "nuevo", fuente: "instagram" },
      { estado: "interesado", fuente: "hotmart_carrito_abandonado" },
      { estado: "compro", fuente: "hotmart_webhook" },
      { estado: "perdido", fuente: "hotmart_carrito_abandonado" },
    ];
    expect(countAttentionLeads(leads)).toBe(2);
    expect(countAbandonedCartLeads(leads)).toBe(2);
  });
});
