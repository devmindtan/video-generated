import {renderTo} from './render-output';
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
import {KnowWhenToQuitVideo, knowWhenToQuitMetadata} from './know-when-to-quit/Video';
import {KnowWhenToQuitThumbnail} from './know-when-to-quit/Thumbnail';
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
import {BookInsightsEpisodeCard, episodeCardMetadata} from './book-hvtt-001-overview/EpisodeCard';
import {BookHvttMoChuyen, moChuyenMetadata} from './book-hvtt-001-overview/MoChuyen';
import {BookHvttEpisode, episodeMetadata} from './book-hvtt-001-overview/Episode';
import {CuonSach, SoiChi, Nhom3A, Nhom3B, Nhom3C, Nhom3D, NhanXet} from './book-hvtt-001-overview/Sections';
import {sectionMetadata} from './book-hvtt-001-overview/scene-kit';
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
import {FlowerKnowsPowderVideo} from './flower-knows-powder/Video';

import {StartBeforeReadyVideo} from './start-before-ready/Video';
import {StartBeforeReadyThumbnail} from './start-before-ready/Thumbnail';

import {OneBadDayVideo} from './one-bad-day/Video';
import {OneBadDayThumbnail} from './one-bad-day/Thumbnail';

export const ProjectCompositions: FC = () => (
  <>
    <Folder name="Tam-Ly-Cuoc-Song">
      <Folder name="Self-Help-Shorts">
        <Folder name="one-bad-day">
          <Composition id="StoicOneBadDay" calculateMetadata={renderTo('one-bad-day')} component={OneBadDayVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="OneBadDayThumbnail" calculateMetadata={renderTo('one-bad-day')} component={OneBadDayThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="start-before-ready">
          <Composition id="StoicStartBeforeReady" calculateMetadata={renderTo('start-before-ready')} component={StartBeforeReadyVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="StartBeforeReadyThumbnail" calculateMetadata={renderTo('start-before-ready')} component={StartBeforeReadyThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="stoic">
          <Composition id="StoicControl" calculateMetadata={renderTo('stoic')} component={StoicVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="StoicThumbnail" calculateMetadata={renderTo('stoic')} component={StoicThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="past-self">
          <Composition id="StoicPastSelf" calculateMetadata={renderTo('past-self')} component={PastSelfVideo} durationInFrames={1500} fps={30} width={1080} height={1920} />
          <Still id="PastSelfThumbnail" calculateMetadata={renderTo('past-self')} component={PastSelfThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="let-it-settle">
          <Composition id="StoicLetItSettle" calculateMetadata={renderTo('let-it-settle')} component={LetItSettleVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="LetItSettleThumbnail" calculateMetadata={renderTo('let-it-settle')} component={LetItSettleThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="single-task">
          <Composition id="StoicSingleTask" calculateMetadata={renderTo('single-task')} component={SingleTaskVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="SingleTaskThumbnail" calculateMetadata={renderTo('single-task')} component={SingleTaskThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="discipline-purpose">
          <Composition id="StoicDisciplinePurpose" calculateMetadata={renderTo('discipline-purpose')} component={DisciplinePurposeVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="DisciplinePurposeThumbnail" calculateMetadata={renderTo('discipline-purpose')} component={DisciplinePurposeThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="right-advice">
          <Composition id="StoicRightAdvice" calculateMetadata={renderTo('right-advice')} component={RightAdviceVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="RightAdviceThumbnail" calculateMetadata={renderTo('right-advice')} component={RightAdviceThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="people-pleasing">
          <Composition id="StoicPeoplePleasing" calculateMetadata={renderTo('people-pleasing')} component={PeoplePleasingVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="PeoplePleasingThumbnail" calculateMetadata={renderTo('people-pleasing')} component={PeoplePleasingThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="never-tried">
          <Composition id="StoicNeverTried" calculateMetadata={renderTo('never-tried')} component={NeverTriedVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="NeverTriedThumbnail" calculateMetadata={renderTo('never-tried')} component={NeverTriedThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="take-stock">
          <Composition id="StoicTakeStock" calculateMetadata={renderTo('take-stock')} component={TakeStockVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="TakeStockThumbnail" calculateMetadata={renderTo('take-stock')} component={TakeStockThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="get-back-up">
          <Composition id="StoicGetBackUp" calculateMetadata={renderTo('get-back-up')} component={GetBackUpVideo} durationInFrames={1230} fps={30} width={1080} height={1920} />
          <Still id="GetBackUpThumbnail" calculateMetadata={renderTo('get-back-up')} component={GetBackUpThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="dream-trap">
          <Composition id="StoicDreamTrap" calculateMetadata={renderTo('dream-trap')} component={DreamTrapVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="DreamTrapThumbnail" calculateMetadata={renderTo('dream-trap')} component={DreamTrapThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="call-back">
          <Composition id="StoicCallBack" calculateMetadata={renderTo('call-back')} component={CallBackVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="CallBackThumbnail" calculateMetadata={renderTo('call-back')} component={CallBackThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="time-and-gold">
          <Composition id="StoicTimeAndGold" calculateMetadata={renderTo('time-and-gold')} component={TimeAndGoldVideo} durationInFrames={1500} fps={30} width={1080} height={1920} />
          <Still id="TimeAndGoldThumbnail" calculateMetadata={renderTo('time-and-gold')} component={TimeAndGoldThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="less-judgment">
          <Composition id="StoicLessJudgment" calculateMetadata={renderTo('less-judgment')} component={LessJudgmentVideo} durationInFrames={1500} fps={30} width={1080} height={1920} />
          <Still id="LessJudgmentThumbnail" calculateMetadata={renderTo('less-judgment')} component={LessJudgmentThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="small-mistakes">
          <Composition id="StoicSmallMistakes" calculateMetadata={renderTo('small-mistakes')} component={SmallMistakesVideo} durationInFrames={1500} fps={30} width={1080} height={1920} />
          <Still id="SmallMistakesThumbnail" calculateMetadata={renderTo('small-mistakes')} component={SmallMistakesThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="anger-at-home">
          <Composition id="StoicAngerAtHome" calculateMetadata={renderTo('anger-at-home')} component={AngerAtHomeVideo} durationInFrames={1800} fps={30} width={1080} height={1920} />
          <Still id="AngerAtHomeThumbnail" calculateMetadata={renderTo('anger-at-home')} component={AngerAtHomeThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="cherish-today">
          <Composition id="StoicCherishToday" calculateMetadata={renderTo('cherish-today')} component={CherishTodayVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="CherishTodayThumbnail" calculateMetadata={renderTo('cherish-today')} component={CherishTodayThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="rest-day">
          <Composition id="StoicRestDay" calculateMetadata={renderTo('rest-day')} component={RestDayVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="RestDayThumbnail" calculateMetadata={renderTo('rest-day')} component={RestDayThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="apology-change">
          <Composition id="StoicApologyChange" calculateMetadata={renderTo('apology-change')} component={ApologyChangeVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="ApologyChangeThumbnail" calculateMetadata={renderTo('apology-change')} component={ApologyChangeThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="listen-first">
          <Composition id="StoicListenFirst" calculateMetadata={renderTo('listen-first')} component={ListenFirstVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="ListenFirstThumbnail" calculateMetadata={renderTo('listen-first')} component={ListenFirstThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="exhausted">
          <Composition id="StoicExhausted" calculateMetadata={renderTo('exhausted')} component={ExhaustedVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="ExhaustedThumbnail" calculateMetadata={renderTo('exhausted')} component={ExhaustedThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="solitude">
          <Composition id="StoicSolitude" calculateMetadata={renderTo('solitude')} component={SolitudeVideo} durationInFrames={1560} fps={30} width={1080} height={1920} />
          <Still id="SolitudeThumbnail" calculateMetadata={renderTo('solitude')} component={SolitudeThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="forgiveness">
          <Composition id="StoicForgiveness" calculateMetadata={renderTo('forgiveness')} component={ForgivenessVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="ForgivenessThumbnail" calculateMetadata={renderTo('forgiveness')} component={ForgivenessThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="letting-go">
          <Composition id="StoicLettingGo" calculateMetadata={renderTo('letting-go')} component={LettingGoVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="LettingGoThumbnail" calculateMetadata={renderTo('letting-go')} component={LettingGoThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="boundaries">
          <Composition id="StoicBoundaries" calculateMetadata={renderTo('boundaries')} component={BoundariesVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="BoundariesThumbnail" calculateMetadata={renderTo('boundaries')} component={BoundariesThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="crab-mentality">
          <Composition id="StoicCrabMentality" calculateMetadata={renderTo('crab-mentality')} component={CrabMentalityVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="CrabMentalityThumbnail" calculateMetadata={renderTo('crab-mentality')} component={CrabMentalityThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="reciprocity-trap">
          <Composition id="StoicReciprocityTrap" calculateMetadata={renderTo('reciprocity-trap')} component={ReciprocityTrapVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Still id="ReciprocityTrapThumbnail" calculateMetadata={renderTo('reciprocity-trap')} component={ReciprocityTrapThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="provocation-control">
          <Composition id="StoicProvocationControl" calculateMetadata={renderTo('provocation-control')} component={ProvocationControlVideo} durationInFrames={1470} fps={30} width={1080} height={1920} />
        </Folder>
        <Folder name="hidden-intentions">
          <Composition id="StoicHiddenIntentions" calculateMetadata={renderTo('hidden-intentions')} component={HiddenIntentionsVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
        </Folder>
        <Folder name="own-timeline">
          <Composition id="StoicOwnTimeline" calculateMetadata={renderTo('own-timeline')} component={OwnTimelineVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
          <Still id="OwnTimelineThumbnail" calculateMetadata={renderTo('own-timeline')} component={OwnTimelineThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="know-when-to-quit">
          <Composition id="StoicKnowWhenToQuit" calculateMetadata={renderTo('know-when-to-quit', knowWhenToQuitMetadata)} component={KnowWhenToQuitVideo} durationInFrames={1295} fps={30} width={1080} height={1920} />
          <Still id="KnowWhenToQuitThumbnail" calculateMetadata={renderTo('know-when-to-quit')} component={KnowWhenToQuitThumbnail} width={1080} height={1920} />
        </Folder>
      </Folder>
      <Folder name="Book-Insights">
        <Folder name="book-hvtt-001-overview">
          <Composition id="BookHvttTap01" component={BookHvttEpisode} calculateMetadata={renderTo('book-hvtt-001-overview', episodeMetadata)} durationInFrames={1800} fps={30} width={1920} height={1080} defaultProps={{introVoice: 'clone-ban-v4a-sang2', cardVoice: '01-gioi-thieu-tap', bodyVoice: '02-mo-chuyen-sang2', outroVoice: 'outro-ban-v2-sang2', channelLabel: 'TÂM LÝ CUỘC SỐNG', episodeLabel: 'TẬP 01', bookTitle: 'Hiểu về trái tim', bookAuthor: 'Minh Niệm'}} />
          <Composition id="BookHvttIntro" component={BookInsightsIntro} calculateMetadata={renderTo('book-hvtt-001-overview', bookIntroMetadata)} durationInFrames={1050} fps={30} width={1920} height={1080} defaultProps={{
            voice: 'clone-ban-v4a-sang2',
            channelLabel: 'TÂM LÝ CUỘC SỐNG',
          }} />
          <Composition id="BookHvttEpisodeCard" component={BookInsightsEpisodeCard} calculateMetadata={renderTo('book-hvtt-001-overview', episodeCardMetadata)} durationInFrames={300} fps={30} width={1920} height={1080} defaultProps={{voice: '01-gioi-thieu-tap', channelLabel: 'TÂM LÝ CUỘC SỐNG', episodeLabel: 'TẬP 01', bookTitle: 'Hiểu về trái tim', bookAuthor: 'Minh Niệm'}} />
          <Composition id="BookHvttMoChuyen" component={BookHvttMoChuyen} calculateMetadata={renderTo('book-hvtt-001-overview', moChuyenMetadata)} durationInFrames={630} fps={30} width={1920} height={1080} defaultProps={{voice: '02-mo-chuyen-sang2', channelLabel: 'TÂM LÝ CUỘC SỐNG'}} />
          <Composition id="BookHvttCuonSach" component={CuonSach} calculateMetadata={renderTo('book-hvtt-001-overview', sectionMetadata)} durationInFrames={900} fps={30} width={1920} height={1080} defaultProps={{voice: '03-cuon-sach-sang2', channelLabel: 'TÂM LÝ CUỘC SỐNG'}} />
          <Composition id="BookHvttSoiChi" component={SoiChi} calculateMetadata={renderTo('book-hvtt-001-overview', sectionMetadata)} durationInFrames={900} fps={30} width={1920} height={1080} defaultProps={{voice: '04-soi-chi-sang2', channelLabel: 'TÂM LÝ CUỘC SỐNG'}} />
          <Composition id="BookHvttNhom3A" component={Nhom3A} calculateMetadata={renderTo('book-hvtt-001-overview', sectionMetadata)} durationInFrames={900} fps={30} width={1920} height={1080} defaultProps={{voice: '05-nhom-3a-sang2', channelLabel: 'TÂM LÝ CUỘC SỐNG'}} />
          <Composition id="BookHvttNhom3B" component={Nhom3B} calculateMetadata={renderTo('book-hvtt-001-overview', sectionMetadata)} durationInFrames={900} fps={30} width={1920} height={1080} defaultProps={{voice: '06-nhom-3b-sang2', channelLabel: 'TÂM LÝ CUỘC SỐNG'}} />
          <Composition id="BookHvttNhom3C" component={Nhom3C} calculateMetadata={renderTo('book-hvtt-001-overview', sectionMetadata)} durationInFrames={900} fps={30} width={1920} height={1080} defaultProps={{voice: '07-nhom-3c-sang2', channelLabel: 'TÂM LÝ CUỘC SỐNG'}} />
          <Composition id="BookHvttNhom3D" component={Nhom3D} calculateMetadata={renderTo('book-hvtt-001-overview', sectionMetadata)} durationInFrames={900} fps={30} width={1920} height={1080} defaultProps={{voice: '08-nhom-3d-sang2', channelLabel: 'TÂM LÝ CUỘC SỐNG'}} />
          <Composition id="BookHvttNhanXet" component={NhanXet} calculateMetadata={renderTo('book-hvtt-001-overview', sectionMetadata)} durationInFrames={900} fps={30} width={1920} height={1080} defaultProps={{voice: '09-nhan-xet-sang2', channelLabel: 'TÂM LÝ CUỘC SỐNG'}} />
          <Composition id="BookHvttOutro" component={BookInsightsOutro} calculateMetadata={renderTo('book-hvtt-001-overview', bookOutroMetadata)} durationInFrames={540} fps={30} width={1920} height={1080} defaultProps={{
            voice: 'outro-ban-v2-sang2',
            channelLabel: 'TÂM LÝ CUỘC SỐNG',
          }} />
        </Folder>
      </Folder>
      <Folder name="Stoic-Stories">
        <Folder name="fouquet-power">
          <Composition id="StoicFouquetPower" calculateMetadata={renderTo('fouquet-power')} component={FouquetPowerVideo} durationInFrames={8790} fps={30} width={1920} height={1080} />
          <Still id="FouquetPowerThumbnail" calculateMetadata={renderTo('fouquet-power')} component={FouquetPowerThumbnail} width={1920} height={1080} />
        </Folder>
      </Folder>
    </Folder>
    <Folder name="Kids">
      <Folder name="Tiny-Dino">
        <Folder name="tiny-dino-adventure">
          <Composition id="TinyDinoAdventure" calculateMetadata={renderTo('tiny-dino-adventure')} component={TinyDinoAdventureVideo} durationInFrames={1440} fps={30} width={1080} height={1920} />
          <Composition id="TinyDinoAdventureChildVoice" calculateMetadata={renderTo('tiny-dino-adventure')} component={TinyDinoAdventureVideo} durationInFrames={1440} fps={30} width={1080} height={1920} defaultProps={{voiceVariant: 'childlike'}} />
          <Still id="TinyDinoAdventureThumbnail" calculateMetadata={renderTo('tiny-dino-adventure')} component={TinyDinoAdventureThumbnail} width={1080} height={1920} />
        </Folder>
        <Folder name="tiny-dino-homecoming">
          <Composition id="TinyDinoHomecoming" calculateMetadata={renderTo('tiny-dino-homecoming')} component={TinyDinoHomecomingVideo} durationInFrames={5400} fps={30} width={1920} height={1080} />
          <Still id="TinyDinoHomecomingThumbnail" calculateMetadata={renderTo('tiny-dino-homecoming')} component={TinyDinoHomecomingThumbnail} width={1920} height={1080} />
        </Folder>
      </Folder>
      <Folder name="Ocean-Stories">
        <Folder name="glowing-whale">
          <Composition id="GlowingWhale" calculateMetadata={renderTo('glowing-whale')} component={GlowingWhaleVideo} durationInFrames={1800} fps={30} width={1080} height={1920} />
          <Still id="GlowingWhaleThumbnail" calculateMetadata={renderTo('glowing-whale')} component={GlowingWhaleThumbnail} width={1080} height={1920} />
        </Folder>
      </Folder>
    </Folder>
    <Folder name="Client-Work">
      <Folder name="Product-Videos">
        <Folder name="skin-care-nhuy">
          <Composition id="SkinCareNhuyAdam" calculateMetadata={renderTo('skin-care-nhuy')} component={SkinCareNhuyVideo} durationInFrames={904} fps={30} width={368} height={654} />
        </Folder>
        <Folder name="merzy-glam-tint">
          <Composition id="MerzyGlamTintAdam" calculateMetadata={renderTo('merzy-glam-tint')} component={MerzyGlamTintVideo} durationInFrames={1571} fps={60} width={720} height={1280} />
        </Folder>
        <Folder name="flower-knows-powder">
          <Composition id="FlowerKnowsPowderAdam" calculateMetadata={renderTo('flower-knows-powder')} component={FlowerKnowsPowderVideo} durationInFrames={958} fps={30} width={1080} height={1440} />
        </Folder>
      </Folder>
    </Folder>
  </>
);
