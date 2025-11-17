import { getENSProfile, ENSProfile } from './ens';

export interface Connection {
  from: string;
  to: string;
  type: 'social' | 'onchain' | 'mutual' | 'none';
  strength: number;
  details: string[];
  transfers?: TransferDetail[];
  source: 'auto' | 'friend';
  id?: number; // Database ID for friend relationships
}

export interface NetworkNode {
  id: string;
  ensName: string;
  address: string;
  avatar?: string;
  profile?: ENSProfile;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  connections: Connection[];
}

/**
 * Parse ENS names from text input and generate all pairs
 * Format: comma-separated list like "name1, name2, name3"
 */
export function parseENSPairs(input: string): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  
  // Split by commas and newlines to get all ENS names
  const names = input
    .split(/[,\n]/)
    .map(s => s.trim())
    .filter(s => s && s.length > 0);
  
  // Generate all pairs (combinations) from the list
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      pairs.push([names[i], names[j]]);
    }
  }
  
  return pairs;
}

/**
 * Get all unique ENS names from pairs
 */
export function getUniqueENSNames(pairs: Array<[string, string]>): string[] {
  const names = new Set<string>();
  pairs.forEach(([name1, name2]) => {
    names.add(name1.toLowerCase());
    names.add(name2.toLowerCase());
  });
  return Array.from(names);
}

/**
 * Fetch all ENS profiles for given names
 */
export async function fetchAllProfiles(
  ensNames: string[]
): Promise<Map<string, ENSProfile>> {
  const profiles = new Map<string, ENSProfile>();
  
  // Fetch profiles in parallel
  const results = await Promise.allSettled(
    ensNames.map(name => getENSProfile(name))
  );
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      profiles.set(ensNames[index].toLowerCase(), result.value);
    }
  });
  
  return profiles;
}

/**
 * Check if two ENS profiles have matching social handles
 */
function findSocialConnections(
  profile1: ENSProfile,
  profile2: ENSProfile
): string[] {
  const connections: string[] = [];
  const socialKeys = ['com.twitter', 'com.github', 'com.discord', 'com.linkedin'];
  
  for (const key of socialKeys) {
    const handle1 = profile1.textRecords[key]?.toLowerCase();
    const handle2 = profile2.textRecords[key]?.toLowerCase();
    
    if (handle1 && handle2 && handle1 === handle2) {
      connections.push(`Same ${key.split('.')[1]} handle: ${handle1}`);
    }
  }
  
  return connections;
}

/**
 * Check if ENS names reference each other in text records
 */
function checkMutualReferences(
  profile1: ENSProfile,
  profile2: ENSProfile
): string[] {
  const references: string[] = [];
  
  // Check all text records for mentions
  Object.values(profile1.textRecords).forEach(value => {
    if (value.toLowerCase().includes(profile2.ensName)) {
      references.push(`${profile1.ensName} mentions ${profile2.ensName}`);
    }
  });
  
  Object.values(profile2.textRecords).forEach(value => {
    if (value.toLowerCase().includes(profile1.ensName)) {
      references.push(`${profile2.ensName} mentions ${profile1.ensName}`);
    }
  });
  
  return references;
}

export interface TransferDetail {
  hash: string;
  from: string;
  to: string;
  value?: string;
  asset?: string;
}

/**
 * Check for transactions using Alchemy Enhanced API
 */
async function checkAlchemyTransfers(
  address1: string,
  address2: string
): Promise<TransferDetail[]> {
  try {
    const alchemyUrl = 'https://eth-mainnet.g.alchemy.com/v2/9pdd7Hq-XFiSUQeJ97Gg0';
    const transfers: TransferDetail[] = [];
    
    // Check transfers from address1 to address2
    const response1 = await fetch(alchemyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromAddress: address1,
          toAddress: address2,
          category: ['external', 'erc20', 'erc721', 'erc1155'],
          maxCount: '0x5',
          withMetadata: true,
        }],
      }),
    });
    
    const data1 = await response1.json();
    if (data1.result?.transfers) {
      data1.result.transfers.forEach((transfer: {hash: string; from: string; to: string; value?: string; asset?: string}) => {
        transfers.push({
          hash: transfer.hash,
          from: transfer.from,
          to: transfer.to,
          value: transfer.value?.toString(),
          asset: transfer.asset || 'ETH',
        });
      });
    }
    
    // Check transfers from address2 to address1
    const response2 = await fetch(alchemyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromAddress: address2,
          toAddress: address1,
          category: ['external', 'erc20', 'erc721', 'erc1155'],
          maxCount: '0x5',
          withMetadata: true,
        }],
      }),
    });
    
    const data2 = await response2.json();
    if (data2.result?.transfers) {
      data2.result.transfers.forEach((transfer: {hash: string; from: string; to: string; value?: string; asset?: string}) => {
        transfers.push({
          hash: transfer.hash,
          from: transfer.from,
          to: transfer.to,
          value: transfer.value?.toString(),
          asset: transfer.asset || 'ETH',
        });
      });
    }
    
    return transfers;
  } catch (error) {
    console.error('Error checking Alchemy transfers:', error);
    return [];
  }
}

/**
 * Check for on-chain connections between two addresses
 */
async function analyzeOnChainConnection(
  address1: string,
  address2: string
): Promise<{ details: string[]; transfers: TransferDetail[] }> {
  const details: string[] = [];
  let transfers: TransferDetail[] = [];
  
  try {
    // Check transaction history using Alchemy
    transfers = await checkAlchemyTransfers(address1, address2);
    
    if (transfers.length > 0) {
      details.push(`${transfers.length} transfer${transfers.length > 1 ? 's' : ''} found`);
    }
  } catch (error) {
    console.error('Error analyzing on-chain connection:', error);
  }
  
  return { details, transfers };
}

// Removed old analyzeConnections function - using analyzeConnectionsBatch instead

/**
 * Batch analyze connections with rate limiting
 */
async function analyzeConnectionsBatch(
  pairs: Array<[string, string]>,
  profiles: Map<string, ENSProfile>
): Promise<Connection[]> {
  const connections: Connection[] = [];
  
  // Process pairs in batches to avoid rate limits
  const batchSize = 3;
  for (let i = 0; i < pairs.length; i += batchSize) {
    const batch = pairs.slice(i, i + batchSize);
    const batchConnections = await Promise.all(
      batch.map(async ([name1, name2]) => {
        const profile1 = profiles.get(name1.toLowerCase());
        const profile2 = profiles.get(name2.toLowerCase());
        
        if (!profile1 || !profile2) {
          return null;
        }
        
        const details: string[] = [];
        let connectionType: 'social' | 'onchain' | 'mutual' | 'none' = 'none';
        
        // Check social connections
        const socialConnections = findSocialConnections(profile1, profile2);
        details.push(...socialConnections);
        
        // Check mutual references
        const mutualRefs = checkMutualReferences(profile1, profile2);
        details.push(...mutualRefs);
        
        // Check on-chain connections
        const onChainResult = await analyzeOnChainConnection(
          profile1.address,
          profile2.address
        );
        details.push(...onChainResult.details);
        
        // Determine connection type - prioritize on-chain (most verifiable)
        if (onChainResult.details.length > 0) {
          connectionType = 'onchain';
        } else if (socialConnections.length > 0 || mutualRefs.length > 0) {
          connectionType = 'social';
        } else {
          connectionType = 'none'; // No connections found
        }
        
        // Skip if no connection found
        if (connectionType === 'none') {
          return null;
        }
        
        // Calculate connection strength
        const strength = Math.min(
          (socialConnections.length * 0.3 + 
           mutualRefs.length * 0.3 + 
           onChainResult.details.length * 0.4),
          1
        );
        
        return {
          from: name1.toLowerCase(),
          to: name2.toLowerCase(),
          type: connectionType,
          strength: Math.max(strength, 0.2),
          details: details.length > 0 ? details : [],
          transfers: onChainResult.transfers.length > 0 ? onChainResult.transfers : undefined,
        };
      })
    );
    
    // Filter out null results (no connections found)
    connections.push(...batchConnections.filter(c => c !== null) as Connection[]);
    
    // Small delay between batches
    if (i + batchSize < pairs.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return connections;
}

/**
 * Fetch friend relationships from database
 */
export async function fetchFriendConnections(): Promise<Connection[]> {
  try {
    const response = await fetch('/api/connections');
    if (!response.ok) {
      throw new Error('Failed to fetch friend relationships');
    }
    const data = await response.json();
    
    return data.connections.map((conn: { id: number; ens_name_1: string; ens_name_2: string }) => ({
      from: conn.ens_name_1.toLowerCase(),
      to: conn.ens_name_2.toLowerCase(),
      type: 'none' as const,
      strength: 1.0,
      details: ['Friend relationship'],
      source: 'friend' as const,
      id: conn.id,
    }));
  } catch (error) {
    console.error('Error fetching friend relationships:', error);
    return [];
  }
}

/**
 * Build complete network graph from ENS names
 */
export async function buildNetworkGraph(
  pairsInput: string,
  includeManualConnections: boolean = true
): Promise<NetworkGraph> {
  // Parse names and generate all pairs
  const pairs = parseENSPairs(pairsInput);
  
  if (pairs.length === 0) {
    throw new Error('No valid ENS names found in input. Please enter at least 2 names.');
  }
  
  // Get unique names
  const uniqueNames = getUniqueENSNames(pairs);
  
  // Fetch friend relationships if requested
  let friendConnections: Connection[] = [];
  if (includeManualConnections) {
    friendConnections = await fetchFriendConnections();
    
    // Add ENS names from friend relationships to the list
    friendConnections.forEach(conn => {
      if (!uniqueNames.includes(conn.from)) {
        uniqueNames.push(conn.from);
      }
      if (!uniqueNames.includes(conn.to)) {
        uniqueNames.push(conn.to);
      }
    });
  }
  
  // Fetch all profiles
  const profiles = await fetchAllProfiles(uniqueNames);
  
  if (profiles.size === 0) {
    throw new Error('No valid ENS profiles found');
  }
  
  // Build nodes
  const nodes: NetworkNode[] = Array.from(profiles.entries()).map(([name, profile]) => ({
    id: name,
    ensName: profile.ensName,
    address: profile.address,
    avatar: profile.avatar,
    profile,
  }));
  
  // Analyze auto connections with batching
  const autoConnections = await analyzeConnectionsBatch(pairs, profiles);
  
  // Mark auto connections as auto
  autoConnections.forEach(conn => {
    conn.source = 'auto';
  });
  
  // Merge auto and friend connections
  const allConnections = [...autoConnections, ...friendConnections];
  
  return {
    nodes,
    connections: allConnections,
  };
}

/**
 * Update friend relationships in an existing graph without re-analyzing
 * This is much faster than rebuilding the entire graph
 */
export async function updateFriendRelationships(
  existingGraph: NetworkGraph
): Promise<NetworkGraph> {
  // Fetch updated friend relationships
  const friendConnections = await fetchFriendConnections();
  
  // Filter out old friend relationships and keep auto connections
  const autoConnections = existingGraph.connections.filter(
    conn => conn.source === 'auto'
  );
  
  // Merge auto connections with updated friend relationships
  const allConnections = [...autoConnections, ...friendConnections];
  
  return {
    nodes: existingGraph.nodes, // Keep existing nodes
    connections: allConnections,
  };
}

