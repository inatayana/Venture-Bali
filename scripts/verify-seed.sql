\pset border 2
\echo '=== 9 PRODUK (Venture) ==='
SELECT category, slug, title, rating FROM "Venture" ORDER BY category;

\echo ''
\echo '=== VARIANT + PRICE TIER per pax (Self Drive) ==='
SELECT v.category,
       va.title AS variant,
       pt."minPax" AS min_pax,
       pt."maxPax" AS max_pax,
       pt."pricePerPax" AS idr_per_pax
FROM "PriceTier" pt
JOIN "Variant" va ON va.id = pt."variantId"
JOIN "Venture" v ON v.id = va."ventureId"
WHERE va.title = 'Self Drive'
ORDER BY v.category, pt."minPax";

\echo ''
\echo '=== JUMLAH DATA ==='
SELECT 'Venture'      AS entity, COUNT(*) FROM "Venture"
UNION ALL SELECT 'Variant',        COUNT(*) FROM "Variant"
UNION ALL SELECT 'PriceTier',      COUNT(*) FROM "PriceTier"
UNION ALL SELECT 'SlotTime',       COUNT(*) FROM "SlotTime"
UNION ALL SELECT 'Addon',          COUNT(*) FROM "Addon"
UNION ALL SELECT 'Location',       COUNT(*) FROM "Location"
UNION ALL SELECT 'PickupZone',     COUNT(*) FROM "PickupZone"
UNION ALL SELECT 'VehicleClass',   COUNT(*) FROM "VehicleClass"
UNION ALL SELECT 'Tenant',         COUNT(*) FROM "Tenant";

\echo ''
\echo '=== PICKUP ZONE SURCHARGE ==='
SELECT name, "areaType", "surchargeIdr", "isCustomQuote" FROM "PickupZone" ORDER BY "areaType";
