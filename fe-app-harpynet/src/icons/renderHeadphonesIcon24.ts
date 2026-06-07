import { svgEl } from '../helpers/svgEl';

export function renderHeadphonesIcon24() {
  return svgEl(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '24',
      height: '24',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    },
    [
      svgEl('path', {
        d: 'M4 14a8 8 0 0 1 16 0',
      }),
      svgEl('path', {
        d: 'M18 19c0 1.1-.9 2-2 2h-1v-6h3a2 2 0 0 1 2 2v2h-2Z',
      }),
      svgEl('path', {
        d: 'M6 19c0 1.1.9 2 2 2h1v-6H6a2 2 0 0 0-2 2v2h2Z',
      }),
    ],
  );
}
