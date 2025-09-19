'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, ExternalLink, Check } from 'lucide-react';

interface WhatsAppFloatingButtonProps {
  whatsappUrl: string;
  description?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
  whatsappUrl,
  description = "If you have issues and difficulties, click to join the WhatsApp community",
  position = 'bottom-right'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showChatbox, setShowChatbox] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Show button after a short delay for better UX
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    setShowChatbox(true);
    setShowTooltip(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(whatsappUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleOpenLink = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setShowChatbox(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4 sm:bottom-6 sm:left-6';
      case 'top-right':
        return 'top-4 right-4 sm:top-6 sm:right-6';
      case 'top-left':
        return 'top-4 left-4 sm:top-6 sm:left-6';
      default:
        return 'bottom-4 right-4 sm:bottom-6 sm:right-6';
    }
  };

  const getModalPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-20 left-4 sm:bottom-24 sm:left-6';
      case 'top-right':
        return 'top-20 right-4 sm:top-24 sm:right-6';
      case 'top-left':
        return 'top-20 left-4 sm:top-24 sm:left-6';
      default:
        return 'bottom-20 right-4 sm:bottom-24 sm:right-6';
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Chatbox Modal */}
      {showChatbox && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setShowChatbox(false)}>
          <div className={`fixed ${getModalPositionClasses()} z-50 animate-in slide-in-from-bottom-2 duration-300`}>
            <div 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-80 animate-in zoom-in-95 duration-200 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Arrow pointing to button */}
              <div className="absolute bottom-0 right-6 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-800 dark:border-b-gray-800 transform translate-y-full"></div>
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">WhatsApp Support</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Join our community</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChatbox(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close chatbox"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                  {description}
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">WhatsApp Group Link:</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={whatsappUrl}
                      readOnly
                      className="flex-1 text-xs bg-transparent text-gray-700 dark:text-gray-300 border-none outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      aria-label="Copy link"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-500 mt-1">Link copied to clipboard!</p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleOpenLink}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open WhatsApp</span>
                  </button>
                  <button
                    onClick={() => setShowChatbox(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button Container */}
      <div className={`fixed ${getPositionClasses()} z-50 animate-in slide-in-from-bottom-2 duration-500`}>
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full right-0 mb-3 w-72 p-4 bg-gray-900 text-white text-sm rounded-xl shadow-2xl border border-gray-700 animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="text-center">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-green-400">💬 WhatsApp Support</p>
                <button
                  onClick={() => setShowTooltip(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close tooltip"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{description}</p>
              <div className="mt-2 text-xs text-green-400 font-medium">
                Click to see the link →
              </div>
            </div>
            {/* Arrow pointing down */}
            <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
          </div>
        )}

        {/* WhatsApp Button */}
        <button
          onClick={handleClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="group relative bg-green-500 hover:bg-green-600 active:bg-green-700 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-opacity-50"
          aria-label="Join WhatsApp community for support"
        >
          {/* Actual WhatsApp Icon */}
          <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
          
          {/* Pulse animation */}
          <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20 group-hover:opacity-30"></div>
          
          {/* Ripple effect on click */}
          <div className="absolute inset-0 rounded-full bg-green-400 opacity-0 group-active:opacity-30 group-active:animate-ping"></div>
          
          {/* Notification dot */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </button>
      </div>
    </>
  );
};

export default WhatsAppFloatingButton;