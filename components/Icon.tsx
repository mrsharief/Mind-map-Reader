import React from 'react';

interface IconProps {
  name: 'sound-on' | 'sound-off' | 'download' | 'language' | 'upload' | 'translate' | 'lightbulb';
  className?: string;
}

const languageIconPath = (
  <path 
   strokeLinecap="round" 
   strokeLinejoin="round" 
   strokeWidth="2" 
   d="M3 5h12M9 3v2m0 4V5m0 4a2 2 0 100 4 2 2 0 000-4zm-7 1a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm12-1a1 1 0 011-1h2a1 1 0 011 1v3a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3z" />
);

const ICONS: Record<IconProps['name'], React.ReactNode> = {
  'sound-on': (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
    />
  ),
  'sound-off': (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 11a7.5 7.5 0 01-7.5 7.5M11 5.084A7.458 7.458 0 005.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v.084m-2 5.892L4 4m12 12L4 4"
    />
  ),
  download: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  ),
  language: languageIconPath,
  translate: languageIconPath,
  upload: (
    <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  ),
  lightbulb: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 01-8.486 0M12 15a5 5 0 01-5-5 5 5 0 015-5 5 5 0 015 5 5 5 0 01-5 5z"
    />
  ),
};

const Icon: React.FC<IconProps> = ({ name, className = 'w-6 h-6' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      {ICONS[name]}
    </svg>
  );
};

export default Icon;
