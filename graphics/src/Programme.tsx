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

export const PROG_SECONDS = 19;

export const Programme: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();

  const PAD = Math.round(width * 0.07);
  const HEADER_H = Math.round(height * 0.16);
  const ROW_H = Math.round(height * 0.092);
  const VIEWPORT_H = height - HEADER_H - Math.round(height * 0.03);

  const total = agenda.sessions.length * ROW_H;
  const scrollRange = Math.max(0, total - VIEWPORT_H);

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
      <AbsoluteFill
        style={{background: `radial-gradient(${width}px ${height * 0.3}px at 18% -6%, ${ACCENT}22, transparent 70%)`}}
      />

      {/* En-tete fixe */}
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_H, padding: `${Math.round(height * 0.045)}px ${PAD}px 0`}}>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 18, letterSpacing: 2.5, color: ACCENT}}>
          {agenda.meta}
        </div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 44, letterSpacing: 0.5, color: TITLE, marginTop: 8, lineHeight: 1.02}}>
          {agenda.event}
        </div>
        <div style={{width: 86, height: 5, background: ACCENT, marginTop: 14, borderRadius: 3}} />
      </div>

      {/* Viewport defilant */}
      <div style={{position: 'absolute', top: HEADER_H, left: PAD, right: PAD, height: VIEWPORT_H, overflow: 'hidden'}}>
        <div style={{transform: `translateY(${y}px)`}}>
          {agenda.sessions.map((s, i) => {
            const people = s.speakers
              .map((p) => (p.org ? `${p.name} — ${p.org}` : p.name))
              .join('   ·   ');
            return (
              <div
                key={i}
                style={{
                  minHeight: ROW_H,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: '10px 0',
                  borderTop: `1px solid ${ACCENT}22`,
                }}
              >
                <div style={{display: 'flex', alignItems: 'baseline', gap: 14}}>
                  <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 24, color: ACCENT, minWidth: 78}}>
                    {s.time}
                  </div>
                  <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 24, color: TITLE, lineHeight: 1.12}}>
                    {s.title}
                  </div>
                </div>
                <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 17, color: SUB, marginTop: 5, marginLeft: 92}}>
                  {people}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
