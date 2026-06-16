import {
  AbsoluteFill,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import agenda from './agenda.json';
import brand from './brand.json';

const ACCENT = brand.accent;
const PANEL = brand.panelBg;
const TITLE = brand.title;
const SUB = brand.sub;
const SANS = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';

const HEADER_H = 156;
const ROW_H = 96;
const VIEWPORT_H = 720 - HEADER_H - 24;

export const PROG_SECONDS = 19;

export const Programme: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const total = agenda.sessions.length * ROW_H;
  const scrollRange = Math.max(0, total - VIEWPORT_H);

  // Defilement : hold debut, scroll eased, hold fin.
  const scrollStart = Math.round(1.0 * fps);
  const scrollEnd = durationInFrames - Math.round(2.5 * fps);
  const y = interpolate(frame, [scrollStart, scrollEnd], [0, -scrollRange], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });

  const fadeIn = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  });
  const opacity = fadeIn * fadeOut;

  return (
    <AbsoluteFill style={{backgroundColor: PANEL, opacity}}>
      {/* halo ocre discret en haut */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 360px at 18% -8%, ${ACCENT}22, transparent 70%)`,
        }}
      />

      {/* En-tete fixe */}
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_H, padding: '34px 56px 0'}}>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 18, letterSpacing: 3, color: ACCENT}}>
          {agenda.meta}
        </div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 48, letterSpacing: 0.5, color: TITLE, marginTop: 6}}>
          {agenda.event}
        </div>
        <div style={{width: 92, height: 5, background: ACCENT, marginTop: 14, borderRadius: 3}} />
      </div>

      {/* Viewport defilant */}
      <div style={{position: 'absolute', top: HEADER_H, left: 56, right: 56, height: VIEWPORT_H, overflow: 'hidden'}}>
        <div style={{transform: `translateY(${y}px)`}}>
          {agenda.sessions.map((s, i) => {
            const people = s.speakers
              .map((p) => (p.org ? `${p.name} — ${p.org}` : p.name))
              .join('   ·   ');
            return (
              <div
                key={i}
                style={{
                  height: ROW_H,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 22,
                  borderTop: `1px solid ${ACCENT}22`,
                }}
              >
                <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 26, color: ACCENT, minWidth: 86}}>
                  {s.time}
                </div>
                <div>
                  <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 24, color: TITLE, lineHeight: 1.15}}>
                    {s.title}
                  </div>
                  <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 17, color: SUB, marginTop: 4}}>
                    {people}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
