import type {FC} from 'react';
import {BookThumbnail} from '../book-hvtt-001-overview/Thumbnail';

// YouTube thumbnail of episode 2 from the series template (title + real book cover, user 2026-11-05).
// Prepared only: never exported automatically.
export const BookAhThumbnail: FC = () => <BookThumbnail testId="book-ah-thumbnail" episode="02" title={['THAY ĐỔI TÍ HON', 'HIỆU QUẢ BẤT NGỜ']}
  titleSizes={[74, 74]} subtitle={['Tóm tắt Atomic Habits', 'của James Clear']} cover="book-ah-001-overview/thumbnail/book-cover.jpg" />;
