insert into public.menu_items (
  id,
  category_id,
  name,
  description,
  price,
  image_url,
  tags,
  allergens,
  sort_order
)
values
(
  'khai-vi-01',
  (select id from public.menu_categories where slug = 'khai-vi'),
  'Gỏi xoài tôm sú',
  'Xoài xanh thái sợi cùng tôm sú luộc vừa chín, rau thơm và đậu phộng rang, trộn với nước sốt chua cay pha tại bếp.',
  125000,
  '/images/mon-1.jpg',
  array['cay', 'ban-chay'],
  array['Tôm', 'Đậu phộng', 'Nước mắm'],
  1
),
(
  'khai-vi-02',
  (select id from public.menu_categories where slug = 'khai-vi'),
  'Bánh cuốn nấm rừng',
  'Lớp bánh cuốn tráng mỏng cuộn cùng nấm hương, nấm đùi gà và hành phi, dùng với nước chấm chay nhẹ vị.',
  95000,
  '/images/mon-2.jpg',
  array['chay'],
  array['Đậu nành'],
  2
),
(
  'khai-vi-03',
  (select id from public.menu_categories where slug = 'khai-vi'),
  'Chả giò hải sản',
  'Chả giò cuốn thủ công với tôm, mực, thịt cua và củ sắn, chiên vàng giòn rồi dùng cùng rau thơm và nước chấm pha riêng.',
  135000,
  '/images/mon-3.jpg',
  array['ban-chay'],
  array['Tôm', 'Mực', 'Cua', 'Trứng', 'Bột mì'],
  3
),
(
  'mon-chinh-01',
  (select id from public.menu_categories where slug = 'mon-chinh'),
  'Bò lúc lắc sốt tiêu xanh',
  'Thăn bò tuyển chọn được áp chảo ở nhiệt độ cao để giữ độ mềm, kết hợp sốt tiêu xanh, khoai tây chiên và salad rau củ.',
  185000,
  '/images/mon-4.jpg',
  array['cay', 'ban-chay'],
  array['Sữa', 'Mù tạt'],
  1
),
(
  'mon-chinh-02',
  (select id from public.menu_categories where slug = 'mon-chinh'),
  'Cá chẽm nướng muối ớt',
  'Cá chẽm tươi ướp muối ớt vừa vị rồi nướng trên than hồng, dùng kèm rau củ nướng và nước chấm chua cay.',
  245000,
  '/images/mon-5.jpg',
  array['cay', 'ban-chay'],
  array['Cá', 'Nước mắm'],
  2
),
(
  'mon-chinh-03',
  (select id from public.menu_categories where slug = 'mon-chinh'),
  'Mì Ý hải sản sốt kem',
  'Mì Ý luộc al dente trộn cùng tôm, mực và nghêu, phủ sốt kem tỏi thơm béo nhưng vẫn giữ vị ngọt của hải sản tươi.',
  165000,
  '/images/mon-6.jpg',
  array[]::text[],
  array['Tôm', 'Mực', 'Nghêu', 'Sữa', 'Bột mì'],
  3
),
(
  'mon-chinh-04',
  (select id from public.menu_categories where slug = 'mon-chinh'),
  'Cơm nấm rau củ sốt gừng',
  'Cơm gạo thơm dùng với nấm tươi, bông cải, cà rốt và đậu que xào sốt gừng, là lựa chọn nhẹ bụng cho bữa ăn trọn vị.',
  135000,
  '/images/mon-7.jpg',
  array['chay'],
  array['Đậu nành'],
  4
),
(
  'mon-chinh-05',
  (select id from public.menu_categories where slug = 'mon-chinh'),
  'Sườn non nướng mật ong',
  'Sườn non được ướp qua đêm với gia vị thảo mộc, nướng chậm rồi quét sốt mật ong nhà làm để tạo lớp vỏ thơm đậm đà.',
  225000,
  '/images/mon-8.jpg',
  array['ban-chay'],
  array['Mật ong', 'Đậu nành'],
  5
),
(
  'trang-mieng-01',
  (select id from public.menu_categories where slug = 'trang-mieng'),
  'Chè khúc bạch nhãn lồng',
  'Khúc bạch sữa tươi mềm mịn dùng cùng nhãn lồng tươi, nước đường hoa nhài thanh mát và hạnh nhân lát rang giòn.',
  75000,
  '/images/mon-9.jpg',
  array['chay'],
  array['Sữa', 'Hạnh nhân'],
  1
),
(
  'trang-mieng-02',
  (select id from public.menu_categories where slug = 'trang-mieng'),
  'Bánh flan cà phê',
  'Bánh flan hấp chậm từ trứng và sữa tươi, dùng cùng caramel cà phê rang xay tại quầy để kết thúc bữa ăn nhẹ nhàng.',
  65000,
  '/images/mon-10.jpg',
  array['ban-chay'],
  array['Trứng', 'Sữa'],
  2
),
(
  'do-uong-01',
  (select id from public.menu_categories where slug = 'do-uong'),
  'Trà đào cam sả',
  'Trà ô long ủ lạnh kết hợp đào ngâm, lát cam vàng và sả tươi, tạo nên thức uống thanh mát dùng ngon cùng các món nướng.',
  65000,
  '/images/mon-11.jpg',
  array[]::text[],
  array[]::text[],
  1
),
(
  'do-uong-02',
  (select id from public.menu_categories where slug = 'do-uong'),
  'Cà phê cốt dừa',
  'Cà phê rang mộc đậm thơm kết hợp cốt dừa xay mịn, cân bằng bằng một chút muối biển và dùng lạnh.',
  70000,
  '/images/mon-12.jpg',
  array['chay'],
  array[]::text[],
  2
);
