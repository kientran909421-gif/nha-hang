export const site = {
  name: "Tên Nhà Hàng",
  address: "123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  phone: "090 123 4567",
  email: "hello@tennhahang.vn",
  phoneHref: "tel:+84901234567",
  openingHours: "10:00 - 22:00 mỗi ngày",
  openingHoursSchedule: [
    { day: "Thứ 2 - Chủ nhật", hours: "10:00 - 22:00" },
  ],
  copyrightYear: "2026",
  heroTitle: "Một bữa ăn ngon bắt đầu từ những điều chân thành",
  heroTagline:
    "Từ nguyên liệu tươi mỗi ngày đến căn bếp tận tâm, chúng tôi mang đến những bữa ăn ấm áp cho người mình thương.",
  heroImageUrl: "/images/hero.jpg",
  storyTitle: "Nấu ăn bằng ký ức, phục vụ bằng cả tấm lòng",
  storyContent:
    "Nhà hàng bắt đầu từ căn bếp nhỏ và mong muốn lưu giữ những hương vị thân quen của bữa cơm Việt. Mỗi ngày, chúng tôi chọn nguyên liệu cẩn thận, nấu vừa đủ và đón tiếp mỗi vị khách như một người bạn.",
  storyImageUrl: "/images/cau-chuyen.jpg",
  signatureCount: 4,
  mapEmbedUrl:
    "https://www.google.com/maps?q=Nguyen+Hue,+District+1,+Ho+Chi+Minh+City&output=embed",
  seo: {
    title: "Tên Nhà Hàng | Đặt bàn trực tuyến",
    description:
      "Đặt bàn trực tuyến và thưởng thức những món ăn được chuẩn bị tận tâm từ nguyên liệu tươi mỗi ngày.",
  },
  socialLinks: {
    facebook: "#",
    instagram: "#",
    zalo: "#",
  },
} as const;

export const defaultPromotions = [
  {
    id: "default-lunch",
    title: "Bữa trưa trọn vị",
    description: "Tặng món tráng miệng cho bàn từ hai người.",
    imageUrl: "/images/uu-dai-1.jpg",
  },
  {
    id: "default-weekend",
    title: "Hẹn hò cuối tuần",
    description: "Ưu đãi đặc biệt cho những buổi tối đáng nhớ.",
    imageUrl: "/images/uu-dai-2.jpg",
  },
] as const;

export const defaultTestimonials = [
  {
    id: "default-minh-anh",
    quote:
      "Không gian ấm cúng, món ăn tinh tế và nhân viên phục vụ rất chu đáo.",
    name: "Minh Anh",
    stars: 5,
  },
  {
    id: "default-hoang-nam",
    quote:
      "Bữa tối tuyệt vời cho cả gia đình. Món nào cũng vừa miệng, trình bày đẹp.",
    name: "Hoàng Nam",
    stars: 5,
  },
  {
    id: "default-thu-ha",
    quote:
      "Mình đặc biệt thích món cá chẽm nướng và cách nhà hàng chăm chút từng chi tiết.",
    name: "Thu Hà",
    stars: 4,
  },
] as const;
