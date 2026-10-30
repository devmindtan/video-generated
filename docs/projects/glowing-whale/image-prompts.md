# Bộ prompt hình — Bé Cá Voi Phát Sáng

Tạo bằng imagegen tích hợp; mỗi cảnh là một ảnh riêng, không chia ô storyboard. Mẫu cảnh 1 làm identity reference cho 6 cảnh còn lại (cảnh 3 chỉ lấy phong cách, không có cá voi).

## 01-shy — mẫu nhân vật

Use case: illustration-story. Asset type: opening first-frame illustration for a vertical 9:16 children's 3D animated short, no writing. Premium Pixar-like feature-animation rendering, warm appealing soft forms and bioluminescent underwater world. One adorable chubby BABY BLUE WHALE named Bọt Biển, rounded sky-blue body, tiny navy-blue dorsal fin, exactly two small side flippers and a horizontal two-fluke tail; huge dark teal expressive eyes, small shy mouth, cream oval belly patch glowing golden yellow from within. No legs, no horn, no accessories. He hovers in three-quarter view by a rounded purple coral rock in deep teal water, looks shyly down at his glowing belly, flippers not yet covering it. Entire silhouette visible, subject centered in middle 60% of image, leave quiet water at top 20% and lower 16% for added titles later. Rounded cyan and purple glowing corals, golden motes, soft caustic light, gentle melancholy not distress or horror. Strong readable golden belly contrast. Single full-bleed portrait 9:16 image, no panels, text, logos or watermark.

## Phần chung cho cảnh 2–7

Use case: illustration-story. Create ONE full-bleed portrait 9:16 first-frame image for a children's premium 3D animated film. Input image is the identity reference for Bọt Biển ONLY, not a layout to repeat. Preserve exact rounded sky-blue baby whale, navy dorsal fin, teal eyes, cream oval golden glowing belly, two side flippers and two-fluke tail; no limbs/accessories added. Soft Pixar-like rendering, turquoise-violet coral world. Keep subjects in middle 65%, quiet top18% and bottom15% for later captions. No writing, text, watermark or panels.

## 02-turtle

One gentle old sea turtle with muted olive shell and small moss patches floats facing the baby whale in sunlit turquoise water near the same reef. Turtle is smiling, flipper still relaxed before a reassuring gesture; Bọt Biển listens shyly. Full subjects in a medium-wide shot, warm comforting caustics.

## 03-lost-fish

NO WHALE in this image. Exactly FIVE tiny adorable orange clownfish with white stripes huddle near the left wall inside a rounded dark-blue rocky underwater passage, worried but cute eyes, a faint cyan way out far above on the right. Readable soft dim blue fill light, smooth rocks not threatening spikes, no predators or scary disembodied eyes. Stable wide storybook cinematic composition.

## 04-brave

Bọt Biển alone just beneath the surface with his head near the waterline, facing down toward the rounded blue rocky passage at lower right. Determined but kind expression, oval belly emits warm gold light at moderate intensity before brightening. Visible open path down into blue water and bubbles, no fish yet. Stable medium-wide portrait framing, natural underwater perspective and anatomy.

Ảnh kết quả đặt Bọt Biển dưới mặt nước khá xa, nên motion/thoại cuối đã bỏ ý hít thở, chỉ giữ quyết định bơi xuống. Xem kịch bản và `veo.json` hiện hành, không dùng lại beat thở cũ.

## 05-guide

In a rounded blue underwater passage, Bọt Biển faces and swims toward the brighter open reef at upper right, exactly FIVE small orange white-striped clownfish behind his tail at lower left following him. His golden oval belly casts a broad warm light across blue rocks revealing cyan and pink corals. Clear directional composition toward the exit, all characters fully visible, no duplicated whale or fish in front.

## 06-reunion

Bọt Biển smiles in the center of a bright turquoise open coral reef, exactly FIVE orange white-striped baby clownfish arranged in a loose celebratory arc around him, not overlapping his face. His recognizable golden belly shines warmly, no turtle. Medium-wide readable composition, joyful colorful reef and soft bubble motes, safe and cheerful.

Ảnh này cũng là nền thumbnail, thêm chữ bằng Remotion để chữ tiếng Việt chính xác. Không tạo thêm ảnh thumbnail riêng hoặc render thumbnail tự động.

## 07-shine

At a peach-gold ocean sunset, Bọt Biển is just beginning a playful little breach above the calm waterline, single whale centered in a graceful arc, matching sky-blue head and glowing golden belly entirely visible; tail still near water, droplets suspended, small pastel rainbow in mist behind. Warm cheerful end scene, distant sea horizon, no real fireworks, no fish in air, no extra tail or flippers.

## Đường dẫn

Toàn bộ ảnh đã copy vào `public/glowing-whale/images/01-shy.png` đến `07-shine.png`, thêm bản kết chọn `07-shine-v2.png`. Prompt chuyển động nằm trong `scripts/projects/glowing-whale/veo.json`, bản kết hiện hành trong `veo-ending-v2.json`; `src/projects/glowing-whale/takes.json` chọn take cho runtime.

## 07-shine-v2 — bản kết đang chọn

Use case: illustration-story. Input image 1 is the exact identity reference of Bọt Biển; preserve his chubby round sky-blue baby body, huge teal eyes, tiny smile, oval golden glowing cream belly, navy dorsal fin, exactly two side flippers and two tail flukes. Create a new vertical 9:16 first-frame illustration for a 3D children's animated movie. Same premium soft 3D cartoon material and big expressive face, never a realistic whale. Calm peach-gold sunset ocean; Bọt Biển floats upright at the surface facing camera in a gentle three-quarter view, smiling, his round belly just above the small rolling waterline and tail submerged. This is a small playful bob, NOT a large airborne jump. Full round head and flippers clearly visible in central 60%, soft pastel rainbow in distant sea mist, warm reflected gold light. Keep open sky in top22% and water in lower18% for later titles. One whale only, no fish, no realistic throat pleats, no long stretched torso, no text/logos/panels/watermark.
