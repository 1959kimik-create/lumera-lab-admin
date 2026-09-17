# LUMERA LAB Admin

랜딩 페이지 문의(Google Sheets `INQUIRIES`)를 관리하는 관리자 페이지입니다.

- 랜딩: https://lumera-lab-landing.vercel.app
- 관리자: https://6lumera-lab-admin.vercel.app
- GitHub: https://github.com/1959kimik-create/lumera-lab-admin

## 기능

- 문의 목록 조회 (최신순)
- K열 `status` 변경: NEW / IN_PROGRESS / DONE / CLOSED
- M열 `memo` 비고 저장
- 상태 필터, 새로고침

## 시트 열 구조

| 열 | 필드 |
|----|------|
| A~J | 랜딩 문의 폼 데이터 |
| K | status (처리상태) |
| L | email_status (메일 발송 결과) |
| M | memo (관리자 비고) |

## 1. Google Apps Script (Admin API)

1. https://script.google.com > **새 프로젝트**
2. `apps-script/AdminApi.gs` 내용 붙여넣기
3. `SPREADSHEET_ID` 를 문의 DB 시트 ID로 변경  
   (시트 URL: `https://docs.google.com/spreadsheets/d/여기가_ID/edit`)
4. 함수 `setupAdminPassword` 실행 > 초기 비밀번호 설정  
   (기본: `lumera-admin-2026` — Apps Script > 프로젝트 설정 > 스크립트 속성에서 변경)
5. **배포 > 새 배포 > 웹 앱**  
   - 실행: 나  
   - 액세스: 모든 사용자  
6. Web App URL 복사

## 2. 관리자 페이지 설정

`js/config.js`:

```javascript
const ADMIN_API_URL = 'https://script.google.com/macros/s/xxxxx/exec';
```

## 3. 로컬 실행

```bash
npx serve .
```

## 4. Vercel 배포

```bash
npx vercel deploy --prod
```

## 보안

- 관리자 비밀번호는 Apps Script 스크립트 속성에 저장
- 로그인 후 sessionStorage에 token 저장
- 검색 엔진 노출 방지 (`noindex`)
