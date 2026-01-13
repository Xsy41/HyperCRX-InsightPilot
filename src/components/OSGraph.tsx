/**
 * OSGraph component for displaying operating system usage graphs via iframe
 * @zh-CN OSGraph组件，用于通过iframe显示操作系统使用情况图表
 */
import React, { useEffect, useRef, useState } from 'react';

/**
 * OSGraph component props
 */
export interface OSGraphProps {
  /**
   * Share identifier used for loading sequencing
   */
  readonly shareId: number;
  /**
   * CSS style for OSGraph container
   */
  readonly style?: React.CSSProperties;
  /**
   * URL of the OS graph to display in the iframe
   */
  readonly OSGraphUrl: string;
  /**
   * Loading state callback
   */
  readonly onLoadingChange?: (loading: boolean) => void;
  /**
   * Error state callback
   */
  readonly onError?: (error: Error) => void;
  /**
   * Iframe title for accessibility
   */
  readonly title?: string;
  /**
   * Loading delay in milliseconds for each iframe
   * @default 500
   */
  readonly loadingDelay?: number;
}

/**
 * OSGraph component for displaying operating system usage graphs
 */
const OSGraph: React.FC<OSGraphProps> = ({
  shareId,
  style = {},
  OSGraphUrl,
  onLoadingChange,
  onError,
  title = 'OS Graph',
  loadingDelay = 500,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Load the iframe with the OS graph
   */
  const loadIframe = () => {
    try {
      if (iframeRef.current) {
        setIsLoading(true);
        onLoadingChange?.(true);

        iframeRef.current.src = OSGraphUrl;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(`Failed to load OS graph: ${String(error)}`);
      onError?.(err);
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  /**
   * Handle iframe load event
   */
  const handleLoad = () => {
    setIsLoading(false);
    onLoadingChange?.(false);
  };

  /**
   * Handle iframe error event
   */
  const handleError = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    const error = new Error('Failed to load OS graph iframe');
    onError?.(error);
    setIsLoading(false);
    onLoadingChange?.(false);
  };

  /**
   * Set up the iframe loading sequence
   */
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Calculate loading delay based on shareId
    const delay = shareId < 3 ? shareId * loadingDelay : 0;

    // Schedule iframe loading with delay
    timeoutRef.current = setTimeout(loadIframe, delay);

    // Clean up timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [OSGraphUrl, shareId, loadingDelay]);

  /**
   * Default style for the iframe
   */
  const defaultStyle: React.CSSProperties = {
    border: 'none',
    width: '100%',
    height: '100%',
    display: isLoading ? 'none' : 'block',
  };

  /**
   * Combined style with defaults and user-provided style
   */
  const combinedStyle = {
    ...defaultStyle,
    ...style,
  };

  return (
    <div className="hypertrons-crx-border" style={{ position: 'relative', ...style }}>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '14px',
            color: '#666',
          }}
        >
          Loading OS Graph...
        </div>
      )}
      <iframe
        ref={iframeRef}
        src=""
        style={combinedStyle}
        title={title}
        onLoad={handleLoad}
        onError={handleError}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
};

export default OSGraph;
