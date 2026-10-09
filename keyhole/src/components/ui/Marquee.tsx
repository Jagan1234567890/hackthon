import React from 'react';
import { clsx } from 'clsx';
import { Shield, FileCode, Lock, KeyRound, HardDrive, FileText, Cpu, Terminal } from 'lucide-react';

interface MarqueeItem {
  name: string;
  category: string;
  icon: React.ElementType;
}

const DEFAULT_FORMATS: MarqueeItem[] = [
  { name: 'ZIP / ZipCrypto', category: 'Archive', icon: FileCode },
  { name: 'WinZip AES-256', category: 'Archive', icon: Lock },
  { name: '7-Zip AES-CBC', category: 'Archive', icon: FileCode },
  { name: 'RAR5 (PBKDF2-256k)', category: 'Archive', icon: Lock },
  { name: 'Adobe PDF (R=4..6)', category: 'Document', icon: FileText },
  { name: 'Office ECMA-376', category: 'Document', icon: FileText },
  { name: 'VeraCrypt (XTS-512k)', category: 'Volume', icon: HardDrive },
  { name: 'LUKS1 / LUKS2', category: 'Volume', icon: HardDrive },
  { name: 'BitLocker (FVEK)', category: 'Volume', icon: Shield },
  { name: 'OpenPGP / GPG S2K', category: 'Keyring', icon: KeyRound },
  { name: 'age Encryption', category: 'Modern', icon: Lock },
  { name: 'OpenSSH Ed25519/RSA', category: 'Key', icon: Terminal },
  { name: 'WPA2-PSK 4-Way', category: 'Network', icon: Cpu },
];

export const Marquee: React.FC<{ items?: MarqueeItem[]; className?: string }> = ({
  items = DEFAULT_FORMATS,
  className,
}) => {
  // Duplicate array to create seamless infinite loop
  const displayItems = [...items, ...items];

  return (
    <div
      className={clsx(
        'relative w-full overflow-hidden py-4 border-y border-[oklch(0.22_0.01_280/50%)] bg-[oklch(0.04_0_0/60%)] backdrop-blur-md',
        className
      )}
    >
      {/* Left/Right Vignette Fades */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[oklch(0.02_0_0)] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[oklch(0.02_0_0)] to-transparent z-10" />

      <div className="marquee-track flex gap-4">
        {displayItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280/80%)] text-xs font-mono text-[oklch(0.85_0.01_280)] shadow-sm shrink-0 hover:border-[oklch(0.4_0.12_295/60%)] transition-colors select-none"
            >
              <Icon className="w-3.5 h-3.5 text-[oklch(0.62_0.22_295)]" />
              <span className="font-semibold">{item.name}</span>
              <span className="text-[oklch(0.55_0.01_280)] text-[10px] uppercase font-sans tracking-wider">
                {item.category}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
