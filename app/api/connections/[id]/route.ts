import { NextRequest, NextResponse } from 'next/server';
import { deleteConnection } from '@/lib/db';

/**
 * DELETE /api/connections/[id]
 * Delete a manual connection by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const connectionId = parseInt(id, 10);

    if (isNaN(connectionId)) {
      return NextResponse.json(
        { error: 'Invalid connection ID' },
        { status: 400 }
      );
    }

    const deleted = await deleteConnection(connectionId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Connection deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}

