import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { person } from '@/lib/profile';

// The share card for every route, rendered once at build time. Colors mirror
// the tokens in app/globals.css (satori cannot read CSS variables), the fonts
// are latin subsets of the site's two families, and every fact on the card
// comes from public/llms.txt via lib/profile.ts.
export const alt = `${person.name}, ${person.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const color = {
  paper: '#FCFCFB',
  panel: '#F3F4F6',
  ink: '#0E0F11',
  ink2: '#3A3D44',
  muted: '#686D76',
  signal: '#FF5A1F',
};

const read = (...segments: string[]) => readFile(join(process.cwd(), ...segments));

export default async function Image() {
  const [sans400, sans500, mono400, mono500, portrait] = await Promise.all([
    read('assets/fonts/SchibstedGrotesk-Regular.woff'),
    read('assets/fonts/SchibstedGrotesk-Medium.woff'),
    read('assets/fonts/IBMPlexMono-Regular.woff'),
    read('assets/fonts/IBMPlexMono-Medium.woff'),
    read('public/portrait.jpg'),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          padding: 64,
          background: color.paper,
          fontFamily: 'Schibsted Grotesk',
          color: color.ink,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingRight: 56,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'IBM Plex Mono', fontSize: 20, color: color.muted }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: color.signal, marginRight: 14 }} />
            scatolin.com
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 72, fontWeight: 500, lineHeight: 1.02, letterSpacing: '-0.045em' }}>
              {person.name}
            </div>
            <div style={{ marginTop: 24, fontSize: 34, fontWeight: 500, letterSpacing: '-0.02em', color: color.ink2 }}>
              {person.role}
            </div>
            {/* Broken at the phrase, as in the hero, so "them." never sits alone. */}
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', fontSize: 24, lineHeight: 1.4, color: color.muted }}>
              <span>I build AI systems</span>
              <span>and publish the research behind them.</span>
            </div>
          </div>

          <div style={{ display: 'flex', fontFamily: 'IBM Plex Mono', fontSize: 20, fontWeight: 500, color: color.ink2 }}>
            <span>Valor Capital Group</span>
            <span style={{ margin: '0 16px', color: color.signal }}>/</span>
            <span>Unicamp, 1st of 102</span>
          </div>
        </div>

        <div style={{ display: 'flex', width: 400, height: 502, borderRadius: 24, overflow: 'hidden', background: color.panel }}>
          {/* satori renders a plain img; next/image does not apply here. */}
          <img
            src={`data:image/jpeg;base64,${portrait.toString('base64')}`}
            alt=""
            width={400}
            height={502}
            style={{ objectFit: 'cover' }}
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Schibsted Grotesk', data: sans400, weight: 400, style: 'normal' },
        { name: 'Schibsted Grotesk', data: sans500, weight: 500, style: 'normal' },
        { name: 'IBM Plex Mono', data: mono400, weight: 400, style: 'normal' },
        { name: 'IBM Plex Mono', data: mono500, weight: 500, style: 'normal' },
      ],
    },
  );
}
