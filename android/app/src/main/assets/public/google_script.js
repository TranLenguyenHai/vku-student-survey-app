/**
 * Google Apps Script - VKU Student Survey Database API
 * 
 * HƯỚNG DẪN THIẾT LẬP (1 PHÚT):
 * 1. Mở trang Google Sheets mới (https://sheets.new)
 * 2. Đặt tiêu đề các cột ở Dòng 1:
 *    A1: Thời gian | B1: Họ và Tên | C1: Mã Sinh Viên | D1: Khoa / Lớp | E1: Hệ Điều Hành | F1: Thời Gian Dùng (Giờ) | G1: Đánh Giá Wifi (1-5) | H1: Đánh Giá Lab (1-5) | I1: Tính Năng App Mong Muốn | J1: Trạng Thái Gửi
 * 3. Vào Tiện ích mở rộng (Extensions) -> Apps Script
 * 4. Dán toàn bộ mã nguồn này vào editor và nhấn Lưu (Ctrl+S)
 * 5. Bấm nút "Triển khai" (Deploy) -> "Triển khai dưới dạng ứng dụng web" (New deployment)
 * 6. Chọn:
 *    - Thực thi dưới dạng (Execute as): Me (Email của bạn)
 *    - Ai có quyền truy cập (Who has access): Anyone (Bất kỳ ai)
 * 7. Bấm "Triển khai" -> Cấp quyền truy cập -> Cập nhật URL Web App vào Form VKU Survey!
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getActiveSheet();

    var data = JSON.parse(e.postData.contents);

    var timestamp = new Date();
    var fullName = data.fullName || '';
    var studentId = data.studentId || '';
    var facultyClass = data.facultyClass || '';
    var osPlatform = data.osPlatform || '';
    var dailyHours = data.dailyHours || '';
    var wifiRating = data.wifiRating || '';
    var labRating = data.labRating || '';
    var desiredFeatures = data.desiredFeatures || '';
    var syncMode = data.syncMode || 'Online';

    // Append Row
    sheet.appendRow([
      timestamp,
      fullName,
      studentId,
      facultyClass,
      osPlatform,
      dailyHours,
      wifiRating,
      labRating,
      desiredFeatures,
      syncMode
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "message": "Dữ liệu đã lưu thành công vào Google Sheet!" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ "status": "VKU Survey Google Sheets API Endpoint is Active!" }))
    .setMimeType(ContentService.MimeType.JSON);
}
