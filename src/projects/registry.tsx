import type {FC} from 'react';
import {Composition, Still} from 'remotion';
import {BoundariesThumbnail} from './boundaries/Thumbnail';
import {BoundariesVideo} from './boundaries/Video';
import {CrabMentalityThumbnail} from './crab-mentality/Thumbnail';
import {CrabMentalityVideo} from './crab-mentality/Video';
import {ExhaustedThumbnail} from './exhausted/Thumbnail';
import {ExhaustedVideo} from './exhausted/Video';
import {ForgivenessThumbnail} from './forgiveness/Thumbnail';
import {ForgivenessVideo} from './forgiveness/Video';
import {FouquetPowerThumbnail} from './fouquet-power/Thumbnail';
import {FouquetPowerVideo} from './fouquet-power/Video';
import {HiddenIntentionsVideo} from './hidden-intentions/Video';
import {LettingGoThumbnail} from './letting-go/Thumbnail';
import {LettingGoVideo} from './letting-go/Video';
import {OwnTimelineVideo} from './own-timeline/Video';
import {ProvocationControlVideo} from './provocation-control/Video';
import {ReciprocityTrapThumbnail} from './reciprocity-trap/Thumbnail';
import {ReciprocityTrapVideo} from './reciprocity-trap/Video';
import {SolitudeThumbnail} from './solitude/Thumbnail';
import {SolitudeVideo} from './solitude/Video';
import {StoicThumbnail} from './stoic/Thumbnail';
import {StoicVideo} from './stoic/Video';

export const ProjectCompositions: FC = () => (
  <>
    <Composition id="StoicControl" component={StoicVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
    <Composition id="StoicExhausted" component={ExhaustedVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
    <Composition id="StoicSolitude" component={SolitudeVideo} durationInFrames={1560} fps={30} width={1080} height={1920} />
    <Composition id="StoicForgiveness" component={ForgivenessVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
    <Composition id="StoicLettingGo" component={LettingGoVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
    <Composition id="StoicBoundaries" component={BoundariesVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
    <Composition id="StoicCrabMentality" component={CrabMentalityVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
    <Composition id="StoicReciprocityTrap" component={ReciprocityTrapVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
    <Composition id="StoicFouquetPower" component={FouquetPowerVideo} durationInFrames={8790} fps={30} width={1920} height={1080} />
    <Composition id="StoicProvocationControl" component={ProvocationControlVideo} durationInFrames={1470} fps={30} width={1080} height={1920} />
    <Composition id="StoicHiddenIntentions" component={HiddenIntentionsVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
    <Composition id="StoicOwnTimeline" component={OwnTimelineVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />

    <Still id="StoicThumbnail" component={StoicThumbnail} width={1080} height={1920} />
    <Still id="ExhaustedThumbnail" component={ExhaustedThumbnail} width={1080} height={1920} />
    <Still id="SolitudeThumbnail" component={SolitudeThumbnail} width={1080} height={1920} />
    <Still id="ForgivenessThumbnail" component={ForgivenessThumbnail} width={1080} height={1920} />
    <Still id="LettingGoThumbnail" component={LettingGoThumbnail} width={1080} height={1920} />
    <Still id="BoundariesThumbnail" component={BoundariesThumbnail} width={1080} height={1920} />
    <Still id="CrabMentalityThumbnail" component={CrabMentalityThumbnail} width={1080} height={1920} />
    <Still id="ReciprocityTrapThumbnail" component={ReciprocityTrapThumbnail} width={1080} height={1920} />
    <Still id="FouquetPowerThumbnail" component={FouquetPowerThumbnail} width={1920} height={1080} />
  </>
);
