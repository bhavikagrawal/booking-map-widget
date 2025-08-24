import * as React from 'react';

// Simple shim to replace next/image in the standalone widget bundle.
// It forwards all props to a plain <img>. Provides a compatible default export signature.
// NOTE: This is intentionally lightweight; extend if you need more behavior.
export interface ShimImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  // next/image specific props we ignore but allow so imports compile
  fill?: boolean;
  priority?: boolean;
  quality?: number | string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  loader?: any;
  unoptimized?: boolean;
}

const ShimImage = React.forwardRef<HTMLImageElement, ShimImageProps>(function ShimImage(props, ref) {
  const { placeholder, blurDataURL, fill, style, ...rest } = props;
  const finalStyle: React.CSSProperties | undefined = fill ? { position: 'absolute', inset: 0, objectFit: 'cover' as React.CSSProperties['objectFit'], width: '100%', height: '100%', ...(style as React.CSSProperties) } : (style as React.CSSProperties | undefined);
  return <img ref={ref} style={finalStyle} {...rest} />;
});

export default ShimImage;
