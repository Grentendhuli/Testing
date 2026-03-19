/**
 * NYC Open Data API Service
 * 
 * Free public API endpoints for NYC housing data
 * No API key required - rate limit: 1,000 requests/hour
 * 
 * Endpoints:
 * - HPD Violations: https://data.cityofnewyork.us/resource/wvxf-dwi5.json
 * - Rent Stabilization: https://data.cityofnewyork.us/resource/tesw-ay5e.json
 * - Building Code Violations (DOB): https://data.cityofnewyork.us/resource/3h2n-5cm9.json
 * - Building Information (PLUTO): https://data.cityofnewyork.us/resource/64uk-42ks.json
 */

import { Result, AsyncResult, AppError, createError } from '../types/result';

// NYC Open Data API Base URLs
const NYC_OPEN_DATA_BASE = 'https://data.cityofnewyork.us/resource';

// API Endpoints
const ENDPOINTS = {
  hpdViolations: `${NYC_OPEN_DATA_BASE}/wvxf-dwi5.json`,
  rentStabilization: `${NYC_OPEN_DATA_BASE}/tesw-ay5e.json`,
  dobViolations: `${NYC_OPEN_DATA_BASE}/3h2n-5cm9.json`,
  plutoBuildings: `${NYC_OPEN_DATA_BASE}/64uk-42ks.json`,
  // Alternative building data endpoint
  buildingData: `${NYC_OPEN_DATA_BASE}/bmi2-p5zf.json`,
};

// Types
export interface HPDViolation {
  violationid: string;
  buildingid: string;
  registrationid: string;
  bbl: string;
  borough: string;
  block: string;
  lot: string;
  housenumber: string;
  streetname: string;
  apartment: string;
  zip: string;
  inspectiondate: string;
  approveddate: string;
  originalcertifybydate: string;
  originalcorrectbydate: string;
  newcertifybydate: string;
  newcorrectbydate: string;
  certifieddate: string;
  description: string;
  novdescription: string;
  class: string; // A, B, or C
  inspectionstatus: string;
  novissued: boolean;
  currentstatus: string;
  currentstatusdate: string;
  violationstatus: string;
  latitude?: string;
  longitude?: string;
  communityboard?: string;
  councildistrict?: string;
}

export interface RentStabilizationRecord {
  ucbbl: string;
  borough: string;
  block: string;
  lot: string;
  bbl: string;
  address: string;
  zipcode: string;
  yearbuilt: string;
  unitsres: string;
  unitstotal: string;
  rentstabilizationstatus: string;
  exemptiontype?: string;
  exemptionstartyear?: string;
  exemptionendyear?: string;
  coredata?: string;
}

export interface DOBViolation {
  violationnumber: string;
  bbl: string;
  bin: string;
  housenumber: string;
  street: string;
  city: string;
  zip: string;
  block: string;
  lot: string;
  violationtype: string;
  violationcategory: string;
  issuedate: string;
  status: string;
  description: string;
  severity: string;
}

export interface BuildingInfo {
  bbl: string;
  borough: string;
  block: string;
  lot: string;
  address: string;
  zipcode: string;
  yearbuilt: string;
  numfloors: string;
  unitsres: string;
  unitstotal: string;
  bldgclass: string;
  ownertype: string;
  ownername: string;
  numbuildings: string;
}

export interface ComplianceCheckResult {
  bbl: string;
  address: string;
  hpdViolations: HPDViolation[];
  dobViolations: DOBViolation[];
  rentStabilized: boolean;
  rentStabilizationDetails?: RentStabilizationRecord;
  buildingInfo?: BuildingInfo;
  goodCauseProtected: boolean;
  complianceScore: number;
  totalViolations: number;
  openViolations: number;
  classAViolations: number;
  classBViolations: number;
  classCViolations: number;
  lastUpdated: string;
}

export interface GoodCauseEligibilityInput {
  monthlyRent: number;
  unitCount: number;
  isOwnerOccupied: boolean;
  buildingAge?: number;
  isSubsidized?: boolean;
  isCoopCondo?: boolean;
  isTemporary?: boolean;
}

// 2025 Good Cause Eviction Threshold
export const GOOD_CAUSE_RENT_THRESHOLD_2025 = 5842; // Updated annually

/**
 * Fetch HPD violations for a building by BBL
 * @param bbl - Borough-Block-Lot number
 * @returns Array of HPD violations
 */
export async function getHPDViolations(bbl: string): AsyncResult<HPDViolation[], AppError> {
  try {
    // Format BBL properly (10 digits: 1 borough + 5 block + 4 lot)
    const formattedBBL = formatBBL(bbl);
    
    const response = await fetch(
      `${ENDPOINTS.hpdViolations}?bbl=${formattedBBL}&$limit=1000`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return Result.err(createError(
        'HPD_API_ERROR',
        `HPD API error: ${response.status} ${response.statusText}`,
        { status: response.status, bbl }
      ));
    }

    const data = await response.json();
    return Result.ok(data as HPDViolation[]);
  } catch (error) {
    console.error('Error fetching HPD violations:', error);
    return Result.err(createError(
      'HPD_VIOLATIONS_FETCH_FAILED',
      error instanceof Error ? error.message : 'Failed to fetch HPD violations',
      { bbl }
    ));
  }
}

/**
 * Check if a building is rent stabilized
 * @param bbl - Borough-Block-Lot number
 * @returns Rent stabilization record or null
 */
export async function checkRentStabilization(bbl: string): AsyncResult<RentStabilizationRecord | null, AppError> {
  try {
    const formattedBBL = formatBBL(bbl);
    
    const response = await fetch(
      `${ENDPOINTS.rentStabilization}?bbl=${formattedBBL}&$limit=1`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return Result.err(createError(
        'RENT_STABILIZATION_API_ERROR',
        `Rent Stabilization API error: ${response.status} ${response.statusText}`,
        { status: response.status, bbl }
      ));
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      return Result.ok(data[0] as RentStabilizationRecord);
    }
    
    return Result.ok(null);
  } catch (error) {
    console.error('Error checking rent stabilization:', error);
    return Result.err(createError(
      'RENT_STABILIZATION_CHECK_FAILED',
      error instanceof Error ? error.message : 'Failed to check rent stabilization',
      { bbl }
    ));
  }
}

/**
 * Get DOB building code violations
 * @param bbl - Borough-Block-Lot number
 * @returns Array of DOB violations
 */
export async function getBuildingCodeViolations(bbl: string): AsyncResult<DOBViolation[], AppError> {
  try {
    const formattedBBL = formatBBL(bbl);
    
    const response = await fetch(
      `${ENDPOINTS.dobViolations}?bbl=${formattedBBL}&$limit=1000`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return Result.err(createError(
        'DOB_API_ERROR',
        `DOB API error: ${response.status} ${response.statusText}`,
        { status: response.status, bbl }
      ));
    }

    const data = await response.json();
    return Result.ok(data as DOBViolation[]);
  } catch (error) {
    console.error('Error fetching DOB violations:', error);
    return Result.err(createError(
      'DOB_VIOLATIONS_FETCH_FAILED',
      error instanceof Error ? error.message : 'Failed to fetch DOB violations',
      { bbl }
    ));
  }
}

/**
 * Get building information from PLUTO database
 * @param bbl - Borough-Block-Lot number
 * @returns Building information or null
 */
export async function getBuildingInfo(bbl: string): AsyncResult<BuildingInfo | null, AppError> {
  try {
    const formattedBBL = formatBBL(bbl);
    
    const response = await fetch(
      `${ENDPOINTS.plutoBuildings}?bbl=${formattedBBL}&$limit=1`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Try alternative endpoint
      const altResponse = await fetch(
        `${ENDPOINTS.buildingData}?bbl=${formattedBBL}&$limit=1`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (!altResponse.ok) {
        return Result.err(createError(
          'BUILDING_INFO_API_ERROR',
          `Building Info API error: ${altResponse.status}`,
          { status: altResponse.status, bbl }
        ));
      }
      
      const altData = await altResponse.json();
      return Result.ok(altData && altData.length > 0 ? altData[0] as BuildingInfo : null);
    }

    const data = await response.json();
    return Result.ok(data && data.length > 0 ? data[0] as BuildingInfo : null);
  } catch (error) {
    console.error('Error fetching building info:', error);
    return Result.err(createError(
      'BUILDING_INFO_FETCH_FAILED',
      error instanceof Error ? error.message : 'Failed to fetch building info',
      { bbl }
    ));
  }
}

/**
 * Search for building by address and return BBL
 * Uses the building data endpoint to search by address
 * @param address - Street address (e.g., "123 Main Street")
 * @param borough - Optional borough name
 * @returns BBL string or null if not found
 */
export async function searchBuildingByAddress(
  address: string, 
  borough?: string
): AsyncResult<string | null, AppError> {
  try {
    // Clean up the address
    const cleanAddress = address.trim().toUpperCase();
    
    // Build query - try to match on address field
    let queryUrl = `${ENDPOINTS.buildingData}?$where=address like '%25${encodeURIComponent(cleanAddress)}%25'`;
    
    if (borough) {
      const boroughCode = getBoroughCode(borough);
      if (boroughCode) {
        queryUrl += ` AND borough='${boroughCode}'`;
      }
    }
    
    queryUrl += '&$limit=5';
    
    const response = await fetch(queryUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return Result.err(createError(
        'ADDRESS_SEARCH_API_ERROR',
        `Address search API error: ${response.status}`,
        { status: response.status, address, borough }
      ));
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      // Return the first match's BBL
      return Result.ok(data[0].bbl || data[0].ucbbl || null);
    }
    
    return Result.ok(null);
  } catch (error) {
    console.error('Error searching building by address:', error);
    return Result.err(createError(
      'ADDRESS_SEARCH_FAILED',
      error instanceof Error ? error.message : 'Failed to search building by address',
      { address, borough }
    ));
  }
}

/**
 * Check Good Cause Eviction eligibility
 * @param unitData - Unit information for eligibility check
 * @returns Object with eligibility status and details
 */
export function getGoodCauseEvictionEligibility(
  unitData: GoodCauseEligibilityInput
): Result<{
  protected: boolean;
  reasons: string[];
  exemptions: string[];
}, AppError> {
  const reasons: string[] = [];
  const exemptions: string[] = [];
  
  // Check if rent is below threshold
  if (unitData.monthlyRent <= GOOD_CAUSE_RENT_THRESHOLD_2025) {
    reasons.push(`Rent ($${unitData.monthlyRent}) is below 2025 threshold ($${GOOD_CAUSE_RENT_THRESHOLD_2025})`);
  } else {
    exemptions.push(`Rent exceeds threshold ($${GOOD_CAUSE_RENT_THRESHOLD_2025})`);
  }
  
  // Check owner-occupied under 10 units exemption
  if (unitData.isOwnerOccupied && unitData.unitCount < 10) {
    exemptions.push('Owner-occupied building with fewer than 10 units');
  }
  
  // Check other exemptions
  if (unitData.isSubsidized) {
    exemptions.push('Subsidized housing');
  }
  
  if (unitData.isCoopCondo) {
    exemptions.push('Cooperative or condominium');
  }
  
  if (unitData.isTemporary) {
    exemptions.push('Temporary/short-term tenancy');
  }
  
  if (unitData.buildingAge && unitData.buildingAge > 0 && unitData.buildingAge <= 15) {
    exemptions.push('New construction (built after 2009)');
  }
  
  // Determine if protected
  const isProtected = reasons.length > 0 && exemptions.length === 0;
  
  return Result.ok({
    protected: isProtected,
    reasons,
    exemptions,
  });
}

/**
 * Run full compliance check for a building
 * @param bbl - Borough-Block-Lot number
 * @returns Complete compliance check result
 */
export async function runComplianceCheck(bbl: string): AsyncResult<ComplianceCheckResult, AppError> {
  try {
    const formattedBBL = formatBBL(bbl);
    
    // Fetch all data in parallel
    const [hpdResult, rentStabResult, dobResult, buildingInfoResult] = await Promise.all([
      getHPDViolations(formattedBBL),
      checkRentStabilization(formattedBBL),
      getBuildingCodeViolations(formattedBBL),
      getBuildingInfo(formattedBBL),
    ]);
    
    // Extract data from results, using defaults on error
    const hpdViolations = hpdResult.success ? hpdResult.data : [];
    const rentStabRecord = rentStabResult.success ? rentStabResult.data : null;
    const dobViolations = dobResult.success ? dobResult.data : [];
    const buildingInfo = buildingInfoResult.success ? buildingInfoResult.data : null;
    
    // Calculate violation statistics
    const openViolations = hpdViolations.filter(v => 
      v.violationstatus?.toLowerCase() === 'open'
    );
    
    const classAViolations = hpdViolations.filter(v => v.class === 'A');
    const classBViolations = hpdViolations.filter(v => v.class === 'B');
    const classCViolations = hpdViolations.filter(v => v.class === 'C');
    
    // Calculate compliance score (0-100)
    // Base score of 100, deduct points for violations
    let complianceScore = 100;
    
    // Deduct for open violations
    complianceScore -= openViolations.length * 5; // -5 per open violation
    
    // Deduct for class C violations (most serious)
    complianceScore -= classCViolations.length * 3;
    
    // Deduct for class B violations
    complianceScore -= classBViolations.length * 2;
    
    // Deduct for class A violations
    complianceScore -= classAViolations.length * 1;
    
    // Ensure score stays within 0-100
    complianceScore = Math.max(0, Math.min(100, complianceScore));
    
    // Determine Good Cause protection based on building info
    const buildingAge = buildingInfo?.yearbuilt 
      ? new Date().getFullYear() - parseInt(buildingInfo.yearbuilt) 
      : undefined;
    const unitCount = buildingInfo?.unitsres 
      ? parseInt(buildingInfo.unitsres) 
      : 0;
    
    // Assume not owner-occupied for this check (would need actual data)
    const goodCauseResult = getGoodCauseEvictionEligibility({
      monthlyRent: 3000, // Default assumption
      unitCount,
      isOwnerOccupied: false,
      buildingAge,
    });
    
    if (!goodCauseResult.success) {
      return Result.err(goodCauseResult.error);
    }
    
    const goodCauseCheck = goodCauseResult.data;
    
    // Build address from building info
    const address = buildingInfo?.address || 
      (hpdViolations[0]?.housenumber && hpdViolations[0]?.streetname 
        ? `${hpdViolations[0].housenumber} ${hpdViolations[0].streetname}` 
        : 'Unknown Address');
    
    return Result.ok({
      bbl: formattedBBL,
      address,
      hpdViolations,
      dobViolations,
      rentStabilized: !!rentStabRecord,
      rentStabilizationDetails: rentStabRecord || undefined,
      buildingInfo: buildingInfo || undefined,
      goodCauseProtected: goodCauseCheck.protected,
      complianceScore,
      totalViolations: hpdViolations.length,
      openViolations: openViolations.length,
      classAViolations: classAViolations.length,
      classBViolations: classBViolations.length,
      classCViolations: classCViolations.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error running compliance check:', error);
    return Result.err(createError(
      'COMPLIANCE_CHECK_FAILED',
      error instanceof Error ? error.message : 'Failed to run compliance check',
      { bbl }
    ));
  }
}

/**
 * Format BBL to ensure it's 10 digits
 * BBL format: 1 digit borough + 5 digits block + 4 digits lot
 */
function formatBBL(bbl: string): string {
  // Remove any non-numeric characters
  const numericBBL = bbl.replace(/\D/g, '');
  
  // If already 10 digits, return as-is
  if (numericBBL.length === 10) {
    return numericBBL;
  }
  
  // If less than 10 digits, pad with zeros
  if (numericBBL.length < 10) {
    return numericBBL.padStart(10, '0');
  }
  
  // If more than 10 digits, take the last 10
  return numericBBL.slice(-10);
}

/**
 * Convert borough name to code
 */
function getBoroughCode(borough: string): string | null {
  const boroughMap: { [key: string]: string } = {
    'manhattan': '1',
    'new york': '1',
    'bronx': '2',
    'brooklyn': '3',
    'kings': '3',
    'queens': '4',
    'staten island': '5',
    'richmond': '5',
  };
  
  const normalizedBorough = borough.toLowerCase().trim();
  return boroughMap[normalizedBorough] || null;
}

/**
 * Parse BBL into components
 */
export function parseBBL(bbl: string): Result<{ borough: string; block: string; lot: string }, AppError> {
  const formattedBBL = formatBBL(bbl);
  return Result.ok({
    borough: formattedBBL.slice(0, 1),
    block: formattedBBL.slice(1, 6),
    lot: formattedBBL.slice(6, 10),
  });
}

/**
 * Get borough name from code
 */
export function getBoroughName(code: string): Result<string, AppError> {
  const boroughNames: { [key: string]: string } = {
    '1': 'Manhattan',
    '2': 'Bronx',
    '3': 'Brooklyn',
    '4': 'Queens',
    '5': 'Staten Island',
  };
  
  const name = boroughNames[code];
  if (!name) {
    return Result.err(createError('INVALID_BOROUGH_CODE', `Invalid borough code: ${code}`));
  }
  
  return Result.ok(name);
}

/**
 * Get violation class description
 */
export function getViolationClassDescription(classCode: string): Result<string, AppError> {
  const descriptions: { [key: string]: string } = {
    'A': 'Class A - Non-hazardous',
    'B': 'Class B - Hazardous',
    'C': 'Class C - Immediately Hazardous',
  };
  
  const description = descriptions[classCode?.toUpperCase()];
  if (!description) {
    return Result.err(createError('INVALID_VIOLATION_CLASS', `Invalid violation class: ${classCode}`));
  }
  
  return Result.ok(description);
}

// Export service object for convenience
export const NYCOpenDataService = {
  getHPDViolations,
  checkRentStabilization,
  getBuildingCodeViolations,
  getBuildingInfo,
  searchBuildingByAddress,
  getGoodCauseEvictionEligibility,
  runComplianceCheck,
  parseBBL,
  getBoroughName,
  getViolationClassDescription,
  GOOD_CAUSE_RENT_THRESHOLD_2025,
};

export default NYCOpenDataService;
