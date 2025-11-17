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
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Social Links
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {socialRecords.map(([key, value]) => {
            const social = SOCIAL_LINKS[key];
            const url = social.urlTemplate.replace('{{value}}', value);

            return (
              <div
                key={key}
                className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700"
              >
                <span className="text-2xl">{social.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {social.label}
                  </div>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {value}
                    </a>
                  ) : (
                    <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
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
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Additional Information
        </h2>
        <div className="space-y-4">
          {textFields.map(([key, value]) => (
            <div key={key} className="border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {TEXT_FIELD_LABELS[key] || key}
              </div>
              <div className="mt-1 text-sm text-gray-900 dark:text-white">
                {key === 'url' || key === 'website' ? (
                  <a
                    href={value.startsWith('http') ? value : `https://${value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {value}
                  </a>
                ) : key === 'email' ? (
                  <a
                    href={`mailto:${value}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
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
      {/* Back Button */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        ← Back to Search
      </Link>

      {/* Profile Header */}
      <div className="mb-8 rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="shrink-0">
            {profile.avatar && !avatarError ? (
              <Image
                src={profile.avatar}
                alt={`${profile.ensName} avatar`}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full border-4 border-blue-100 object-cover dark:border-blue-900"
                onError={() => setAvatarError(true)}
                unoptimized
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-blue-100 bg-linear-to-br from-blue-400 to-purple-500 text-4xl font-bold text-white dark:border-blue-900">
                {profile.ensName[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Name and Address */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              {profile.ensName}
            </h1>
            
            {/* Primary Name Notice */}
            {profile.primaryName && profile.primaryName !== profile.ensName && (
              <div className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Primary name: {profile.primaryName}
              </div>
            )}

            {/* Address */}
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <div className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {formatAddress(profile.address)}
              </div>
              <button
                onClick={copyAddress}
                className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            {/* Full Address (collapsed) */}
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                Show full address
              </summary>
              <div className="mt-2 break-all rounded-lg bg-gray-100 p-2 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
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
        <div className="rounded-xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400">
            No additional profile information available for this ENS name.
          </p>
        </div>
      )}
    </div>
  );
}

