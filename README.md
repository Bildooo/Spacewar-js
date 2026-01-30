# Spacewar! - JavaScript Remake

Kompletní hratelný remake klasické hry Spacewar! (1962) s moderní modulární architekturou a fyzikálním enginem.

## 🚀 Jak spustit

Jednoduše otevřete `index.html` v prohlížeči. Hra se spustí automaticky.

## 🎮 Ovládání

**Hráč 1 (modrá loď):**
- `W` = plyn
- `A` = otočit vlevo
- `D` = otočit vpravo
- `S` = vystřelit

**Hráč 2 (růžová loď):**
- `↑` = plyn
- `←` = otočit vlevo
- `→` = otočit vpravo
- `Pravý Ctrl` = vystřelit

## ✨ Funkce

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

Poraz protihráče pomocí střel a vyhni se gravitaci slunce! Každý hráč má 3 životy.
