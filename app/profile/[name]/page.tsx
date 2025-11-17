import { getENSProfile } from '@/lib/ens';
import { notFound } from 'next/navigation';
import ProfileDisplay from '@/app/profile/components/ProfileDisplay';

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
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-black dark:to-purple-950">
      <ProfileDisplay profile={profile} />
    </div>
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

