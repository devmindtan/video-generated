import type {FC} from 'react';
import {Composition, Folder, Still} from 'remotion';
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
import {OwnTimelineThumbnail} from './own-timeline/Thumbnail';
import {ProvocationControlVideo} from './provocation-control/Video';
import {ReciprocityTrapThumbnail} from './reciprocity-trap/Thumbnail';
import {ReciprocityTrapVideo} from './reciprocity-trap/Video';
import {SolitudeThumbnail} from './solitude/Thumbnail';
import {SolitudeVideo} from './solitude/Video';
import {StoicThumbnail} from './stoic/Thumbnail';
import {StoicVideo} from './stoic/Video';
import {TinyDinoAdventureThumbnail} from './tiny-dino-adventure/Thumbnail';
import {TinyDinoAdventureVideo} from './tiny-dino-adventure/Video';
import {TinyDinoHomecomingVideo} from './tiny-dino-homecoming/Video';
import {TinyDinoHomecomingThumbnail} from './tiny-dino-homecoming/Thumbnail';
import {GlowingWhaleVideo} from './glowing-whale/Video';
import {GlowingWhaleThumbnail} from './glowing-whale/Thumbnail';
import {PastSelfVideo} from './past-self/Video';
import {PastSelfThumbnail} from './past-self/Thumbnail';
import {LetItSettleVideo} from './let-it-settle/Video';
import {LetItSettleThumbnail} from './let-it-settle/Thumbnail';
import {SingleTaskVideo} from './single-task/Video';
import {SingleTaskThumbnail} from './single-task/Thumbnail';
import {DisciplinePurposeVideo} from './discipline-purpose/Video';
import {DisciplinePurposeThumbnail} from './discipline-purpose/Thumbnail';
import {RightAdviceVideo} from './right-advice/Video';
import {RightAdviceThumbnail} from './right-advice/Thumbnail';
import {BookInsightsIntro, bookIntroMetadata} from './book-hvtt-001-overview/Intro';
import {BookInsightsOutro, bookOutroMetadata} from './book-hvtt-001-overview/Outro';
import {PeoplePleasingVideo} from './people-pleasing/Video';
import {PeoplePleasingThumbnail} from './people-pleasing/Thumbnail';
import {NeverTriedVideo} from './never-tried/Video';
import {NeverTriedThumbnail} from './never-tried/Thumbnail';
import {TakeStockVideo} from './take-stock/Video';
import {TakeStockThumbnail} from './take-stock/Thumbnail';
import {GetBackUpVideo} from './get-back-up/Video';
import {GetBackUpThumbnail} from './get-back-up/Thumbnail';
import {DreamTrapVideo} from './dream-trap/Video';
import {DreamTrapThumbnail} from './dream-trap/Thumbnail';
import {CallBackVideo} from './call-back/Video';
import {CallBackThumbnail} from './call-back/Thumbnail';
import {TimeAndGoldVideo} from './time-and-gold/Video';
import {TimeAndGoldThumbnail} from './time-and-gold/Thumbnail';
import {LessJudgmentVideo} from './less-judgment/Video';
import {LessJudgmentThumbnail} from './less-judgment/Thumbnail';
import {SmallMistakesVideo} from './small-mistakes/Video';
import {SmallMistakesThumbnail} from './small-mistakes/Thumbnail';
import {AngerAtHomeVideo} from './anger-at-home/Video';
import {AngerAtHomeThumbnail} from './anger-at-home/Thumbnail';
import {CherishTodayVideo} from './cherish-today/Video';
import {CherishTodayThumbnail} from './cherish-today/Thumbnail';
import {RestDayVideo} from './rest-day/Video';
import {RestDayThumbnail} from './rest-day/Thumbnail';
import {ApologyChangeVideo} from './apology-change/Video';
import {ApologyChangeThumbnail} from './apology-change/Thumbnail';
import {ListenFirstVideo} from './listen-first/Video';
import {ListenFirstThumbnail} from './listen-first/Thumbnail';
import {SkinCareNhuyVideo} from './skin-care-nhuy/Video';
import {MerzyGlamTintVideo} from './merzy-glam-tint/Video';

import {StartBeforeReadyVideo} from './start-before-ready/Video';
import {StartBeforeReadyThumbnail} from './start-before-ready/Thumbnail';

import {OneBadDayVideo} from './one-bad-day/Video';
import {OneBadDayThumbnail} from './one-bad-day/Thumbnail';

export const ProjectCompositions: FC = () => (
  <>
    <Folder name="Tam-Ly-Cuoc-Song">
      <Folder name="Self-Help-Shorts">
        <Folder name="one-bad-day">
          <Composition id="StoicOneBadDay" component={OneBadDayVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="OneBadDayThumbnail" component={OneBadDayThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="start-before-ready">
          <Composition id="StoicStartBeforeReady" component={StartBeforeReadyVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="StartBeforeReadyThumbnail" component={StartBeforeReadyThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="stoic">
          <Composition id="StoicControl" component={StoicVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="StoicThumbnail" component={StoicThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="past-self">
          <Composition id="StoicPastSelf" component={PastSelfVideo} durationInFrames={1500} fps={30} width={1080} height={1920} />
          <Still id="PastSelfThumbnail" component={PastSelfThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="let-it-settle">
          <Composition id="StoicLetItSettle" component={LetItSettleVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="LetItSettleThumbnail" component={LetItSettleThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="single-task">
          <Composition id="StoicSingleTask" component={SingleTaskVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="SingleTaskThumbnail" component={SingleTaskThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="discipline-purpose">
          <Composition id="StoicDisciplinePurpose" component={DisciplinePurposeVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="DisciplinePurposeThumbnail" component={DisciplinePurposeThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="right-advice">
          <Composition id="StoicRightAdvice" component={RightAdviceVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="RightAdviceThumbnail" component={RightAdviceThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="people-pleasing">
          <Composition id="StoicPeoplePleasing" component={PeoplePleasingVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="PeoplePleasingThumbnail" component={PeoplePleasingThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="never-tried">
          <Composition id="StoicNeverTried" component={NeverTriedVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="NeverTriedThumbnail" component={NeverTriedThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="take-stock">
          <Composition id="StoicTakeStock" component={TakeStockVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="TakeStockThumbnail" component={TakeStockThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="get-back-up">
          <Composition id="StoicGetBackUp" component={GetBackUpVideo} durationInFrames={1230} fps={30} width={1080} height={1920} />
          <Still id="GetBackUpThumbnail" component={GetBackUpThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="dream-trap">
          <Composition id="StoicDreamTrap" component={DreamTrapVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="DreamTrapThumbnail" component={DreamTrapThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="call-back">
          <Composition id="StoicCallBack" component={CallBackVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="CallBackThumbnail" component={CallBackThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="time-and-gold">
          <Composition id="StoicTimeAndGold" component={TimeAndGoldVideo} durationInFrames={1500} fps={30} width={1080} height={1920} />
          <Still id="TimeAndGoldThumbnail" component={TimeAndGoldThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="less-judgment">
          <Composition id="StoicLessJudgment" component={LessJudgmentVideo} durationInFrames={1500} fps={30} width={1080} height={1920} />
          <Still id="LessJudgmentThumbnail" component={LessJudgmentThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="small-mistakes">
          <Composition id="StoicSmallMistakes" component={SmallMistakesVideo} durationInFrames={1500} fps={30} width={1080} height={1920} />
          <Still id="SmallMistakesThumbnail" component={SmallMistakesThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="anger-at-home">
          <Composition id="StoicAngerAtHome" component={AngerAtHomeVideo} durationInFrames={1800} fps={30} width={1080} height={1920} />
          <Still id="AngerAtHomeThumbnail" component={AngerAtHomeThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="cherish-today">
          <Composition id="StoicCherishToday" component={CherishTodayVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="CherishTodayThumbnail" component={CherishTodayThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="rest-day">
          <Composition id="StoicRestDay" component={RestDayVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="RestDayThumbnail" component={RestDayThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="apology-change">
          <Composition id="StoicApologyChange" component={ApologyChangeVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="ApologyChangeThumbnail" component={ApologyChangeThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="listen-first">
          <Composition id="StoicListenFirst" component={ListenFirstVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="ListenFirstThumbnail" component={ListenFirstThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="exhausted">
          <Composition id="StoicExhausted" component={ExhaustedVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="ExhaustedThumbnail" component={ExhaustedThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="solitude">
          <Composition id="StoicSolitude" component={SolitudeVideo} durationInFrames={1560} fps={30} width={1080} height={1920} />
          <Still id="SolitudeThumbnail" component={SolitudeThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="forgiveness">
          <Composition id="StoicForgiveness" component={ForgivenessVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="ForgivenessThumbnail" component={ForgivenessThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="letting-go">
          <Composition id="StoicLettingGo" component={LettingGoVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="LettingGoThumbnail" component={LettingGoThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="boundaries">
          <Composition id="StoicBoundaries" component={BoundariesVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="BoundariesThumbnail" component={BoundariesThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="crab-mentality">
          <Composition id="StoicCrabMentality" component={CrabMentalityVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="CrabMentalityThumbnail" component={CrabMentalityThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="reciprocity-trap">
          <Composition id="StoicReciprocityTrap" component={ReciprocityTrapVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="ReciprocityTrapThumbnail" component={ReciprocityTrapThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="provocation-control">
          <Composition id="StoicProvocationControl" component={ProvocationControlVideo} durationInFrames={1470} fps={30} width={1080} height={1920} />
        </Folder>
        <Folder name="hidden-intentions">
          <Composition id="StoicHiddenIntentions" component={HiddenIntentionsVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
        </Folder>
        <Folder name="own-timeline">
          <Composition id="StoicOwnTimeline" component={OwnTimelineVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="OwnTimelineThumbnail" component={OwnTimelineThumbnail} width={1080} height={1920} />
        </Folder>
      </Folder>
      <Folder name="Book-Insights">
        <Folder name="book-hvtt-001-overview">
          <Composition id="BookHvttIntro" component={BookInsightsIntro} calculateMetadata={bookIntroMetadata} durationInFrames={1050} fps={30} width={1920} height={1080} defaultProps={{
            voice: '00-intro',
            channelLabel: 'TÂM LÝ CUỘC SỐNG',
            episodeLabel: 'TẬP 01',
            bookTitle: 'Hiểu về trái tim',
            bookAuthor: 'Minh Niệm',
          }} />
          <Composition id="BookHvttOutro" component={BookInsightsOutro} calculateMetadata={bookOutroMetadata} durationInFrames={540} fps={30} width={1920} height={1080} defaultProps={{voice: '99-outro', channelLabel: 'TÂM LÝ CUỘC SỐNG'}} />
        </Folder>
      </Folder>
      <Folder name="Stoic-Stories">
        <Folder name="fouquet-power">
          <Composition id="StoicFouquetPower" component={FouquetPowerVideo} durationInFrames={8790} fps={30} width={1920} height={1080} />
          <Still id="FouquetPowerThumbnail" component={FouquetPowerThumbnail} width={1920} height={1080} />
        </Folder>
      </Folder>
    </Folder>
    <Folder name="Kids">
      <Folder name="Tiny-Dino">
        <Folder name="tiny-dino-adventure">
          <Composition id="TinyDinoAdventure" component={TinyDinoAdventureVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Composition id="TinyDinoAdventureChildVoice" component={TinyDinoAdventureVideo} durationInFrames={1440} fps={30} width={1080} height={1920} defaultProps={{voiceVariant: 'childlike'}} />
          <Still id="TinyDinoAdventureThumbnail" component={TinyDinoAdventureThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="tiny-dino-homecoming">
          <Composition id="TinyDinoHomecoming" component={TinyDinoHomecomingVideo} durationInFrames={5400} fps={30} width={1920} height={1080} />
          <Still id="TinyDinoHomecomingThumbnail" component={TinyDinoHomecomingThumbnail} width={1920} height={1080} />
        </Folder>
      </Folder>
      <Folder name="Ocean-Stories">
        <Folder name="glowing-whale">
          <Composition id="GlowingWhale" component={GlowingWhaleVideo} durationInFrames={1800} fps={30} width={1080} height={1920} />
          <Still id="GlowingWhaleThumbnail" component={GlowingWhaleThumbnail} width={1080} height={1920} />
        </Folder>
      </Folder>
    </Folder>
    <Folder name="Client-Work">
      <Folder name="Product-Videos">
        <Folder name="skin-care-nhuy">
          <Composition id="SkinCareNhuyAdam" component={SkinCareNhuyVideo} durationInFrames={904} fps={30} width={368} height={654} />
        </Folder>
        <Folder name="merzy-glam-tint">
          <Composition id="MerzyGlamTintAdam" component={MerzyGlamTintVideo} durationInFrames={787} fps={30} width={720} height={1280} />
        </Folder>
      </Folder>
    </Folder>
  </>
);
