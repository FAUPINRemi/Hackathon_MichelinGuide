import { Router } from 'express'
import pool from '../db.js'

const router = Router()
const USER_ID = 1

const CONTINENT_MAP = {
	// Europe
	AD: 'Europe', AT: 'Europe', BA: 'Europe', BE: 'Europe', CH: 'Europe',
	CY: 'Europe', CZ: 'Europe', DE: 'Europe', DK: 'Europe', ES: 'Europe',
	FI: 'Europe', FR: 'Europe', GB: 'Europe', GR: 'Europe', HR: 'Europe',
	HU: 'Europe', IE: 'Europe', IS: 'Europe', IT: 'Europe', LI: 'Europe',
	LU: 'Europe', MC: 'Europe', ME: 'Europe', MK: 'Europe', MT: 'Europe',
	NL: 'Europe', NO: 'Europe', PL: 'Europe', PT: 'Europe', RO: 'Europe',
	RS: 'Europe', SE: 'Europe', SI: 'Europe', SK: 'Europe', AL: 'Europe',
	// Asia
	CN: 'Asia', HK: 'Asia', ID: 'Asia', IN: 'Asia', JP: 'Asia',
	KH: 'Asia', KR: 'Asia', LA: 'Asia', MM: 'Asia', MO: 'Asia',
	MY: 'Asia', PH: 'Asia', SG: 'Asia', TH: 'Asia', TW: 'Asia',
	VN: 'Asia',
	// North America
	CA: 'North America', MX: 'North America', US: 'North America',
	// Latin America
	AR: 'Latin America', BO: 'Latin America', BR: 'Latin America',
	CL: 'Latin America', CO: 'Latin America', CR: 'Latin America',
	DO: 'Latin America', EC: 'Latin America', GT: 'Latin America',
	PA: 'Latin America', PE: 'Latin America', PY: 'Latin America',
	UY: 'Latin America', VE: 'Latin America',
	// Middle East
	AE: 'Middle East', BH: 'Middle East', IL: 'Middle East',
	JO: 'Middle East', KW: 'Middle East', LB: 'Middle East',
	OM: 'Middle East', QA: 'Middle East', SA: 'Middle East',
	// Oceania
	AU: 'Oceania', FJ: 'Oceania', NZ: 'Oceania',
	// Africa
	EG: 'Africa', MA: 'Africa', TN: 'Africa', ZA: 'Africa',
}

const CONTINENT_FR = {
	'Europe':        'Europe',
	'Asia':          'Asie',
	'North America': 'Amérique du Nord',
	'Latin America': 'Amérique Latine',
	'Middle East':   'Moyen-Orient',
	'Oceania':       'Océanie',
	'Africa':        'Afrique',
}

const COUNTRY_FR = {
	AD: 'Andorre',       AE: 'Émirats Arabes Unis', AL: 'Albanie',
	AR: 'Argentine',     AT: 'Autriche',             AU: 'Australie',
	BA: 'Bosnie-Herzégovine', BE: 'Belgique',         BH: 'Bahreïn',
	BO: 'Bolivie',       BR: 'Brésil',               CA: 'Canada',
	CH: 'Suisse',        CL: 'Chili',                CN: 'Chine',
	CO: 'Colombie',      CR: 'Costa Rica',           CY: 'Chypre',
	CZ: 'Tchéquie',      DE: 'Allemagne',             DK: 'Danemark',
	DO: 'Rép. Dominicaine', EC: 'Équateur',           EG: 'Égypte',
	ES: 'Espagne',       FI: 'Finlande',              FJ: 'Fidji',
	FR: 'France',        GB: 'Royaume-Uni',           GR: 'Grèce',
	GT: 'Guatemala',     HK: 'Hong Kong',             HR: 'Croatie',
	HU: 'Hongrie',       ID: 'Indonésie',             IE: 'Irlande',
	IL: 'Israël',        IN: 'Inde',                  IS: 'Islande',
	IT: 'Italie',        JO: 'Jordanie',              JP: 'Japon',
	KH: 'Cambodge',      KR: 'Corée du Sud',          KW: 'Koweït',
	LA: 'Laos',          LB: 'Liban',                 LI: 'Liechtenstein',
	LU: 'Luxembourg',    MA: 'Maroc',                  MC: 'Monaco',
	ME: 'Monténégro',    MK: 'Macédoine du Nord',     MM: 'Myanmar',
	MO: 'Macao',         MT: 'Malte',                  MX: 'Mexique',
	MY: 'Malaisie',      NL: 'Pays-Bas',               NO: 'Norvège',
	NZ: 'Nouvelle-Zélande', OM: 'Oman',               PA: 'Panama',
	PE: 'Pérou',         PH: 'Philippines',            PL: 'Pologne',
	PT: 'Portugal',      PY: 'Paraguay',               QA: 'Qatar',
	RO: 'Roumanie',      RS: 'Serbie',                 SA: 'Arabie Saoudite',
	SE: 'Suède',         SG: 'Singapour',              SI: 'Slovénie',
	SK: 'Slovaquie',     TH: 'Thaïlande',              TN: 'Tunisie',
	TW: 'Taïwan',        US: 'États-Unis',             UY: 'Uruguay',
	VE: 'Venezuela',     VN: 'Viêt Nam',               ZA: 'Afrique du Sud',
}

const CONTINENT_ORDER = [
	'Europe', 'Asia', 'North America', 'Latin America',
	'Middle East', 'Oceania', 'Africa',
]

// Extract a readable name from a region value that may be a JSON string
function parseRegionName(raw) {
	if (!raw) return 'Autre'
	const trimmed = raw.trim()
	if (trimmed.startsWith('{')) {
		try {
			return JSON.parse(trimmed).name ?? trimmed
		} catch {
			return trimmed
		}
	}
	return trimmed || 'Autre'
}

// SQL expression that resolves a region TEXT column (possibly JSON) to a display name
const REGION_SQL = `CASE WHEN region LIKE '{%' THEN (region::jsonb)->>'name' ELSE COALESCE(NULLIF(TRIM(region), ''), 'Autre') END`

function toSlug(name) {
	return name.toLowerCase().replace(/\s+/g, '-')
}

function fromSlug(slug) {
	return CONTINENT_ORDER.find((c) => toSlug(c) === slug) ?? null
}

// GET /api/collection/continents
router.get('/continents', async (req, res) => {
	try {
		const [totalRes, visitedRes] = await Promise.all([
			pool.query(`
        SELECT country->>'code' AS code, COUNT(*) AS total
        FROM restaurants
        WHERE country->>'code' IS NOT NULL
        GROUP BY code
      `),
			pool.query(`
        SELECT r.country->>'code' AS code, COUNT(*) AS visited
        FROM collection c
        JOIN restaurants r ON r.id = c.id_restaurant
        WHERE c.id_client = $1
        GROUP BY code
      `, [USER_ID]),
		])

		const visitedByCode = {}
		for (const row of visitedRes.rows)
			visitedByCode[row.code] = parseInt(row.visited, 10)

		const continentMap = {}
		for (const row of totalRes.rows) {
			const continent = CONTINENT_MAP[row.code] ?? 'Other'
			if (!continentMap[continent]) continentMap[continent] = { total: 0, visited: 0 }
			continentMap[continent].total   += parseInt(row.total, 10)
			continentMap[continent].visited += visitedByCode[row.code] ?? 0
		}

		const result = CONTINENT_ORDER
			.filter((name) => continentMap[name])
			.map((name) => ({
				id:      toSlug(name),
				name:    CONTINENT_FR[name] ?? name,
				total:   continentMap[name].total,
				visited: continentMap[name].visited,
			}))

		res.json(result)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Internal server error' })
	}
})

// GET /api/collection/continents/:continent/countries
router.get('/continents/:continent/countries', async (req, res) => {
	try {
		const continentName = fromSlug(req.params.continent)
		if (!continentName) return res.status(404).json({ error: 'Continent not found' })

		const codes = Object.entries(CONTINENT_MAP)
			.filter(([, c]) => c === continentName)
			.map(([code]) => code)

		const [totalRes, visitedRes] = await Promise.all([
			pool.query(`
        SELECT country->>'code' AS code, COUNT(*) AS total
        FROM restaurants
        WHERE country->>'code' = ANY($1)
        GROUP BY code
        ORDER BY total DESC
      `, [codes]),
			pool.query(`
        SELECT r.country->>'code' AS code, COUNT(*) AS visited
        FROM collection c
        JOIN restaurants r ON r.id = c.id_restaurant
        WHERE c.id_client = $1 AND r.country->>'code' = ANY($2)
        GROUP BY code
      `, [USER_ID, codes]),
		])

		const visitedByCode = {}
		for (const row of visitedRes.rows)
			visitedByCode[row.code] = parseInt(row.visited, 10)

		const result = totalRes.rows.map((row) => ({
			code:    row.code,
			name:    COUNTRY_FR[row.code] ?? row.code,
			total:   parseInt(row.total, 10),
			visited: visitedByCode[row.code] ?? 0,
		}))

		res.json(result)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Internal server error' })
	}
})

// GET /api/collection/countries/:country/regions
router.get('/countries/:country/regions', async (req, res) => {
	try {
		const countryCode = req.params.country.toUpperCase()

		const [totalRes, visitedRes] = await Promise.all([
			pool.query(`
        SELECT region AS region_raw, COUNT(*) AS total
        FROM restaurants
        WHERE country->>'code' = $1
        GROUP BY region_raw
        ORDER BY total DESC
      `, [countryCode]),
			pool.query(`
        SELECT r.region AS region_raw, COUNT(*) AS visited
        FROM collection c
        JOIN restaurants r ON r.id = c.id_restaurant
        WHERE c.id_client = $1 AND r.country->>'code' = $2
        GROUP BY region_raw
      `, [USER_ID, countryCode]),
		])

		// Parse JSON region strings and aggregate under the resolved name
		const totalMap = {}
		for (const row of totalRes.rows) {
			const name = parseRegionName(row.region_raw)
			totalMap[name] = (totalMap[name] ?? 0) + parseInt(row.total, 10)
		}

		const visitedMap = {}
		for (const row of visitedRes.rows) {
			const name = parseRegionName(row.region_raw)
			visitedMap[name] = (visitedMap[name] ?? 0) + parseInt(row.visited, 10)
		}

		const result = Object.entries(totalMap)
			.map(([name, total]) => ({ name, total, visited: visitedMap[name] ?? 0 }))
			.sort((a, b) => b.total - a.total)

		res.json(result)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Internal server error' })
	}
})

// GET /api/collection/countries/:country/regions/:region/cities
router.get('/countries/:country/regions/:region/cities', async (req, res) => {
	try {
		const countryCode  = req.params.country.toUpperCase()
		const regionName   = req.params.region

		const [totalRes, visitedRes] = await Promise.all([
			pool.query(`
        SELECT city->>'name' AS city_name, COUNT(*) AS total
        FROM restaurants
        WHERE country->>'code' = $1
          AND ${REGION_SQL} = $2
          AND city->>'name' IS NOT NULL
        GROUP BY city_name
        ORDER BY total DESC
      `, [countryCode, regionName]),
			pool.query(`
        SELECT r.city->>'name' AS city_name, COUNT(*) AS visited
        FROM collection c
        JOIN restaurants r ON r.id = c.id_restaurant
        WHERE c.id_client = $1
          AND r.country->>'code' = $2
          AND ${REGION_SQL.replace(/\bregion\b/g, 'r.region')} = $3
          AND r.city->>'name' IS NOT NULL
        GROUP BY city_name
      `, [USER_ID, countryCode, regionName]),
		])

		const visitedByCity = {}
		for (const row of visitedRes.rows)
			visitedByCity[row.city_name] = parseInt(row.visited, 10)

		const result = totalRes.rows.map((row) => ({
			name:    row.city_name,
			total:   parseInt(row.total, 10),
			visited: visitedByCity[row.city_name] ?? 0,
		}))

		res.json(result)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Internal server error' })
	}
})

// GET /api/collection/countries/:country/regions/:region/cities/:city/restaurants
router.get('/countries/:country/regions/:region/cities/:city/restaurants', async (req, res) => {
	try {
		const countryCode = req.params.country.toUpperCase()
		const regionName  = req.params.region
		const cityName    = req.params.city

		const result = await pool.query(`
      SELECT
        r.id,
        r.identifier,
        r.name,
        r.distinction_score,
        r.distinction,
        r.cuisines,
        CASE WHEN col.id IS NOT NULL THEN true ELSE false END AS visited
      FROM restaurants r
      LEFT JOIN collection col
        ON col.id_restaurant = r.id AND col.id_client = $1
      WHERE r.country->>'code' = $2
        AND ${REGION_SQL.replace(/\bregion\b/g, 'r.region')} = $3
        AND r.city->>'name' = $4
      ORDER BY r.distinction_score DESC NULLS LAST, r.name ASC
    `, [USER_ID, countryCode, regionName, cityName])

		const rows = result.rows.map((r) => {
			const score    = r.distinction_score ?? 0
			const stars    = score >= 3 ? score - 2 : 0
			const isBib    = r.distinction?.slug === 'bib-gourmand'
			const cuisines = Array.isArray(r.cuisines) ? r.cuisines : []
			const cuisine  = cuisines[0]?.label ?? cuisines[0] ?? ''
			return {
				id:      r.identifier ?? String(r.id),
				name:    r.name ?? '',
				stars:   Math.min(stars, 3),
				bib:     isBib,
				cuisine: String(cuisine),
				visited: r.visited,
			}
		})

		res.json(rows)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Internal server error' })
	}
})

export default router
