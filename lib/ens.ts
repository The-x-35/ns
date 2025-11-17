import { ethers } from 'ethers';

// Common ENS text record keys
const TEXT_RECORD_KEYS = [
  'avatar',
  'description',
  'email',
  'url',
  'com.twitter',
  'com.github',
  'com.discord',
  'com.reddit',
  'com.telegram',
  'org.telegram',
  'name',
  'location',
  'notice',
  'keywords',
  'com.linkedin',
  'website',
];

export interface ENSProfile {
  ensName: string;
  address: string;
  avatar?: string;
  primaryName?: string;
  textRecords: Record<string, string>;
}

// Create provider using Alchemy RPC
function getProvider(): ethers.JsonRpcProvider {
  // Using Alchemy Ethereum mainnet RPC
  return new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/9pdd7Hq-XFiSUQeJ97Gg0', 1, {
    staticNetwork: ethers.Network.from(1), // Ethereum mainnet
  });
}

/**
 * Resolve an ENS name to an Ethereum address
 */
export async function resolveENSName(ensName: string): Promise<string | null> {
  try {
    const provider = getProvider();
    const address = await provider.resolveName(ensName);
    return address;
  } catch (error) {
    console.error('Error resolving ENS name:', error);
    return null;
  }
}

/**
 * Get the primary ENS name for an address (reverse resolution)
 */
export async function reverseLookup(address: string): Promise<string | null> {
  try {
    const provider = getProvider();
    const ensName = await provider.lookupAddress(address);
    return ensName;
  } catch (error) {
    console.error('Error performing reverse lookup:', error);
    return null;
  }
}

/**
 * Fetch a specific text record for an ENS name
 */
export async function getTextRecord(
  ensName: string,
  key: string
): Promise<string | null> {
  try {
    const provider = getProvider();
    const resolver = await provider.getResolver(ensName);
    
    if (!resolver) {
      return null;
    }

    const value = await resolver.getText(key);
    return value || null;
  } catch (error) {
    console.error(`Error fetching text record ${key}:`, error);
    return null;
  }
}

/**
 * Fetch all text records for an ENS name
 */
export async function getAllTextRecords(
  ensName: string
): Promise<Record<string, string>> {
  const records: Record<string, string> = {};

  try {
    const provider = getProvider();
    const resolver = await provider.getResolver(ensName);
    
    if (!resolver) {
      return records;
    }

    // Fetch all text records in parallel
    const recordPromises = TEXT_RECORD_KEYS.map(async (key) => {
      try {
        const value = await resolver.getText(key);
        if (value) {
          return { key, value };
        }
      } catch (error) {
        // Silently fail for individual records
        console.error(`Failed to fetch ${key}:`, error);
      }
      return null;
    });

    const results = await Promise.all(recordPromises);
    
    // Build records object from results
    results.forEach((result) => {
      if (result && result.value) {
        records[result.key] = result.value;
      }
    });

    return records;
  } catch (error) {
    console.error('Error fetching text records:', error);
    return records;
  }
}

/**
 * Get the avatar for an ENS name
 * Handles IPFS, HTTP, and NFT avatars
 */
export async function getAvatar(ensName: string): Promise<string | null> {
  try {
    const provider = getProvider();
    const resolver = await provider.getResolver(ensName);
    
    if (!resolver) {
      return null;
    }

    // Try to get avatar using ethers built-in avatar resolution
    const avatar = await resolver.getAvatar();
    
    if (avatar) {
      // Avatar can be a string URL or an object with url property
      return typeof avatar === 'string' ? avatar : avatar;
    }

    // Fallback: try to get avatar text record directly
    const avatarRecord = await resolver.getText('avatar');
    
    if (avatarRecord) {
      // Convert IPFS to HTTP gateway if needed
      if (avatarRecord.startsWith('ipfs://')) {
        return avatarRecord.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }
      return avatarRecord;
    }

    return null;
  } catch (error) {
    console.error('Error fetching avatar:', error);
    return null;
  }
}

/**
 * Get complete ENS profile information
 */
export async function getENSProfile(ensName: string): Promise<ENSProfile | null> {
  try {
    // Normalize ENS name
    const normalizedName = ensName.toLowerCase().trim();
    
    // Resolve ENS name to address
    const address = await resolveENSName(normalizedName);
    
    if (!address) {
      return null;
    }

    // Fetch all data in parallel
    const [avatar, textRecords, primaryName] = await Promise.all([
      getAvatar(normalizedName),
      getAllTextRecords(normalizedName),
      reverseLookup(address),
    ]);

    return {
      ensName: normalizedName,
      address,
      avatar: avatar || undefined,
      primaryName: primaryName || undefined,
      textRecords,
    };
  } catch (error) {
    console.error('Error fetching ENS profile:', error);
    return null;
  }
}

