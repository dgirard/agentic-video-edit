import {Composition} from 'remotion';
import {Overlay} from './Overlay';
import {Programme, PROG_SECONDS} from './Programme';
import timings from './timings.json';

const FPS = timings.fps;
const DURATION = Math.round(timings.duration_s * FPS);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Overlay"
        component={Overlay}
        durationInFrames={DURATION}
        fps={FPS}
        width={1280}
        height={720}
      />
      <Composition
        id="Programme"
        component={Programme}
        durationInFrames={Math.round(PROG_SECONDS * FPS)}
        fps={FPS}
        width={1280}
        height={720}
      />
    </>
  );
};
