# Image Optimization Guide

## Quick Win #4: Image Optimization

### What Was Configured

**Next.js Image Configuration:**

- Modern formats: AVIF and WebP
- Responsive device sizes
- Image caching (60 seconds minimum)
- SVG security settings

### How to Use

#### Replace `<img>` tags with Next.js `<Image>`

**Before:**

```tsx
<img src="/logo.png" alt="Logo" width="200" height="100" />
```

**After:**

```tsx
import Image from 'next/image';

<Image 
    src="/logo.png" 
    alt="Logo" 
    width={200} 
    height={100}
    priority // For above-fold images
/>
```

### Benefits

- ✅ Automatic format conversion (AVIF/WebP)
- ✅ Responsive images for different screen sizes
- ✅ Lazy loading by default
- ✅ Blur placeholder support
- ✅ 20-30% smaller file sizes

### Examples

#### Hero Image (Above Fold)

```tsx
<Image 
    src="/hero.jpg" 
    alt="Hero" 
    width={1920} 
    height={1080}
    priority
    quality={90}
/>
```

#### Profile Picture

```tsx
<Image 
    src={user.avatar} 
    alt={user.name} 
    width={64} 
    height={64}
    className="rounded-full"
/>
```

#### Background Image

```tsx
<Image 
    src="/background.jpg" 
    alt="" 
    fill
    style={{ objectFit: 'cover' }}
    quality={75}
/>
```

### Dynamic Imports for Heavy Components

```tsx
import dynamic from 'next/dynamic';

// Lazy load chart component
const ReportChart = dynamic(
    () => import('@/features/analytics/ReportChart'),
    { 
        loading: () => <div>Loading chart...</div>,
        ssr: false 
    }
);

// Lazy load PDF viewer
const PDFViewer = dynamic(
    () => import('@/components/PDFViewer'),
    { ssr: false }
);
```

### Expected Results

- Bundle size reduced by 20-30%
- Lighthouse performance score > 90
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
