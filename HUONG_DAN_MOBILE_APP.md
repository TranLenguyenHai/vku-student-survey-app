# Hướng Dẫn Sử Dụng & Cài Đặt Ứng Dụng Di Động VKU Survey

Dự án này đã được nâng cấp thành **Ứng dụng di động Đa nền tảng (Cross-Platform)** bằng công nghệ **Capacitor**:
* **Android**: Có sẵn thư mục `android/` để mở trực tiếp trong **Android Studio** (đáp ứng yêu cầu của thầy).
* **iOS**: Tự động biên dịch file **`.ipa`** qua **GitHub Actions** để cài đặt trực tiếp vào iPhone qua **Sideloadly**.
* **Capgo**: Tích hợp sẵn nền tảng Live Update để cập nhật app qua mạng mà không cần cài lại file `.ipa`.

---

## 1. Dành Cho Thầy: Mở Bằng Android Studio Trên Windows

Khi thầy giáo yêu cầu kiểm tra hoặc chấm điểm dự án Android:
1. Mở phần mềm **Android Studio** trên máy tính.
2. Chọn **File > Open** (hoặc nút **Open** ở màn hình khởi động).
3. Duyệt đến thư mục của dự án và chọn thư mục con: `android/` (ví dụ: `.../vku-student-survey-pwa/android`).
4. Chờ Android Studio đồng bộ Gradle (khoảng 1 - 2 phút ở lần đầu tiên).
5. Để chạy app:
   * Chọn máy ảo (Emulator) hoặc cắm điện thoại Android bật chế độ USB Debugging.
   * Nhấn nút **Run ▶** (màu xanh lá cây).
6. Để xuất file `.apk`:
   * Vào menu **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   * Sau khi hoàn tất, nhấn **locate** để lấy file `app-debug.apk`.

---

## 2. Dành Cho Bạn: Cài Đặt File `.ipa` Vào iPhone Qua Sideloadly

Vì máy tính chạy Windows, chúng ta sử dụng **GitHub Actions** để tự động build file `.ipa` trên máy Mac của GitHub.

### Bước 2.1: Tải file `.ipa` từ GitHub
1. Vào repository của bạn trên GitHub.
2. Nhấn vào tab **Actions**.
3. Chọn workflow **Build iOS IPA Package** mới nhất (dấu tích xanh ✅).
4. Cuộn xuống phần **Artifacts** ở dưới cùng và nhấn tải về file: `VKU_Survey_iOS_IPA.zip`.
5. Giải nén file zip ra để lấy file `VKU_Survey_iOS.ipa`.

### Bước 2.2: Cài vào iPhone bằng Sideloadly trên Windows
1. Tải và cài đặt phần mềm **Sideloadly** trên máy tính Windows: [https://sideloadly.io](https://sideloadly.io).
2. Đảm bảo máy tính đã cài đặt **iTunes** (bản non-Microsoft Store tải trực tiếp từ Apple hoặc link trên trang Sideloadly).
3. Kết nối iPhone với máy tính bằng cáp Lightning / Type-C. Trên iPhone, chọn **"Tin cậy máy tính này" (Trust this computer)** và nhập mật mã mở khóa màn hình.
4. Mở phần mềm Sideloadly:
   * Kéo thả file `VKU_Survey_iOS.ipa` vào ô hình vuông có biểu tượng IPA.
   * Nhập **Apple ID** cá nhân của bạn (tài khoản iCloud thông thường, hoàn toàn miễn phí).
   * Nhấn nút **Start**. Nhập mật khẩu Apple ID khi được yêu cầu để Sideloadly ký chứng chỉ tạm 7 ngày.
5. Chờ thanh tiến trình báo `Done.`. Ứng dụng **VKU Survey** sẽ xuất hiện trên màn hình chính iPhone của bạn!

### Bước 2.3: Tin cậy ứng dụng trên iPhone (chỉ làm lần đầu)
1. Trên iPhone, mở **Cài đặt (Settings)** > **Cài đặt chung (General)**.
2. Chọn **Quản lý VPN & Thiết bị (VPN & Device Management)**.
3. Trong mục *Ứng dụng nhà phát triển (Developer App)*, nhấn vào Apple ID của bạn.
4. Nhấn **Tin cậy (Trust)...** và xác nhận.
5. Quay lại màn hình chính và mở app VKU Survey lên sử dụng!

---

## 3. Tích Hợp Capgo Live Update (Cập Nhật Không Cần Cài Lại App)

Sau khi app đã nằm trên iPhone của bạn, bạn có thể chỉnh sửa giao diện web và đẩy cập nhật trực tiếp vào điện thoại:

1. Đăng ký tài khoản miễn phí tại: [https://capgo.app](https://capgo.app) (Đăng nhập bằng tài khoản GitHub).
2. Tạo ứng dụng mới với App ID: `com.vku.survey`.
3. Lấy **API Key** trong phần Settings của Capgo.
4. Khi có thay đổi code giao diện, bạn chỉ cần chạy lệnh trên máy tính:
   ```bash
   npx @capgo/cli bundle upload -a com.vku.survey -k <YOUR_CAPGO_API_KEY> -c production
   ```
5. Ngay lập tức, lần tiếp theo bạn mở app trên iPhone, app sẽ tự động tải bản cập nhật mới nhất từ Capgo về mà bạn không cần phải cắm cáp cài lại file `.ipa`!
