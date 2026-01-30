# Spacewar! - JavaScript Remake

Kompletní hratelný remake klasické hry Spacewar! (1962) s moderní modulární architekturou a fyzikálním enginem.

## 🚀 Jak spustit

1. Otevřete `index.html` v prohlížeči
2. Vyberte herní mód:
   - Stiskněte **1** pro Hráč vs Hráč
   - Stiskněte **2** pro Hráč vs Počítač
3. Po skončení hry stiskněte **mezerník** pro restart

## ✨ Funkce

- ✅ **Dva herní módy**: PvP nebo proti AI
- ✅ **AI protivník** se strategickým rozhodováním

- ✅ Newtonovská fyzika s setrvačností
- ✅ Gravitace slunce (F = G × m₁ × m₂ / r²)
- ✅ Dva hráči s ovládáním na klávesnici
- ✅ Střelba se střelami ovlivněnými gravitací
- ✅ Systém životů a respawnu
- ✅ Detekce kolizí
- ✅ Krásná grafika s efekty
- ✅ Modulární architektura kódu

## 📁 Struktura projektu

- `Vector2.js` - 2D vektorová matematika
- `Sun.js` - Slunce s gravitací
- `Bullet.js` - Střely s fyzikou
- `Ship.js` - Vesmírné lodě
- `Input.js` - Ovládání
- `Game.js` - Herní smyčka
- `main.js` - Vstupní bod
- `index.html` - HTML a canvas

## 🎯 Cíl hry

Poraz protihráče pomocí střel a vyhni se gravitaci slunce! Každý hráč má 10 životů.
