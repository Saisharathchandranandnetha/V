import { DetailedHTMLProps, HTMLAttributes } from 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
                src?: string;
                poster?: string;
                'auto-rotate'?: boolean;
                'camera-controls'?: boolean;
                exposure?: string;
                alt?: string;
                slot?: string;
            };
        }
    }
}
