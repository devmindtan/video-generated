# Sổ ngân sách API theo Short

Giới hạn: **20.000₫ tổng cộng cho một project Short**, gồm mọi cảnh, model, take và lần thử lại kể từ khi áp dụng quy tắc này. Không phải 20.000₫ mỗi request. Gói Gemini/Flow dùng hạn mức của tài khoản, không lấy tiền từ sổ API này.

Các sổ `shorts/<project>.json` được tạo khi giữ chỗ chi phí lần đầu; chúng nằm ngoài `.cache/` để dọn cache không làm mất bộ đếm. Không xóa/reset/đổi tên project để né trần. Sao lưu sổ và lịch sử job cùng nhau, không ghi đè sổ bằng bản git cũ. Các request lỗi, bị chặn, không rõ trạng thái hoặc đã thành công đều giữ nguyên phần tiền dự phòng; chỉ đối soát thủ công với hóa đơn mới có thể điều chỉnh, không hoàn tiền tự động.

Không dùng sổ này để suy ra hóa đơn lịch sử hoặc trần thanh toán toàn tài khoản. Các video có sẵn được tạo trước quy tắc mới vẫn giữ asset/lịch sử, không được gán chi phí giả là 0₫. Nếu phát hiện job Gemini cũ mà không có sổ tương ứng, công cụ dừng để yêu cầu đối soát.

Giá model và tỷ giá phải có nguồn, còn mới (tối đa 7 ngày); thiếu dữ liệu hoặc vượt dự toán thì từ chối gửi. Hiện tỷ giá chưa xác nhận nên tạo video API vẫn bị khóa. Khoản dự phòng tính toàn bộ giây nguồn được yêu cầu (kể cả chỉ cắt dùng một phần) và hệ số dự phòng phí/thuế tối thiểu 1,20. Đây là giới hạn dự toán cục bộ, không thể cam kết hóa đơn Google không lệch vì thay đổi giá, tỷ giá hoặc độ trễ tính phí.
