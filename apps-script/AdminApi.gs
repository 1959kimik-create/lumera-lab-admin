/**
 * LUMERA LAB 관리자 API (별도 Web App 배포)
 *
 * 설정:
 * 1. script.google.com > 새 프로젝트 생성
 * 2. 이 파일 붙여넣기
 * 3. SPREADSHEET_ID 를 문의 DB 시트 ID로 변경
 * 4. setupAdminPassword() 1회 실행 후 ADMIN_PASSWORD 변경
 * 5. Web App 배포 (실행: 나, 액세스: 모든 사용자)
 */
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const SHEET_NAME = 'INQUIRIES';
const COL = {
  SUBMITTED_AT: 1,
  INQUIRY_ID: 2,
  CATEGORY: 3,
  NAME: 4,
  EMAIL: 5,
  COMPANY: 6,
  PHONE: 7,
  PRODUCT: 8,
  MESSAGE: 9,
  PRIVACY: 10,
  STATUS: 11,
  EMAIL_STATUS: 12,
  MEMO: 13,
};

const STATUS_OPTIONS = ['NEW', 'IN_PROGRESS', 'DONE', 'CLOSED'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'login') {
      return jsonResponse(login(data.password));
    }

    if (!isAuthorized(data.token)) {
      return jsonResponse({ success: false, message: '인증이 필요합니다.' });
    }

    if (action === 'list') {
      return jsonResponse({ success: true, inquiries: listInquiries() });
    }

    if (action === 'update') {
      return jsonResponse(updateInquiry(data.inquiry_id, data.status, data.memo));
    }

    return jsonResponse({ success: false, message: '알 수 없는 action입니다.' });
  } catch (err) {
    return jsonResponse({ success: false, message: String(err) });
  }
}

function setupAdminPassword() {
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD', 'lumera-admin-2026');
  Logger.log('초기 비밀번호: lumera-admin-2026 (Apps Script에서 변경하세요)');
}

function login(password) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected) {
    return { success: false, message: '관리자 비밀번호가 설정되지 않았습니다. setupAdminPassword()를 실행하세요.' };
  }
  if (password !== expected) {
    return { success: false, message: '비밀번호가 올바르지 않습니다.' };
  }
  const token = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty('ADMIN_TOKEN', token);
  return { success: true, token: token };
}

function isAuthorized(token) {
  const valid = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');
  return token && valid && token === valid;
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('INQUIRIES 시트를 찾을 수 없습니다.');
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const headers = sheet.getRange(1, 1, 1, COL.MEMO).getValues()[0];
  const required = [
    ['submitted_at', COL.SUBMITTED_AT],
    ['inquiry_id', COL.INQUIRY_ID],
    ['category', COL.CATEGORY],
    ['name', COL.NAME],
    ['email', COL.EMAIL],
    ['company', COL.COMPANY],
    ['phone', COL.PHONE],
    ['product', COL.PRODUCT],
    ['message', COL.MESSAGE],
    ['privacy_agree', COL.PRIVACY],
    ['status', COL.STATUS],
    ['email_status', COL.EMAIL_STATUS],
    ['memo', COL.MEMO],
  ];
  required.forEach(function (pair) {
    if (!headers[pair[1] - 1]) {
      sheet.getRange(1, pair[1]).setValue(pair[0]);
    }
  });
}

function listInquiries() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const rows = sheet.getRange(2, 1, lastRow, COL.MEMO).getValues();
  return rows
    .map(function (row, index) {
      return {
        row_number: index + 2,
        submitted_at: row[COL.SUBMITTED_AT - 1],
        inquiry_id: row[COL.INQUIRY_ID - 1],
        category: row[COL.CATEGORY - 1],
        name: row[COL.NAME - 1],
        email: row[COL.EMAIL - 1],
        company: row[COL.COMPANY - 1],
        phone: row[COL.PHONE - 1],
        product: row[COL.PRODUCT - 1],
        message: row[COL.MESSAGE - 1],
        status: row[COL.STATUS - 1] || 'NEW',
        email_status: row[COL.EMAIL_STATUS - 1] || '',
        memo: row[COL.MEMO - 1] || '',
      };
    })
    .reverse();
}

function updateInquiry(inquiryId, status, memo) {
  if (!inquiryId) {
    return { success: false, message: 'inquiry_id가 필요합니다.' };
  }
  if (status && STATUS_OPTIONS.indexOf(status) === -1) {
    return { success: false, message: '허용되지 않은 status 값입니다.' };
  }

  const sheet = getSheet_();
  const rowNumber = findRowByInquiryId_(sheet, inquiryId);
  if (rowNumber === -1) {
    return { success: false, message: '문의를 찾을 수 없습니다.' };
  }

  if (status) {
    sheet.getRange(rowNumber, COL.STATUS).setValue(status);
  }
  if (typeof memo === 'string') {
    sheet.getRange(rowNumber, COL.MEMO).setValue(memo);
  }

  return {
    success: true,
    inquiry_id: inquiryId,
    status: status || sheet.getRange(rowNumber, COL.STATUS).getValue(),
    memo: typeof memo === 'string' ? memo : sheet.getRange(rowNumber, COL.MEMO).getValue(),
  };
}

function findRowByInquiryId_(sheet, inquiryId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const ids = sheet.getRange(2, COL.INQUIRY_ID, lastRow, COL.INQUIRY_ID).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(inquiryId)) {
      return i + 2;
    }
  }
  return -1;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
