import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import timings from './timings.json';
import brand from './brand.json'; // local, non committé (cp brand.example.json brand.json)

const ACCENT = brand.accent;
const PANEL = brand.panelBg;
const TITLE = brand.title;
const SUB = brand.sub;
const SANS = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
// Marge basse des bandeaux (px) : a remonter quand la source porte deja un habillage chaine en bas d'image.
const LOWER_BOTTOM: number = (timings as any).lower_margin_bottom ?? 56;

// Entree ressort + sortie fondu, partagees par les deux types d'overlay.
const useInOut = (durationInFrames: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 200, mass: 0.6}});
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return {opacity: enter * exit, x: interpolate(enter, [0, 1], [-40, 0])};
};

const LowerThird: React.FC<{title: string; sub: string; durationInFrames: number}> = ({
  title,
  sub,
  durationInFrames,
}) => {
  const {opacity, x} = useInOut(durationInFrames);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'flex-start'}}>
      <div
        style={{
          margin: `0 0 ${LOWER_BOTTOM}px 56px`,
          display: 'flex',
          alignItems: 'stretch',
          opacity,
          transform: `translateX(${x}px)`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <div style={{width: 8, background: ACCENT}} />
        <div style={{background: PANEL, padding: '14px 26px 16px 20px'}}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 38, letterSpacing: 0.5, color: TITLE, lineHeight: 1.05}}>
            {title}
          </div>
          <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 22, marginTop: 6, color: SUB, letterSpacing: 0.3}}>
            {sub}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

type Group = {org: string; people: string};

const SpeakersPanel: React.FC<{title: string; groups: Group[]; durationInFrames: number}> = ({
  title,
  groups,
  durationInFrames,
}) => {
  const {opacity, x} = useInOut(durationInFrames);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'flex-start'}}>
      <div
        style={{
          margin: '0 0 48px 56px',
          opacity,
          transform: `translateX(${x}px)`,
          background: PANEL,
          borderLeft: `8px solid ${ACCENT}`,
          borderRadius: 6,
          padding: '16px 28px 18px 22px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          minWidth: 520,
        }}
      >
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: 2, color: ACCENT, marginBottom: 10}}>
          {title}
        </div>
        {groups.map((g, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'baseline', gap: 12, marginTop: i ? 7 : 0}}>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 16, letterSpacing: 0.6, color: SUB, minWidth: 132}}>
              {g.org}
            </div>
            <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 20, color: TITLE}}>{g.people}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Overlay: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <OffthreadVideo src={staticFile(timings.video)} />
      {timings.overlays.map((o: any, i: number) => {
        const from = Math.round(o.start * fps);
        const dur = Math.max(1, Math.round((o.end - o.start) * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            {o.type === 'speakers' ? (
              <SpeakersPanel title={o.title} groups={o.groups} durationInFrames={dur} />
            ) : (
              <LowerThird title={o.title} sub={o.sub} durationInFrames={dur} />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
