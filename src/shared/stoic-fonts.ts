import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

Promise.all([
  loadFont({family: 'Stoic Sans', url: staticFile('stoic/fonts/NotoSans-Bold.ttf'), weight: '700'}),
  loadFont({family: 'Stoic Sans', url: staticFile('stoic/fonts/NotoSans-Regular.ttf'), weight: '400'}),
]);
