import {Composition} from 'remotion';
import {Overlay} from './Overlay';
import {Programme, PROG_SECONDS} from './Programme';
import {Intro, INTRO_SECONDS} from './Intro';
import timings from './timings.json';

const FPS = timings.fps;
const DURATION = Math.round(timings.duration_s * FPS);
const W = timings.width;
const H = timings.height;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Intro"
        component={Intro}
        durationInFrames={Math.round(INTRO_SECONDS * FPS)}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="Overlay"
        component={Overlay}
        durationInFrames={DURATION}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="Programme"
        component={Programme}
        durationInFrames={Math.round(PROG_SECONDS * FPS)}
        fps={FPS}
        width={W}
        height={H}
      />
    </>
  );
};
