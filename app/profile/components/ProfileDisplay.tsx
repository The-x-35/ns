'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ENSProfile } from '@/lib/ens';

interface ProfileDisplayProps {
  profile: ENSProfile;
}

const SOCIAL_LINKS: Record<string, { label: string; icon: string; urlTemplate: string }> = {
  'com.twitter': { label: 'Twitter', icon: '𝕏', urlTemplate: 'https://twitter.com/{{value}}' },
  'com.github': { label: 'GitHub', icon: '👨‍💻', urlTemplate: 'https://github.com/{{value}}' },
  'com.discord': { label: 'Discord', icon: '💬', urlTemplate: '' },
  'com.reddit': { label: 'Reddit', icon: '🤖', urlTemplate: 'https://reddit.com/u/{{value}}' },
  'com.telegram': { label: 'Telegram', icon: '✈️', urlTemplate: 'https://t.me/{{value}}' },
  'org.telegram': { label: 'Telegram', icon: '✈️', urlTemplate: 'https://t.me/{{value}}' },
  'com.linkedin': { label: 'LinkedIn', icon: '💼', urlTemplate: 'https://linkedin.com/in/{{value}}' },
};

const TEXT_FIELD_LABELS: Record<string, string> = {
  name: 'Display Name',
  description: 'Description',
  email: 'Email',
  url: 'Website',
  website: 'Website',
  location: 'Location',
  notice: 'Notice',
  keywords: 'Keywords',
};

export default function ProfileDisplay({ profile }: ProfileDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(profile.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const renderSocialLinks = () => {
    const socialRecords = Object.entries(profile.textRecords).filter(([key]) =>
      SOCIAL_LINKS.hasOwnProperty(key)
    );

    if (socialRecords.length === 0) return null;

    return (
      <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Social Links
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {socialRecords.map(([key, value]) => {
            const social = SOCIAL_LINKS[key];
            const url = social.urlTemplate.replace('{{value}}', value);

            return (
              <div
                key={key}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-3"
              >
                <span className="text-2xl">{social.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-white/60">
                    {social.label}
                  </div>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm font-medium text-blue-300 hover:text-blue-200 hover:underline"
                    >
                      {value}
                    </a>
                  ) : (
                    <div className="truncate text-sm font-medium text-white">
                      {value}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTextFields = () => {
    const textFields = Object.entries(profile.textRecords).filter(
      ([key]) => !SOCIAL_LINKS.hasOwnProperty(key) && key !== 'avatar'
    );

    if (textFields.length === 0) return null;

    return (
      <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Additional Information
        </h2>
        <div className="space-y-4">
          {textFields.map(([key, value]) => (
            <div key={key} className="border-b border-white/10 pb-3 last:border-0">
              <div className="text-xs font-medium uppercase tracking-wide text-white/60">
                {TEXT_FIELD_LABELS[key] || key}
              </div>
              <div className="mt-1 text-sm text-white">
                {key === 'url' || key === 'website' ? (
                  <a
                    href={value.startsWith('http') ? value : `https://${value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 hover:underline"
                  >
                    {value}
                  </a>
                ) : key === 'email' ? (
                  <a
                    href={`mailto:${value}`}
                    className="text-blue-300 hover:text-blue-200 hover:underline"
                  >
                    {value}
                  </a>
                ) : (
                  <span className="wrap-break-word">{value}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
        >
          ← Back to Search
        </Link>
        <Link
          href="/network"
          className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
        >
          Network Graph →
        </Link>
      </div>

      {/* Profile Header */}
      <div className="mb-8 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-8 shadow-lg">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="shrink-0">
            {profile.avatar && !avatarError ? (
              <Image
                src={profile.avatar}
                alt={`${profile.ensName} avatar`}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full border-4 border-white/20 object-cover"
                onError={() => setAvatarError(true)}
                unoptimized
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20 bg-green-500 text-4xl font-bold text-white">
                {profile.ensName[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Name and Address */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="mb-2 text-3xl font-bold text-white">
              {profile.ensName}
            </h1>
            
            {/* Primary Name Notice */}
            {profile.primaryName && profile.primaryName !== profile.ensName && (
              <div className="mb-3 inline-block rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
                Primary name: {profile.primaryName}
              </div>
            )}

            {/* Address */}
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-2 font-mono text-sm text-white">
                {formatAddress(profile.address)}
              </div>
              <button
                onClick={copyAddress}
                className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            {/* Full Address (collapsed) */}
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-white/60 hover:text-white/80">
                Show full address
              </summary>
              <div className="mt-2 break-all rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-2 font-mono text-xs text-white">
                {profile.address}
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Social Links Section */}
      {renderSocialLinks()}

      {/* Additional Information Section */}
      <div className="mt-6">{renderTextFields()}</div>

      {/* No Data Message */}
      {Object.keys(profile.textRecords).length === 0 && (
        <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-8 text-center shadow-lg">
          <p className="text-white/80">
            No additional profile information available for this ENS name.
          </p>
        </div>
      )}
    </div>
  );
}

