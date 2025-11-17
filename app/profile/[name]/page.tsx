import { getENSProfile } from '@/lib/ens';
import { notFound } from 'next/navigation';
import ProfileDisplay from '@/app/profile/components/ProfileDisplay';
import LiquidEtherWrapper from '@/app/profile/components/LiquidEtherWrapper';

interface ProfilePageProps {
  params: Promise<{
    name: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { name } = await params;
  const ensName = decodeURIComponent(name);

  // Fetch ENS profile data
  const profile = await getENSProfile(ensName);

  // If profile not found, show 404
  if (!profile) {
    notFound();
  }

  return (
    <LiquidEtherWrapper>
      <ProfileDisplay profile={profile} />
    </LiquidEtherWrapper>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProfilePageProps) {
  const { name } = await params;
  const ensName = decodeURIComponent(name);
  
  return {
    title: `${ensName} - ENS Profile`,
    description: `View the ENS profile for ${ensName}`,
  };
}

