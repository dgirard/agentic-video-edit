import {
  AbsoluteFill,
  interpolate,
  spring,
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

export const INTRO_SECONDS = 4;

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();

  const rise = spring({frame, fps, config: {damping: 200, mass: 0.7}});
  const fadeIn = interpolate(frame, [0, 14], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  });
  const opacity = fadeIn * fadeOut;
  const y = interpolate(rise, [0, 1], [28, 0]);
  const barW = interpolate(rise, [0, 1], [0, 120]);

  return (
    <AbsoluteFill style={{backgroundColor: PANEL, opacity}}>
      <AbsoluteFill
        style={{background: `radial-gradient(${width}px ${height * 0.4}px at 50% 28%, ${ACCENT}26, transparent 70%)`}}
      />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: `0 ${Math.round(width * 0.08)}px`,
          transform: `translateY(${y}px)`,
        }}
      >
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 20, letterSpacing: 4, color: ACCENT}}>
          SFEIR × ANTHROPIC
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 64,
            lineHeight: 1.0,
            letterSpacing: 0.5,
            color: TITLE,
            marginTop: 18,
          }}
        >
          ONBOARD<br />CLAUDE CODE
        </div>
        <div style={{width: barW, height: 6, background: ACCENT, borderRadius: 3, margin: '26px 0'}} />
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 24, letterSpacing: 1, color: SUB}}>
          {agenda.meta}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
