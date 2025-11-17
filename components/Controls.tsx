import React from 'react';
import Icon from './Icon';

interface ControlsProps {
  isSoundOn: boolean;
  isLoading: boolean;
  isTranslationDisabled: boolean;
  isExplainDisabled: boolean;
  onSoundToggle: () => void;
  onUpload: () => void;
  onTranslate: () => void;
  onExplainTopic: () => void;
}

const ControlButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  ariaLabel: string;
}> = ({ onClick, disabled, children, ariaLabel }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className="flex items-center justify-center p-3 bg-brand-surface rounded-full text-brand-primary hover:bg-brand-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-background focus:ring-brand-secondary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {children}
  </button>
);

const ToggleSwitch: React.FC<{
  isOn: boolean;
  onToggle: () => void;
  ariaLabel: string;
  disabled?: boolean;
}> = ({ isOn, onToggle, ariaLabel, disabled }) => (
  <button
    role="switch"
    aria-checked={isOn}
    aria-label={ariaLabel}
    onClick={onToggle}
    disabled={disabled}
    className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-background focus:ring-brand-secondary disabled:opacity-50 ${
      isOn ? 'bg-brand-secondary' : 'bg-gray-500'
    }`}
  >
    <span className="sr-only">{ariaLabel}</span>
    <span
      className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
        isOn ? 'translate-x-7' : 'translate-x-1'
      }`}
    />
  </button>
);

const Controls: React.FC<ControlsProps> = ({
  isSoundOn,
  isLoading,
  isTranslationDisabled,
  isExplainDisabled,
  onSoundToggle,
  onUpload,
  onTranslate,
  onExplainTopic,
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 p-2 bg-brand-surface/80 backdrop-blur-sm rounded-full shadow-lg flex items-center gap-4">
      <div className="flex items-center gap-2 p-1 px-2 bg-brand-surface rounded-full">
        <span className={`font-semibold text-md transition-colors ${!isSoundOn ? 'text-brand-primary' : 'text-brand-text-secondary'}`}>Off</span>
        <ToggleSwitch
            isOn={isSoundOn}
            onToggle={onSoundToggle}
            disabled={isLoading}
            ariaLabel={isSoundOn ? 'Turn sound off' : 'Turn sound on'}
        />
        <span className={`font-semibold text-md transition-colors ${isSoundOn ? 'text-brand-primary' : 'text-brand-text-secondary'}`}>On</span>
      </div>

      <ControlButton 
        onClick={onUpload} 
        disabled={isLoading}
        ariaLabel="Upload a custom mind map file"
      >
        <Icon name="upload" className="w-6 h-6" />
        <span className="ml-2 font-semibold text-lg">Upload</span>
      </ControlButton>

      <ControlButton
        onClick={onExplainTopic}
        disabled={isExplainDisabled}
        ariaLabel="Explain the topic of the mind map"
      >
        <Icon name="lightbulb" className="w-6 h-6" />
        <span className="ml-2 font-semibold text-lg">Explain Topic</span>
      </ControlButton>

      <ControlButton
        onClick={onTranslate}
        disabled={isTranslationDisabled}
        ariaLabel="Translate description between English and Arabic"
      >
        <Icon name="translate" className="w-6 h-6" />
        <span className="ml-2 font-semibold text-lg">Translate</span>
      </ControlButton>
    </div>
  );
};

export default Controls;
