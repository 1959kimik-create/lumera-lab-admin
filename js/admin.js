(function () {
  'use strict';

  const TOKEN_KEY = 'lumera_admin_token';
  const STATUS_OPTIONS = [
    { value: 'NEW', label: 'NEW - 신규' },
    { value: 'IN_PROGRESS', label: 'IN_PROGRESS - 상담중' },
    { value: 'DONE', label: 'DONE - 완료' },
    { value: 'CLOSED', label: 'CLOSED - 종료' },
  ];

  const loginView = document.getElementById('loginView');
  const adminView = document.getElementById('adminView');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const inquiryList = document.getElementById('inquiryList');
  const emptyState = document.getElementById('emptyState');
  const inquiryCount = document.getElementById('inquiryCount');
  const filterStatus = document.getElementById('filterStatus');
  const refreshBtn = document.getElementById('refreshBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  let inquiries = [];

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
  }

  function showLogin() {
    loginView.hidden = false;
    adminView.hidden = true;
  }

  function showAdmin() {
    loginView.hidden = true;
    adminView.hidden = false;
  }

  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.hidden = !msg;
  }

  async function apiCall(payload) {
    if (typeof ADMIN_API_URL !== 'string' || ADMIN_API_URL.indexOf('YOUR_ADMIN') === 0) {
      throw new Error('js/config.js 에 Admin API URL을 설정해 주세요.');
    }

    const response = await fetch(ADMIN_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || '요청에 실패했습니다.');
    }
    return result;
  }

  async function login(password) {
    const result = await apiCall({ action: 'login', password: password });
    setToken(result.token);
    showAdmin();
    await loadInquiries();
  }

  async function loadInquiries() {
    const result = await apiCall({ action: 'list', token: getToken() });
    inquiries = result.inquiries || [];
    renderInquiries();
  }

  async function saveInquiry(inquiryId, status, memo) {
    return apiCall({
      action: 'update',
      token: getToken(),
      inquiry_id: inquiryId,
      status: status,
      memo: memo,
    });
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderInquiries() {
    const filter = filterStatus.value;
    const filtered = filter
      ? inquiries.filter(function (item) {
          return item.status === filter;
        })
      : inquiries;

    inquiryCount.textContent = filtered.length + '건';
    inquiryList.innerHTML = '';
    emptyState.hidden = filtered.length > 0;

    filtered.forEach(function (item) {
      inquiryList.appendChild(createInquiryCard(item));
    });
  }

  function createInquiryCard(item) {
    const card = document.createElement('article');
    card.className = 'inquiry-card';
    card.dataset.inquiryId = item.inquiry_id;

    const statusOptions = STATUS_OPTIONS.map(function (opt) {
      const selected = item.status === opt.value ? ' selected' : '';
      return '<option value="' + opt.value + '"' + selected + '>' + escapeHtml(opt.label) + '</option>';
    }).join('');

    card.innerHTML =
      '<div class="inquiry-card__head">' +
      '<div>' +
      '<p class="inquiry-id">' +
      escapeHtml(item.inquiry_id) +
      '</p>' +
      '<p class="inquiry-meta">' +
      escapeHtml(item.submitted_at) +
      ' · ' +
      escapeHtml(item.category) +
      '</p>' +
      '</div>' +
      '<span class="badge badge--' +
      escapeHtml(item.status || 'NEW') +
      '">' +
      escapeHtml(item.status || 'NEW') +
      '</span>' +
      '</div>' +
      '<div class="inquiry-grid">' +
      '<div><span class="field-label">이름</span><p>' +
      escapeHtml(item.name) +
      '</p></div>' +
      '<div><span class="field-label">이메일</span><p>' +
      escapeHtml(item.email) +
      '</p></div>' +
      '<div><span class="field-label">회사명</span><p>' +
      escapeHtml(item.company || '-') +
      '</p></div>' +
      '<div><span class="field-label">연락처</span><p>' +
      escapeHtml(item.phone || '-') +
      '</p></div>' +
      '<div class="span-2"><span class="field-label">관심 제품</span><p>' +
      escapeHtml(item.product || '-') +
      '</p></div>' +
      '<div class="span-2"><span class="field-label">문의 내용</span><p class="message">' +
      escapeHtml(item.message) +
      '</p></div>' +
      '</div>' +
      '<div class="inquiry-edit">' +
      '<div class="form-group">' +
      '<label>처리상태 (K열)</label>' +
      '<select class="status-select">' +
      statusOptions +
      '</select>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>비고 (M열)</label>' +
      '<textarea class="memo-input" rows="3">' +
      escapeHtml(item.memo) +
      '</textarea>' +
      '</div>' +
      '<p class="save-msg" hidden></p>' +
      '<button type="button" class="btn btn--primary save-btn">저장</button>' +
      '</div>';

    const saveBtn = card.querySelector('.save-btn');
    const saveMsg = card.querySelector('.save-msg');
    const statusSelect = card.querySelector('.status-select');
    const memoInput = card.querySelector('.memo-input');

    saveBtn.addEventListener('click', async function () {
      saveBtn.disabled = true;
      saveMsg.hidden = true;

      try {
        await saveInquiry(item.inquiry_id, statusSelect.value, memoInput.value.trim());
        item.status = statusSelect.value;
        item.memo = memoInput.value.trim();
        card.querySelector('.badge').className = 'badge badge--' + item.status;
        card.querySelector('.badge').textContent = item.status;
        saveMsg.textContent = '저장되었습니다.';
        saveMsg.className = 'save-msg save-msg--ok';
        saveMsg.hidden = false;
      } catch (err) {
        saveMsg.textContent = err.message || '저장에 실패했습니다.';
        saveMsg.className = 'save-msg save-msg--err';
        saveMsg.hidden = false;
      } finally {
        saveBtn.disabled = false;
      }
    });

    return card;
  }

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    showLoginError('');
    const password = document.getElementById('password').value;

    try {
      await login(password);
    } catch (err) {
      showLoginError(err.message || '로그인에 실패했습니다.');
    }
  });

  filterStatus.addEventListener('change', renderInquiries);

  refreshBtn.addEventListener('click', async function () {
    try {
      await loadInquiries();
    } catch (err) {
      alert(err.message || '새로고침에 실패했습니다.');
    }
  });

  logoutBtn.addEventListener('click', function () {
    clearToken();
    showLogin();
  });

  if (getToken()) {
    showAdmin();
    loadInquiries().catch(function () {
      clearToken();
      showLogin();
    });
  } else {
    showLogin();
  }
})();
