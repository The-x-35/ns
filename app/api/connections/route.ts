import { NextRequest, NextResponse } from 'next/server';
import { getConnections, addConnection } from '@/lib/db';

/**
 * GET /api/connections
 * Fetch all manual connections
 */
export async function GET() {
  try {
    const connections = await getConnections();
    return NextResponse.json({ connections });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/connections
 * Add a new manual connection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ens_name_1, ens_name_2 } = body;

    // Validate input
    if (!ens_name_1 || !ens_name_2) {
      return NextResponse.json(
        { error: 'Both ens_name_1 and ens_name_2 are required' },
        { status: 400 }
      );
    }

    // Basic ENS name validation (should end with .eth)
    const ensRegex = /^[a-z0-9-]+\.eth$/i;
    if (!ensRegex.test(ens_name_1) || !ensRegex.test(ens_name_2)) {
      return NextResponse.json(
        { error: 'Invalid ENS name format' },
        { status: 400 }
      );
    }

    const result = await addConnection(ens_name_1, ens_name_2);
    
    return NextResponse.json({
      success: true,
      id: result.id,
      message: 'Connection added successfully',
    });
  } catch (error: any) {
    console.error('Error adding connection:', error);
    
    if (error.message === 'Connection already exists') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    if (error.message === 'Cannot create connection to self') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add connection' },
      { status: 500 }
    );
  }
}

