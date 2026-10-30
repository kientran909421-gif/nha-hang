export type MenuCategory =
  | "Khai vị"
  | "Món chính"
  | "Tráng miệng"
  | "Đồ uống";

export type MenuTag = "chay" | "cay" | "bán chạy";

export type MenuItem = {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  category: MenuCategory;
  image: string;
  tags: MenuTag[];
  allergens: string[];
};

export const menuItems: MenuItem[] = [
  {
    id: "khai-vi-01",
    name: "Gỏi xoài tôm sú",
    shortDescription: "Xoài xanh giòn, tôm sú và rau thơm trộn sốt chua cay.",
    description:
      "Xoài xanh thái sợi cùng tôm sú luộc vừa chín, rau thơm và đậu phộng rang, trộn với nước sốt chua cay pha tại bếp.",
    price: 125000,
    category: "Khai vị",
    image: "/images/mon-1.jpg",
    tags: ["cay", "bán chạy"],
    allergens: ["Tôm", "Đậu phộng", "Nước mắm"],
  },
  {
    id: "khai-vi-02",
    name: "Bánh cuốn nấm rừng",
    shortDescription: "Bánh cuốn mềm mỏng, nhân nấm rừng xào thơm thanh.",
    description:
      "Lớp bánh cuốn tráng mỏng cuộn cùng nấm hương, nấm đùi gà và hành phi, dùng với nước chấm chay nhẹ vị.",
    price: 95000,
    category: "Khai vị",
    image: "/images/mon-2.jpg",
    tags: ["chay"],
    allergens: ["Đậu nành"],
  },
  {
    id: "khai-vi-03",
    name: "Chả giò hải sản",
    shortDescription: "Vỏ giòn rụm, nhân tôm mực đậm đà, ăn kèm rau sống.",
    description:
      "Chả giò cuốn thủ công với tôm, mực, thịt cua và củ sắn, chiên vàng giòn rồi dùng cùng rau thơm và nước chấm pha riêng.",
    price: 135000,
    category: "Khai vị",
    image: "/images/mon-3.jpg",
    tags: ["bán chạy"],
    allergens: ["Tôm", "Mực", "Cua", "Trứng", "Bột mì"],
  },
  {
    id: "mon-chinh-01",
    name: "Bò lúc lắc sốt tiêu xanh",
    shortDescription: "Thăn bò mềm mọng, áp chảo nhanh với tiêu xanh thơm nồng.",
    description:
      "Thăn bò tuyển chọn được áp chảo ở nhiệt độ cao để giữ độ mềm, kết hợp sốt tiêu xanh, khoai tây chiên và salad rau củ.",
    price: 185000,
    category: "Món chính",
    image: "/images/mon-4.jpg",
    tags: ["cay", "bán chạy"],
    allergens: ["Sữa", "Mù tạt"],
  },
  {
    id: "mon-chinh-02",
    name: "Cá chẽm nướng muối ớt",
    shortDescription: "Cá chẽm tươi nướng than, da giòn và thịt ngọt tự nhiên.",
    description:
      "Cá chẽm tươi ướp muối ớt vừa vị rồi nướng trên than hồng, dùng kèm rau củ nướng và nước chấm chua cay.",
    price: 245000,
    category: "Món chính",
    image: "/images/mon-5.jpg",
    tags: ["cay", "bán chạy"],
    allergens: ["Cá", "Nước mắm"],
  },
  {
    id: "mon-chinh-03",
    name: "Mì Ý hải sản sốt kem",
    shortDescription: "Mì Ý dai vừa, tôm mực tươi trong sốt kem béo nhẹ.",
    description:
      "Mì Ý luộc al dente trộn cùng tôm, mực và nghêu, phủ sốt kem tỏi thơm béo nhưng vẫn giữ vị ngọt của hải sản tươi.",
    price: 165000,
    category: "Món chính",
    image: "/images/mon-6.jpg",
    tags: [],
    allergens: ["Tôm", "Mực", "Nghêu", "Sữa", "Bột mì"],
  },
  {
    id: "mon-chinh-04",
    name: "Cơm nấm rau củ sốt gừng",
    shortDescription: "Cơm nóng, nấm và rau củ theo mùa trong sốt gừng thanh.",
    description:
      "Cơm gạo thơm dùng với nấm tươi, bông cải, cà rốt và đậu que xào sốt gừng, là lựa chọn nhẹ bụng cho bữa ăn trọn vị.",
    price: 135000,
    category: "Món chính",
    image: "/images/mon-7.jpg",
    tags: ["chay"],
    allergens: ["Đậu nành"],
  },
  {
    id: "mon-chinh-05",
    name: "Sườn non nướng mật ong",
    shortDescription: "Sườn non nướng mềm, phủ lớp sốt mật ong óng ánh.",
    description:
      "Sườn non được ướp qua đêm với gia vị thảo mộc, nướng chậm rồi quét sốt mật ong nhà làm để tạo lớp vỏ thơm đậm đà.",
    price: 225000,
    category: "Món chính",
    image: "/images/mon-8.jpg",
    tags: ["bán chạy"],
    allergens: ["Mật ong", "Đậu nành"],
  },
  {
    id: "trang-mieng-01",
    name: "Chè khúc bạch nhãn lồng",
    shortDescription: "Khúc bạch mềm mát, nhãn lồng và hạnh nhân rang thơm.",
    description:
      "Khúc bạch sữa tươi mềm mịn dùng cùng nhãn lồng tươi, nước đường hoa nhài thanh mát và hạnh nhân lát rang giòn.",
    price: 75000,
    category: "Tráng miệng",
    image: "/images/mon-9.jpg",
    tags: ["chay"],
    allergens: ["Sữa", "Hạnh nhân"],
  },
  {
    id: "trang-mieng-02",
    name: "Bánh flan cà phê",
    shortDescription: "Flan mịn mượt, vị cà phê dịu và caramel không quá ngọt.",
    description:
      "Bánh flan hấp chậm từ trứng và sữa tươi, dùng cùng caramel cà phê rang xay tại quầy để kết thúc bữa ăn nhẹ nhàng.",
    price: 65000,
    category: "Tráng miệng",
    image: "/images/mon-10.jpg",
    tags: ["bán chạy"],
    allergens: ["Trứng", "Sữa"],
  },
  {
    id: "do-uong-01",
    name: "Trà đào cam sả",
    shortDescription: "Trà ô long thơm, đào ngâm, cam tươi và sả.",
    description:
      "Trà ô long ủ lạnh kết hợp đào ngâm, lát cam vàng và sả tươi, tạo nên thức uống thanh mát dùng ngon cùng các món nướng.",
    price: 65000,
    category: "Đồ uống",
    image: "/images/mon-11.jpg",
    tags: [],
    allergens: [],
  },
  {
    id: "do-uong-02",
    name: "Cà phê cốt dừa",
    shortDescription: "Cà phê đậm vị, cốt dừa mịn béo và đá xay mát lạnh.",
    description:
      "Cà phê rang mộc đậm thơm kết hợp cốt dừa xay mịn, cân bằng bằng một chút muối biển và dùng lạnh.",
    price: 70000,
    category: "Đồ uống",
    image: "/images/mon-12.jpg",
    tags: ["chay"],
    allergens: [],
  },
];
