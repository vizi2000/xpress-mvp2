/**
 * Cities Configuration
 *
 * Defines supported cities for Xpress.Delivery courier service.
 * Cities are organized into groups based on inter-city delivery capabilities:
 * - Trójmiasto: Gdańsk, Gdynia, Sopot (can deliver between each other)
 * - Katowice Metro: 7 cities in Silesian Metropolitan Area (can deliver between each other)
 * - Single-city: Cities that only support deliveries within their own boundaries
 *
 * @module cities.config
 * @author The Collective Borg.tools
 */

/**
 * City group identifiers
 * @readonly
 * @enum {string}
 */
export const CITY_GROUP = {
    TROJMIASTO: 'trojmiasto',
    KATOWICE_METRO: 'katowice_metro',
    SINGLE: 'single'
};

/**
 * Supported cities configuration
 * Each city includes geographic bounds, postal codes, aliases, and group membership
 *
 * @typedef {Object} CityConfig
 * @property {string} id - Unique identifier (lowercase, no Polish chars)
 * @property {string} name - Display name (with Polish characters)
 * @property {string[]} aliases - Alternative names for matching (lowercase)
 * @property {Object} bounds - Geographic boundaries
 * @property {number} bounds.north - Northern latitude boundary
 * @property {number} bounds.south - Southern latitude boundary
 * @property {number} bounds.east - Eastern longitude boundary
 * @property {number} bounds.west - Western longitude boundary
 * @property {string} group - City group identifier
 * @property {string[]} postalCodes - Postal code prefixes
 */
export const SUPPORTED_CITIES = {
    // ===== TRÓJMIASTO GROUP =====
    gdansk: {
        id: 'gdansk',
        name: 'Gdańsk',
        aliases: ['gdansk', 'danzig', 'gda', 'gdańsk'],
        bounds: {
            north: 54.50,
            south: 54.20,
            east: 18.80,
            west: 18.50
        },
        group: CITY_GROUP.TROJMIASTO,
        postalCodes: ['80-', '81-']
    },
    gdynia: {
        id: 'gdynia',
        name: 'Gdynia',
        aliases: ['gdynia', 'gdy', 'gdynia'],
        bounds: {
            north: 54.67,
            south: 54.37,
            east: 18.68,
            west: 18.38
        },
        group: CITY_GROUP.TROJMIASTO,
        postalCodes: ['81-']
    },
    sopot: {
        id: 'sopot',
        name: 'Sopot',
        aliases: ['sopot', 'sop'],
        bounds: {
            north: 54.59,
            south: 54.29,
            east: 18.71,
            west: 18.41
        },
        group: CITY_GROUP.TROJMIASTO,
        postalCodes: ['81-']
    },

    // ===== KATOWICE METRO GROUP =====
    katowice: {
        id: 'katowice',
        name: 'Katowice',
        aliases: ['katowice', 'kato', 'ktw', 'kat'],
        bounds: {
            north: 50.41,
            south: 50.11,
            east: 19.17,
            west: 18.87
        },
        group: CITY_GROUP.KATOWICE_METRO,
        postalCodes: ['40-', '41-', '42-']
    },
    sosnowiec: {
        id: 'sosnowiec',
        name: 'Sosnowiec',
        aliases: ['sosnowiec', 'sos', 'sosn'],
        bounds: {
            north: 50.41,
            south: 50.11,
            east: 19.28,
            west: 18.98
        },
        group: CITY_GROUP.KATOWICE_METRO,
        postalCodes: ['41-']
    },
    bytom: {
        id: 'bytom',
        name: 'Bytom',
        aliases: ['bytom', 'byt'],
        bounds: {
            north: 50.50,
            south: 50.20,
            east: 19.03,
            west: 18.73
        },
        group: CITY_GROUP.KATOWICE_METRO,
        postalCodes: ['41-']
    },
    chorzow: {
        id: 'chorzow',
        name: 'Chorzów',
        aliases: ['chorzow', 'chorzów', 'chorz'],
        bounds: {
            north: 50.45,
            south: 50.15,
            east: 19.13,
            west: 18.83
        },
        group: CITY_GROUP.KATOWICE_METRO,
        postalCodes: ['41-']
    },
    zabrze: {
        id: 'zabrze',
        name: 'Zabrze',
        aliases: ['zabrze', 'zab'],
        bounds: {
            north: 50.47,
            south: 50.17,
            east: 18.93,
            west: 18.63
        },
        group: CITY_GROUP.KATOWICE_METRO,
        postalCodes: ['41-']
    },
    gliwice: {
        id: 'gliwice',
        name: 'Gliwice',
        aliases: ['gliwice', 'gli', 'gliw'],
        bounds: {
            north: 50.44,
            south: 50.14,
            east: 18.82,
            west: 18.52
        },
        group: CITY_GROUP.KATOWICE_METRO,
        postalCodes: ['44-']
    },
    tychy: {
        id: 'tychy',
        name: 'Tychy',
        aliases: ['tychy', 'tych', 'tyc'],
        bounds: {
            north: 50.21,
            south: 49.91,
            east: 19.13,
            west: 18.83
        },
        group: CITY_GROUP.KATOWICE_METRO,
        postalCodes: ['43-']
    },

    // ===== SINGLE-CITY OPERATIONS =====
    krakow: {
        id: 'krakow',
        name: 'Kraków',
        aliases: ['krakow', 'kraków', 'cracow', 'krk', 'krak'],
        bounds: {
            north: 50.21,
            south: 49.91,
            east: 20.09,
            west: 19.79
        },
        group: CITY_GROUP.SINGLE,
        postalCodes: ['30-', '31-', '32-', '33-']
    },
    wroclaw: {
        id: 'wroclaw',
        name: 'Wrocław',
        aliases: ['wroclaw', 'wrocław', 'breslau', 'wro', 'wroc'],
        bounds: {
            north: 51.26,
            south: 50.96,
            east: 17.19,
            west: 16.89
        },
        group: CITY_GROUP.SINGLE,
        postalCodes: ['50-', '51-', '52-', '53-', '54-']
    },
    lodz: {
        id: 'lodz',
        name: 'Łódź',
        aliases: ['lodz', 'łódź', 'ldz', 'lódź'],
        bounds: {
            north: 51.91,
            south: 51.61,
            east: 19.61,
            west: 19.31
        },
        group: CITY_GROUP.SINGLE,
        postalCodes: ['90-', '91-', '92-', '93-', '94-']
    },
    poznan: {
        id: 'poznan',
        name: 'Poznań',
        aliases: ['poznan', 'poznań', 'poz', 'pozn'],
        bounds: {
            north: 52.56,
            south: 52.26,
            east: 17.08,
            west: 16.78
        },
        group: CITY_GROUP.SINGLE,
        postalCodes: ['60-', '61-', '62-']
    },
    szczecin: {
        id: 'szczecin',
        name: 'Szczecin',
        aliases: ['szczecin', 'stettin', 'szc', 'szcz'],
        bounds: {
            north: 53.58,
            south: 53.28,
            east: 14.70,
            west: 14.40
        },
        group: CITY_GROUP.SINGLE,
        postalCodes: ['70-', '71-']
    },
    rzeszow: {
        id: 'rzeszow',
        name: 'Rzeszów',
        aliases: ['rzeszow', 'rzeszów', 'rze', 'rzesz'],
        bounds: {
            north: 50.19,
            south: 49.89,
            east: 22.15,
            west: 21.85
        },
        group: CITY_GROUP.SINGLE,
        postalCodes: ['35-']
    },
    radom: {
        id: 'radom',
        name: 'Radom',
        aliases: ['radom', 'rad'],
        bounds: {
            north: 51.55,
            south: 51.25,
            east: 21.30,
            west: 21.00
        },
        group: CITY_GROUP.SINGLE,
        postalCodes: ['26-']
    },
    warszawa: {
        id: 'warszawa',
        name: 'Warszawa',
        aliases: ['warszawa', 'warsaw', 'waw', 'wa', 'varsavia'],
        bounds: {
            north: 52.37,
            south: 52.07,
            east: 21.27,
            west: 20.85
        },
        group: CITY_GROUP.SINGLE,
        postalCodes: ['00-', '01-', '02-', '03-', '04-']
    }
};

/**
 * City groups with their member cities
 * Defines which cities can deliver to each other
 *
 * @type {Object.<string, string[]>}
 */
export const CITY_GROUPS = {
    [CITY_GROUP.TROJMIASTO]: ['gdansk', 'gdynia', 'sopot'],
    [CITY_GROUP.KATOWICE_METRO]: ['katowice', 'sosnowiec', 'bytom', 'chorzow', 'zabrze', 'gliwice', 'tychy'],
    [CITY_GROUP.SINGLE]: ['krakow', 'wroclaw', 'lodz', 'poznan', 'szczecin', 'rzeszow', 'radom', 'warszawa']
};

/**
 * Array of all supported city IDs
 * @type {string[]}
 */
export const ALL_CITY_IDS = Object.keys(SUPPORTED_CITIES);

/**
 * Array of all city display names
 * @type {string[]}
 */
export const ALL_CITY_NAMES = Object.values(SUPPORTED_CITIES).map(city => city.name);

/**
 * Map for fast alias lookups (lowercase alias -> city id)
 * @type {Map<string, string>}
 * @private
 */
const ALIAS_MAP = new Map();

// Build alias map on module load
Object.entries(SUPPORTED_CITIES).forEach(([cityId, cityConfig]) => {
    cityConfig.aliases.forEach(alias => {
        ALIAS_MAP.set(alias.toLowerCase(), cityId);
    });
});

/**
 * Normalize string for comparison (lowercase, remove Polish diacritics)
 *
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 * @private
 */
function normalizeString(str) {
    if (!str) return '';

    const polishChars = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
        'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'a', 'Ć': 'c', 'Ę': 'e', 'Ł': 'l', 'Ń': 'n',
        'Ó': 'o', 'Ś': 's', 'Ź': 'z', 'Ż': 'z'
    };

    return str
        .toLowerCase()
        .split('')
        .map(char => polishChars[char] || char)
        .join('')
        .trim();
}

/**
 * Get city configuration by ID
 *
 * @param {string} id - City ID (e.g., 'gdansk', 'krakow')
 * @returns {CityConfig|null} City configuration object or null if not found
 *
 * @example
 * const gdansk = getCityById('gdansk');
 * console.log(gdansk.name); // 'Gdańsk'
 */
export function getCityById(id) {
    if (!id || typeof id !== 'string') return null;
    return SUPPORTED_CITIES[id.toLowerCase()] || null;
}

/**
 * Get city group for a given city ID
 *
 * @param {string} cityId - City ID
 * @returns {string|null} Group identifier or null if city not found
 *
 * @example
 * const group = getCityGroup('gdansk');
 * console.log(group); // 'trojmiasto'
 */
export function getCityGroup(cityId) {
    if (!cityId || typeof cityId !== 'string') return null;
    const city = getCityById(cityId);
    return city ? city.group : null;
}

/**
 * Get all cities in a specific group
 *
 * @param {string} groupName - Group identifier ('trojmiasto', 'katowice_metro', or 'single')
 * @returns {CityConfig[]} Array of city configurations in the group
 *
 * @example
 * const trojmiastoCities = getGroupCities('trojmiasto');
 * console.log(trojmiastoCities.map(c => c.name)); // ['Gdańsk', 'Gdynia', 'Sopot']
 */
export function getGroupCities(groupName) {
    if (!groupName || typeof groupName !== 'string') return [];

    const cityIds = CITY_GROUPS[groupName.toLowerCase()];
    if (!cityIds) return [];

    return cityIds.map(id => SUPPORTED_CITIES[id]).filter(Boolean);
}

/**
 * Check if a city is supported by name or alias
 * Case-insensitive, handles Polish characters
 *
 * @param {string} cityNameOrAlias - City name or alias to check
 * @returns {boolean} true if city is supported, false otherwise
 *
 * @example
 * isCitySupported('Gdańsk'); // true
 * isCitySupported('gdansk'); // true
 * isCitySupported('Danzig'); // true
 * isCitySupported('Warsaw'); // false
 */
export function isCitySupported(cityNameOrAlias) {
    if (!cityNameOrAlias || typeof cityNameOrAlias !== 'string') return false;

    const normalized = normalizeString(cityNameOrAlias);
    return ALIAS_MAP.has(normalized);
}

/**
 * Find city configuration by name or alias
 * Case-insensitive, handles Polish characters
 *
 * @param {string} cityNameOrAlias - City name or alias
 * @returns {CityConfig|null} City configuration object or null if not found
 *
 * @example
 * const city = findCityByName('Kraków');
 * console.log(city.id); // 'krakow'
 *
 * const city2 = findCityByName('cracow');
 * console.log(city2.id); // 'krakow'
 */
export function findCityByName(cityNameOrAlias) {
    if (!cityNameOrAlias || typeof cityNameOrAlias !== 'string') return null;

    const normalized = normalizeString(cityNameOrAlias);
    const cityId = ALIAS_MAP.get(normalized);

    return cityId ? SUPPORTED_CITIES[cityId] : null;
}

/**
 * Check if two cities can deliver to each other
 * Cities can deliver if they're in the same group (except 'single' group cities)
 *
 * @param {string} cityId1 - First city ID or name
 * @param {string} cityId2 - Second city ID or name
 * @returns {boolean} true if delivery is possible between cities
 *
 * @example
 * canDeliverBetween('gdansk', 'sopot'); // true (same group: trojmiasto)
 * canDeliverBetween('katowice', 'gliwice'); // true (same group: katowice_metro)
 * canDeliverBetween('krakow', 'wroclaw'); // false (both single-city)
 * canDeliverBetween('gdansk', 'krakow'); // false (different groups)
 */
export function canDeliverBetween(cityId1, cityId2) {
    if (!cityId1 || !cityId2) return false;

    // Normalize input - could be ID or name
    const city1 = findCityByName(cityId1) || getCityById(cityId1);
    const city2 = findCityByName(cityId2) || getCityById(cityId2);

    if (!city1 || !city2) return false;

    // Same city - always allowed
    if (city1.id === city2.id) return true;

    // Different cities in same group (except single)
    if (city1.group === city2.group && city1.group !== CITY_GROUP.SINGLE) {
        return true;
    }

    return false;
}

/**
 * Check if coordinates are within a city's boundaries
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} cityId - City ID
 * @returns {boolean} true if coordinates are within city bounds
 *
 * @example
 * isWithinCityBounds(54.35, 18.65, 'gdansk'); // true
 * isWithinCityBounds(50.06, 19.94, 'gdansk'); // false
 */
export function isWithinCityBounds(lat, lng, cityId) {
    if (typeof lat !== 'number' || typeof lng !== 'number' || !cityId) {
        return false;
    }

    const city = getCityById(cityId);
    if (!city) return false;

    const { bounds } = city;
    return (
        lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east
    );
}

/**
 * Find city by coordinates
 * Returns the first city whose bounds contain the given coordinates
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {CityConfig|null} City configuration or null if not found
 *
 * @example
 * const city = findCityByCoordinates(54.35, 18.65);
 * console.log(city.name); // 'Gdańsk'
 */
export function findCityByCoordinates(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        return null;
    }

    for (const cityId of ALL_CITY_IDS) {
        if (isWithinCityBounds(lat, lng, cityId)) {
            return SUPPORTED_CITIES[cityId];
        }
    }

    return null;
}

/**
 * Get all postal codes for a city
 *
 * @param {string} cityId - City ID
 * @returns {string[]} Array of postal code prefixes
 *
 * @example
 * const codes = getCityPostalCodes('krakow');
 * console.log(codes); // ['30-', '31-', '32-', '33-']
 */
export function getCityPostalCodes(cityId) {
    const city = getCityById(cityId);
    return city ? [...city.postalCodes] : [];
}

/**
 * Check if postal code belongs to a city
 *
 * @param {string} postalCode - Postal code (e.g., '30-001', '30-')
 * @param {string} cityId - City ID
 * @returns {boolean} true if postal code matches city
 *
 * @example
 * isPostalCodeInCity('30-001', 'krakow'); // true
 * isPostalCodeInCity('80-001', 'krakow'); // false
 */
export function isPostalCodeInCity(postalCode, cityId) {
    if (!postalCode || !cityId) return false;

    const city = getCityById(cityId);
    if (!city) return false;

    const cleanCode = postalCode.replace(/\s/g, '');
    return city.postalCodes.some(prefix => cleanCode.startsWith(prefix));
}

// Module initialization log
console.log('✅ Cities configuration loaded:', {
    totalCities: ALL_CITY_IDS.length,
    groups: Object.keys(CITY_GROUPS).length,
    cities: ALL_CITY_NAMES.join(', ')
});
